import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils, MessageUtils, RegexUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import ModerationSchema from '../../database/ModerationSchema.js';

// Constants for duration calculations
const DURATION_UNITS = {
    MINUTE: 60 * 1000, // 1 minute in milliseconds
    HOUR: 60 * 60 * 1000, // 1 hour in milliseconds
    DAY: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    WEEK: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
};

export class TimeoutSlashCommand implements Command {
    public names = [Lang.getRef('chatCommands.timeOut', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        try {
            const { options, guild, user } = intr;

            // Extract and validate target user
            const targetUserId = RegexUtils.extractTargetUserId(intr, options.getString('user'));
            const duration = options.getString('duration', true);
            const reason = options.getString('reason', true);

            // Fetch the member object
            const member = await guild.members.fetch(targetUserId);
            if (!member || member.user.id === intr.user.id) {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('errorEmbeds.memberNotFound', data.lang),
                    true
                );
                return;
            }

            // Log the infraction in the database
            await this.logInfraction(member.user.id, reason, duration, user.username);

            // Handle timeout or disable
            const calculatedDuration = this.calculateDuration(duration);
            const isDisablingTimeout = calculatedDuration === null;

            const embed = this.createTimeoutEmbed(
                data.lang,
                isDisablingTimeout ? 'Timeout Disabled' : 'Timeout Enabled',
                isDisablingTimeout ? '33' : '31', // Yellow for disable, red for enable
                isDisablingTimeout
                    ? `${user.username} has disabled the Timeout on ${member.user.username}`
                    : `${user.username} has TimedOut user ${member.user.username} for ${duration}\n\nReason: ${reason}`,
                isDisablingTimeout ? Lang.getCom('colors.warning') : Lang.getCom('colors.error'),
                member.user.username,
                member.user.id
            );

            await member.timeout(calculatedDuration, reason);
            await InteractionUtils.editReply(intr, {
                content: `This message has also been sent to <#${Lang.getCom('channels.logs')}>`,
                embeds: [embed],
            });
            await MessageUtils.sendToLogChannel(guild, embed);
        } catch (error) {
            console.error('Error executing timeout command:', error);
            await InteractionUtils.send(intr, error, true);
        }
    }

    private async logInfraction(
        userId: string,
        reason: string,
        duration: string,
        moderator: string
    ): Promise<void> {
        const infractionDate = new Date().toLocaleTimeString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        await ModerationSchema.create({
            discord_id: userId,
            type: 'timeout',
            reason,
            duration,
            moderator,
            time: infractionDate,
        });
    }

    public createTimeoutEmbed(
        lang: string,
        title: string,
        fontColor: string,
        actionString: string,
        color: string,
        targetName: string,
        targetId: string
    ) {
        return Lang.getEmbed('displayEmbeds.timeoutAction', Language.Default, {
            TITLE: title,
            FONT_COLOR: fontColor,
            TIMEOUT_ACTION_STRING: actionString,
            COLOR: color,
            TARGET_NAME: targetName,
            TARGET_ID: targetId,
            TIMEHOLDER: new Date().toString(),
        });
    }

    private calculateDuration(duration: string): number | null {
        const { MINUTE, HOUR, DAY, WEEK } = DURATION_UNITS;

        switch (duration) {
            case '5M':
                return 5 * MINUTE;
            case '10M':
                return 10 * MINUTE;
            case '1H':
                return HOUR;
            case '1D':
                return DAY;
            case '1W':
                return WEEK;
            case '28D':
                return 28 * DAY;
            case 'DISABLE':
                return null;
            default:
                throw new Error('Invalid duration provided.');
        }
    }
}
