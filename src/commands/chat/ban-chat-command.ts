import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils, MessageUtils, RegexUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { ModerationUtils } from '../../utils/moderation-utils.js';

export class BanSlashCommand implements Command {
    public names = [Lang.getRef('chatCommands.ban', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        try {
            const { options, guild, user } = intr;

            // Extract and validate target user
            const targetUserId = RegexUtils.extractTargetUserId(intr, options.getString('user'));
            const reason = options.getString('reason', true);

            // Fetch the member object
            const member = await guild.members.fetch(targetUserId);
            if (!member || member.user.id === user.id) {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('errorEmbeds.memberNotFound', data.lang),
                    true
                );
                return;
            }

            await ModerationUtils.banUser(intr, member, reason);

            // Log the infraction in the database
        } catch {
            await InteractionUtils.send(
                intr,
                'I ran into an issue trying to ban the user! They are still a security risk!',
                true
            );
        }
    }
}
