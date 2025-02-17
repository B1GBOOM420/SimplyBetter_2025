import { PermissionsString, UserContextMenuCommandInteraction } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils, MessageUtils, RegexUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class AvatarUserCommand implements Command {
    public names = [Lang.getRef('userCommands.avatarUserCommand', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: UserContextMenuCommandInteraction, data: EventData): Promise<void> {
        const { targetId, user, guild } = intr;

        const member = guild.members.cache.find(mber => mber.id === targetId);

        if (!member) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.memberNotFound', data.lang)
            );
            return;
        }

        const nickname = member.nickname ? `aka ${member.nickname}` : 'No Nickname Set';
        const embed = Lang.getEmbed('displayEmbeds.avatar', data.lang, {
            MEMBER_USER_TAG: `${member.user.username}#${member.user.discriminator}`,
            AVATAR_IMG: member.user.displayAvatarURL({ size: 256 }),
            MEMBER_AT: `<@${member.user.id}>`,
            MEMBER_NICKNAME: nickname,
            USER_ID: member.user.id,
            TIME_HOLDER: new Date().toString(),
        });

        const logChannelId = Lang.getCom('channels.logs');

        await MessageUtils.sendToLogChannel(guild, embed);
        await InteractionUtils.send(
            intr,
            `Avatar Command has been run on <@${member.user.id}> in the <#${logChannelId}>`
        );
    }
}
