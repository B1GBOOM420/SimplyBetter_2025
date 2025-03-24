import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ColorResolvable,
    EmbedBuilder,
    PermissionsString,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils, MessageUtils, RegexUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import ModerationSchema from '../../database/ModerationSchema.js';
import UserActionCountSchema from '../../database/UserActionCountSchema.js';

export class CheckUserCommand implements Command {
    public names = [Lang.getRef('userCommands.checkUserCommand', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: UserContextMenuCommandInteraction, data: EventData): Promise<void> {
        const { guild } = intr;

        const targetUserID = intr.targetUser.id;

        const MemberObj = await guild.members.fetch(targetUserID);
        if (!MemberObj) {
            InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.memberNotFound', data.lang),
                true
            );
            return;
        }

        const dbUserChatData = await UserActionCountSchema.findOne({
            discord_id: MemberObj.user.id,
        });

        const userMsgCount = dbUserChatData?.messageCount;
        const userReactionCount = dbUserChatData?.reactionCount;

        const roles = MemberObj.roles.cache
            .map(r => `<@&${r.id}>`)
            .slice(0, -1)
            .join(' ');

        const roleHolder: string = roles.length > 0 ? roles : 'User has no roles';

        const NickName: string = MemberObj.nickname
            ? `aka ${MemberObj.nickname}`
            : 'No Nickname Set';
        const msgCount: string = userMsgCount ? `${userMsgCount}` : '0';
        const reactCount: string = dbUserChatData ? `${userReactionCount}` : '0';

        // Create an array to store all embeds
        const embeds: EmbedBuilder[] = [];

        // Add the main user info embed
        const userInfoEmbed = Lang.getEmbed('displayEmbeds.check', data.lang, {
            MEMBERAT: `<@${MemberObj.user.id}>`,
            MEMBERUSERTAG: MemberObj.user.tag,
            AVATAR: MemberObj.user.displayAvatarURL(),
            MOD_NAME: `${intr.user.tag} ( ${intr.user.id} )`,
            MEMBERNICKNAME: NickName,
            JOINDISCORDTIME: MemberObj.user.createdAt.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            JOINUSTIME: MemberObj.joinedAt.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            ROLEHOLDER: roleHolder,
            MSGCOUNT: msgCount,
            REACTIONCOUNT: reactCount,
            USERID: MemberObj.user.id,
            TIMEHOLDER: new Date().toString(),
        });
        embeds.push(userInfoEmbed);

        const moderationsFromDataBase = await ModerationSchema.find({
            discord_id: MemberObj.user.id,
        });

        const posts = moderationsFromDataBase.filter(item => item.type === 'note');
        const infractions = moderationsFromDataBase.filter(
            item =>
                item.type === 'warn' ||
                item.type === 'mute' ||
                item.type === 'unmute' ||
                item.type === 'timeout'
        );

        // Add embeds for logs if they exist
        if (posts.length > 0) {
            const notesEmbed = await this.createLogsEmbed(
                MemberObj.user.tag,
                MemberObj.user.id,
                posts,
                'Notes'
            );
            embeds.push(notesEmbed);
        } else {
            const noNotesEmbed = this.createNoLogsEmbed(
                data,
                MemberObj.user.tag,
                MemberObj.user.id,
                'Notes'
            );
            embeds.push(noNotesEmbed);
        }

        if (infractions.length > 0) {
            const infractionsEmbed = await this.createLogsEmbed(
                MemberObj.user.tag,
                MemberObj.user.id,
                infractions,
                'Infractions'
            );
            embeds.push(infractionsEmbed);
        } else {
            const noInfractionsEmbed = this.createNoLogsEmbed(
                data,
                MemberObj.user.tag,
                MemberObj.user.id,
                'Infractions'
            );
            embeds.push(noInfractionsEmbed);
        }

        // Create buttons
        const warnButton = new ButtonBuilder()
            .setCustomId(Lang.getCom('buttonNames.warn'))
            .setLabel('Warn')
            .setStyle(ButtonStyle.Danger);

        const timeoutButton = new ButtonBuilder()
            .setCustomId(Lang.getCom('buttonNames.timeOut'))
            .setLabel('Timeout')
            .setStyle(ButtonStyle.Danger);

        const banButton = new ButtonBuilder()
            .setCustomId(Lang.getCom('buttonNames.ban'))
            .setLabel('Ban')
            .setStyle(ButtonStyle.Danger);

        // Create an action row and add buttons to it
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            warnButton,
            timeoutButton,
            banButton
        );

        // Send all embeds and the action row in one message

        await MessageUtils.sendToModChannel(guild, {
            embeds,
            components: [actionRow],
        });

        await InteractionUtils.editReply(
            intr,
            `Your check command has been run in <#${Lang.getCom('channels.mod')}>`
        );
    }

    private async createLogsEmbed(
        fullUserName: string,
        userId: string,
        logs: any[],
        logType: string
    ): Promise<EmbedBuilder> {
        const embed = new EmbedBuilder()
            .setColor(Lang.getCom('colors.warning') as ColorResolvable)
            .setAuthor({ name: `${logType} for ${fullUserName}` })
            .setFooter({ text: `${fullUserName} | ${userId}` })
            .setTimestamp();

        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            const fixedTime = log.time.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            const reasonString =
                log.reason.length > 169
                    ? `> ${log.reason.slice(0, 169)} ...\n> ${fixedTime}\n━━━━━━━━━━━━━━`
                    : `> ${log.reason}\n> ${fixedTime}\n━━━━━━━━━━━━━━`;

            embed.addFields({
                name: `ID: ${i + 1} | ${log.type.toUpperCase()} | Moderator: ${log.moderator}`,
                value: reasonString,
                inline: false,
            });
        }

        return embed;
    }

    private createNoLogsEmbed(
        eventData: EventData,
        fullUserName: string,
        userId: string,
        logType: string
    ): EmbedBuilder {
        return Lang.getEmbed('displayEmbeds.noLogsFound', eventData.lang, {
            LOOPABLE: logType,
            MEMBER: fullUserName,
            MEMBER_ID: userId,
            TIMEHOLDER: new Date().toString(),
        });
    }
}
