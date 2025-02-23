import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class AvatarSlashCommand implements Command {
    public names = [Lang.getRef('chatCommands.showAvatar', Language.Default)];
    public description = [Lang.getRef('chatCommands.showAvatar', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const { options, user, guild } = intr;

        let targetUser: string;

        const numOnlyRegex = /^\d+$/;

        const commandArgs = String(options.getString('user'));

        targetUser = user.id;

        if (commandArgs.startsWith('<@')) {
            targetUser = commandArgs.slice(2, -1);
        }
        if (numOnlyRegex.test(commandArgs)) {
            targetUser = commandArgs;
        }

        const member = await guild.members.fetch(targetUser);

        if (!member) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.memberNotFound', data.lang)
            );
            return;
        }

        const nickname = member.nickname ? `aka ${member.nickname}` : 'No Nickname Set';
        const embed = Lang.getEmbed('displayEmbeds.avatar', data.lang, {
            MEMBER_USER_FULL: member.user.tag,
            AVATAR_IMG: member.user.displayAvatarURL({ size: 256 }),
            MEMBER_AT: `<@${member.user.id}>`,
            MEMBER_NICKNAME: nickname,
            USER_ID: member.user.id,
            TIME_HOLDER: new Date().toString(),
        });

        const hidden = options.getBoolean('hidden') ?? false; // Default to false if not provided

        await InteractionUtils.send(intr, { embeds: [embed], ephemeral: hidden });
    }
}
