import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils, RegexUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import ModerationSchema from '../../database/ModerationSchema.js';

export class TimeoutSlashCommand implements Command {
    public names = [Lang.getRef('chatCommands.timeOut', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        try {
            const { options, guild, channel, user } = intr;

            // Extract target user and validate input
            const targetUser = RegexUtils.extractTargetUserId(intr, options.getString('user'));
            const duration = options.getString('duration', true);
            const calculatedDuration = calculateDuration(duration);
            const reason = options.getString('reason', true);

            // Fetch the member object
            const MemberObj = await guild.members.fetch(targetUser);
            if (!MemberObj) {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('errorEmbeds.memberNotFound', data.lang),
                    true
                );
                return;
            }

            // Log the infraction in the database
            const infractionDate = new Date().toLocaleTimeString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            await ModerationSchema.create({
                discord_id: MemberObj.user.id,
                type: 'timeout',
                reason: reason,
                duration: duration,
                moderator: user.username,
                time: infractionDate,
            });

            // Handle the timeout or disable
            if (calculatedDuration === null) {
                // Disable timeout
                await MemberObj.timeout(null, reason);
                await InteractionUtils.editReply(
                    intr,
                    `Timeout has been disabled for ${MemberObj.user.username} by ${user.username}.`
                );
            } else {
                // Apply timeout
                await MemberObj.timeout(calculatedDuration, reason);
                await InteractionUtils.editReply(
                    intr,
                    `You have timed out ${MemberObj.user.username} for ${duration}.`
                );
            }
        } catch (error) {
            console.error('Error executing timeout command:', error);
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.commandExecutionError', data.lang),
                true
            );
        }
    }
}

function calculateDuration(duration: string): number | null {
    const oneMin = 60 * 1000; // 1 minute in milliseconds
    const oneHour = 60 * oneMin; // 1 hour in milliseconds
    const oneDay = 24 * oneHour; // 1 day in milliseconds
    const oneWeek = 7 * oneDay; // 1 week in milliseconds

    switch (duration) {
        case '5M':
            return 5 * oneMin;
        case '10M':
            return 10 * oneMin;
        case '1H':
            return oneHour;
        case '1D':
            return oneDay;
        case '1W':
            return oneWeek;
        case '28D':
            return 28 * oneDay;
        case 'DISABLE':
            return null;
        default:
            throw new Error('Invalid duration provided.');
    }
}
