// import { CommandInteraction, Guild, GuildMember, EmbedBuilder } from 'discord.js';
// import { MessageUtils } from './message-utils.js';
// import { SecurityUtils } from './security-utils.js';
// import ModerationSchema from '../database/ModerationSchema.js';
// import { InteractionUtils } from './interaction-utils.js';
// import { Lang } from '../services/index.js';
// import { Language } from '../models/enum-helpers/language.js';

// export class ModerationUtils {
//     private static readonly DAY_SECONDS = 86400; // 1 day in seconds
//     private static readonly MINUTE_MS = 60 * 1000; // 1 minute in milliseconds
//     private static readonly HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds
//     private static readonly DAY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds
//     private static readonly WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

//     /**
//      * Converts a duration string to milliseconds.
//      * @param duration - '5M','10M', '1H', '1D', '1W', '28D', 'DISABLE'
//      * @returns The duration in milliseconds or null if the duration is 'DISABLE'.
//      */
//     private static durationToMs(duration: string): number | null {
//         switch (duration.toUpperCase()) {
//             case '5M':
//                 return 5 * this.MINUTE_MS;
//             case '10M':
//                 return 10 * this.MINUTE_MS;
//             case '1H':
//                 return this.HOUR_MS;
//             case '1D':
//                 return this.DAY_MS;
//             case '1W':
//                 return this.WEEK_MS;
//             case '28D':
//                 return 28 * this.DAY_MS;
//             case 'DISABLE':
//                 return null;
//             default:
//                 return this.DAY_MS; // Default to 1 day if duration is invalid
//         }
//     }

//     /**
//      * Timeouts a user and logs the action.
//      * @param intr - The command interaction.
//      * @param targetUser - The user to timeout.
//      * @param reason - The reason for the timeout.
//      * @param duration - The duration of the timeout (defaults to '1D').
//      */
//     public static async timeoutUser(
//         intr: CommandInteraction,
//         targetUser: GuildMember,
//         reason: string,
//         duration: string = '1D'
//     ): Promise<void> {
//         const { guild } = intr;

//         // Check if the target user is a moderator or higher
//         const targetIsModOrHigher = await SecurityUtils.checkModOrHigher(targetUser, guild);
//         if (targetIsModOrHigher) {
//             await InteractionUtils.send(
//                 intr,
//                 'You cannot timeout a user with a role of moderator or higher.'
//             );
//             return;
//         }

//         // Calculate the duration in milliseconds
//         const calculatedDuration = this.durationToMs(duration);
//         const isDisablingTimeout = duration.toUpperCase() === 'DISABLE';

//         // Log the timeout action in the database
//         await ModerationSchema.create({
//             discord_id: targetUser.user.id,
//             type: 'timeout',
//             moderator: intr.user.tag,
//             reason: reason,
//             duration: duration,
//             time: new Date().toLocaleTimeString('en-US', {
//                 year: 'numeric',
//                 month: 'short',
//                 day: 'numeric',
//                 hour: '2-digit',
//                 minute: '2-digit',
//                 second: '2-digit',
//             }),
//         });

//         try {
//             // Timeout the user
//             await targetUser.timeout(calculatedDuration, reason);

//             // Create the timeout embed
//             const embed = this.createTimeoutEmbed(
//                 isDisablingTimeout ? 'Timeout Disabled' : 'Timeout Enabled',
//                 isDisablingTimeout ? '33' : '31', // Yellow for disable, red for enable
//                 isDisablingTimeout
//                     ? `${intr.user.username} has disabled the Timeout on ${targetUser.user.username}`
//                     : `${intr.user.username} has TimedOut user ${targetUser.user.username} for ${duration}\n\nReason: ${reason}`,
//                 isDisablingTimeout ? Lang.getCom('colors.warning') : Lang.getCom('colors.error'),
//                 targetUser.user.username,
//                 targetUser.user.id
//             );

//             // Send a confirmation message to the moderator
//             await InteractionUtils.send(intr, { embeds: [embed] });

//             // Send a notice to the timed-out user
//             const userEmbed = this.createTimeoutEmbed(
//                 isDisablingTimeout ? 'Timeout Disabled' : 'Timeout Enabled',
//                 isDisablingTimeout ? '33' : '31', // Yellow for disable, red for enable
//                 isDisablingTimeout
//                     ? `Your timeout has been disabled in ${guild.name} by ${intr.user.username}.`
//                     : `You have been timed out from ${guild.name} for ${duration}.\n\nReason: ${reason}`,
//                 isDisablingTimeout ? Lang.getCom('colors.warning') : Lang.getCom('colors.error'),
//                 targetUser.user.username,
//                 targetUser.user.id
//             );

//             await MessageUtils.send(targetUser.user, { embeds: [userEmbed] });

//             // Log the action in the log channel
//             await MessageUtils.sendToLogChannel(guild, { embeds: [embed] });
//         } catch (error) {
//             console.error('Error timing out user:', error);

//             // Notify the moderator of the error
//             await InteractionUtils.send(
//                 intr,
//                 'An error occurred while trying to timeout the user. Please try again.'
//             );
//         }
//     }

//     /**
//      * Creates a timeout embed using the provided parameters.
//      * @param title - The title of the embed.
//      * @param fontColor - The color of the font.
//      * @param actionString - The action description.
//      * @param color - The color of the embed.
//      * @param targetName - The name of the target user.
//      * @param targetId - The ID of the target user.
//      * @returns The created embed.
//      */
//     private static createTimeoutEmbed(
//         title: string,
//         fontColor: string,
//         actionString: string,
//         color: string,
//         targetName: string,
//         targetId: string
//     ) {
//         return Lang.getEmbed('displayEmbeds.timeoutAction', Language.Default, {
//             TITLE: title,
//             FONT_COLOR: fontColor,
//             TIMEOUT_ACTION_STRING: actionString,
//             COLOR: color,
//             TARGET_NAME: targetName,
//             TARGET_ID: targetId,
//             TIMEHOLDER: new Date().toString(),
//         });
//     }

//     /**
//      * Warns a user and logs the action.
//      * @param intr - The command interaction.
//      * @param targetUser - The user to warn.
//      * @param reason - The reason for the warning.
//      */
//     public static async warnUser(
//         intr: CommandInteraction,
//         targetUser: GuildMember,
//         reason: string
//     ): Promise<void> {
//         const { guild } = intr;
//         const targetIsModOrHigher = await SecurityUtils.checkModOrHigher(targetUser, guild);
//         if (targetIsModOrHigher) {
//             await InteractionUtils.send(
//                 intr,
//                 'You cannot warn a user with a role of moderator or higher.'
//             );
//             return;
//         }

//         try {
//             await ModerationSchema.create({
//                 discord_id: targetUser.user.id,
//                 type: 'warn',
//                 moderator: intr.user.tag,
//                 reason: reason,
//                 time: new Date().toLocaleTimeString('en-US', {
//                     year: 'numeric',
//                     month: 'short',
//                     day: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit',
//                     second: '2-digit',
//                 }),
//             });

//             const userEmbed = Lang.getEmbed('displayEmbeds.warnAction', Language.Default, {
//                 WARN_ACTION_STRING: `You have recieved a warning from ${guild.name}.\n\nReason: ${reason}\n\nPlease adhere to the server rules to avoid further action.`,
//                 TARGET_NAME: targetUser.user.tag,
//                 TARGET_ID: targetUser.user.id,
//                 TIMEHOLDER: new Date().toString(),
//             });

//             await MessageUtils.send(targetUser.user, { embeds: [userEmbed] });

//             // Log the action in the log channel
//             const logEmbed = Lang.getEmbed('displayEmbeds.warnAction', Language.Default, {
//                 WARN_ACTION_STRING: `${targetUser.user.tag} has recieved a Warning.\n\nReason: ${reason}\n\nPlease adhere to the server rules to avoid further action.`,
//                 TARGET_NAME: targetUser.user.tag,
//                 TARGET_ID: targetUser.user.id,
//                 TIMEHOLDER: new Date().toString(),
//             });

//             await MessageUtils.sendToLogChannel(guild, { embeds: [logEmbed] });
//         } catch (error) {
//             console.error('Error warning user:', error);

//             // Notify the moderator of the error
//             await InteractionUtils.send(
//                 intr,
//                 'An error occurred while trying to warn the user. Please try again.'
//             );
//         }
//     }

//     /**
//      * Bans a user and logs the action.
//      * @param guild - The guild where the ban is taking place.
//      * @param targetUser - The user to ban.
//      * @param reason - The reason for the ban.
//      */
//     public static async banUser(
//         intr: CommandInteraction,
//         targetUser: GuildMember,
//         reason: string
//     ): Promise<void> {
//         const { guild } = intr;
//         const targetIsModOrHigher = await SecurityUtils.checkModOrHigher(targetUser, guild);
//         if (targetIsModOrHigher) {
//             await InteractionUtils.send(
//                 intr,
//                 'You cannot timeout a user with a role of moderator or higher.'
//             );
//         }
//         // Send a confirmation message to the log channel
//         const userEmbed = Lang.getEmbed('displayEmbeds.banAction', Language.Default, {
//             WARN_ACTION_STRING: `You have been banned from ${guild.name}.\n\nReason: ${reason}`,
//             TARGET_NAME: targetUser.user.tag,
//             TARGET_ID: targetUser.user.id,
//             TIMEHOLDER: new Date().toString(),
//         });

//         const logEmbed = Lang.getEmbed('displayEmbeds.banAction', Language.Default, {
//             WARN_ACTION_STRING: `${targetUser.user.tag} has been banned!!\n\nReason: ${reason}`,
//             TARGET_NAME: targetUser.user.tag,
//             TARGET_ID: targetUser.user.id,
//             TIMEHOLDER: new Date().toString(),
//         });

//         try {
//             await MessageUtils.send(targetUser.user, { embeds: [userEmbed] });

//             await targetUser.ban({
//                 deleteMessageSeconds: this.DAY_SECONDS,
//                 reason: reason,
//             });

//             await InteractionUtils.editReply(intr, { embeds: [logEmbed] });
//             await MessageUtils.sendToLogChannel(guild, { embeds: [logEmbed] });
//         } catch (error) {
//             console.error('Error banning user:', error);
//             throw new Error('An error occurred while trying to ban the user. Please try again.');
//         }
//     }
// }

import {
    CommandInteraction,
    GuildMember,
    EmbedBuilder,
    Guild,
    ButtonInteraction,
} from 'discord.js';
import { MessageUtils } from './message-utils.js';
import { SecurityUtils } from './security-utils.js';
import ModerationSchema from '../database/ModerationSchema.js';
import { InteractionUtils } from './interaction-utils.js';
import { Lang } from '../services/index.js';
import { Language } from '../models/enum-helpers/language.js';

export class ModerationUtils {
    private static readonly DAY_SECONDS = 86400; // 1 day in seconds
    private static readonly MINUTE_MS = 60 * 1000; // 1 minute in milliseconds
    private static readonly HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds
    private static readonly DAY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    private static readonly WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

    /**
     * Converts a duration string to milliseconds.
     * @param duration - '5M','10M', '1H', '1D', '1W', '28D', 'DISABLE'
     * @returns The duration in milliseconds or null if the duration is 'DISABLE'.
     */
    private static durationToMs(duration: string): number | null {
        const durationMap: Record<string, number | null> = {
            '5M': 5 * this.MINUTE_MS,
            '10M': 10 * this.MINUTE_MS,
            '1H': this.HOUR_MS,
            '1D': this.DAY_MS,
            '1W': this.WEEK_MS,
            '28D': 28 * this.DAY_MS,
            DISABLE: null,
        };

        return durationMap[duration.toUpperCase()] ?? this.DAY_MS; // Default to 1 day if duration is invalid
    }

    /**
     * Logs a moderation action to the database.
     * @param discordId - The ID of the target user.
     * @param type - The type of moderation action (e.g., 'timeout', 'warn', 'ban').
     * @param moderator - The tag of the moderator.
     * @param reason - The reason for the action.
     * @param duration - The duration of the action (optional).
     */
    private static async logModerationAction(
        discordId: string,
        type: string,
        moderator: string,
        reason: string,
        duration?: string
    ): Promise<void> {
        await ModerationSchema.create({
            discord_id: discordId,
            type,
            moderator,
            reason,
            duration,
            time: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
        });
    }

    /**
     * Creates a moderation embed.
     * @param title - The title of the embed.
     * @param actionString - The action description.
     * @param color - The color of the embed.
     * @param targetName - The name of the target user.
     * @param targetId - The ID of the target user.
     * @returns The created embed.
     */
    private static createModerationEmbed(
        title: string,
        fontColor: string,
        actionString: string,
        modTag: string,
        color: string,
        targetName: string,
        targetId: string
    ): EmbedBuilder {
        return Lang.getEmbed('displayEmbeds.createModerationEmbed', Language.Default, {
            TITLE: title,
            FONT_COLOR: fontColor,
            ACTION_STRING: actionString,
            MOD_TAG: modTag,
            COLOR: color,
            TARGET_NAME: targetName,
            TARGET_ID: targetId,
            TIMEHOLDER: new Date().toString(),
        });
    }

    /**
     * Checks if a user is a moderator or higher and handles the response.
     * @param targetUser - The user to check.
     * @param guild - The guild where the action is taking place.
     * @param intr - The command interaction.
     * @returns True if the user is a moderator or higher, false otherwise.
     */
    private static async checkModeratorOrHigher(
        targetUser: GuildMember,
        guild: Guild,
        intr: CommandInteraction | ButtonInteraction
    ): Promise<boolean> {
        const isModOrHigher = await SecurityUtils.checkModOrHigher(targetUser, guild);
        if (isModOrHigher) {
            await InteractionUtils.send(
                intr,
                'You cannot perform this action on a user with a role of moderator or higher.'
            );
        }
        return isModOrHigher;
    }

    /**
     * Timeouts a user and logs the action.
     * @param intr - The command interaction.
     * @param targetUser - The user to timeout.
     * @param reason - The reason for the timeout.
     * @param duration - The duration of the timeout (defaults to '1D').
     */
    public static async timeoutUser(
        intr: CommandInteraction | ButtonInteraction,
        targetUser: GuildMember,
        reason: string,
        duration: string = '1D'
    ): Promise<void> {
        const { guild } = intr;

        if (await this.checkModeratorOrHigher(targetUser, guild, intr)) return;

        const calculatedDuration = this.durationToMs(duration);
        const isDisablingTimeout = duration.toUpperCase() === 'DISABLE';

        try {
            await this.logModerationAction(
                targetUser.user.id,
                'timeout',
                intr.user.tag,
                reason,
                duration
            );

            await targetUser.timeout(calculatedDuration, reason);

            const embedTitle = isDisablingTimeout ? '🔊 Timeout Disabled' : '🔇 Timeout Enabled';
            const fontColor = isDisablingTimeout ? '33' : '31'; // Yellow for disable, red for enable
            const embedColor = isDisablingTimeout
                ? Lang.getCom('colors.warning')
                : Lang.getCom('colors.error');
            const embedDescription = isDisablingTimeout
                ? `${intr.user.username} has disabled the Timeout on ${targetUser.user.username}`
                : `${intr.user.username} has TimedOut user ${targetUser.user.username} for ${duration}\n\nReason: ${reason}`;

            const embed = this.createModerationEmbed(
                embedTitle,
                fontColor,
                embedDescription,
                `${intr.user.tag}(${intr.user.id})`,
                embedColor,
                targetUser.user.username,
                targetUser.user.id
            );

            await InteractionUtils.send(intr, { embeds: [embed] });
            await MessageUtils.send(targetUser.user, { embeds: [embed] });
            await MessageUtils.sendToLogChannel(guild, { embeds: [embed] });
        } catch (error) {
            console.error('Error timing out user:', error);
            await InteractionUtils.send(
                intr,
                'An error occurred while trying to timeout the user. Please try again.'
            );
        }
    }

    /**
     * Warns a user and logs the action.
     * @param intr - The command interaction.
     * @param targetUser - The user to warn.
     * @param reason - The reason for the warning.
     */
    public static async warnUser(
        intr: CommandInteraction | ButtonInteraction,
        targetUser: GuildMember,
        reason: string
    ): Promise<void> {
        const { guild } = intr;

        if (await this.checkModeratorOrHigher(targetUser, guild, intr)) return;

        try {
            await this.logModerationAction(targetUser.user.id, 'warn', intr.user.tag, reason);

            const userEmbed = this.createModerationEmbed(
                '⚠ Warning Issued',
                '33', // yellow
                `You have received a warning from ${guild.name}.\n\nReason: ${reason}\n\nPlease adhere to the server rules to avoid further action.`,
                `${intr.user.tag}(${intr.user.id})`,
                Lang.getCom('colors.warning'),
                targetUser.user.tag,
                targetUser.user.id
            );

            await MessageUtils.send(targetUser.user, { embeds: [userEmbed] });

            const logEmbed = this.createModerationEmbed(
                '⚠ Warning Issued',
                '33', // yellow
                `${targetUser.user.tag} has received a Warning.\n\nReason: ${reason}\n\nPlease adhere to the server rules to avoid further action.`,
                `${intr.user.tag}(${intr.user.id})`,
                Lang.getCom('colors.warning'),
                targetUser.user.tag,
                targetUser.user.id
            );
            await InteractionUtils.editReply(intr, logEmbed);
            await MessageUtils.sendToLogChannel(guild, logEmbed);
        } catch (error) {
            console.error('Error warning user:', error);
            await InteractionUtils.send(
                intr,
                'An error occurred while trying to warn the user. Please try again.'
            );
        }
    }

    /**
     * Bans a user and logs the action.
     * @param intr - The command interaction.
     * @param targetUser - The user to ban.
     * @param reason - The reason for the ban.
     */
    public static async banUser(
        intr: CommandInteraction | ButtonInteraction,
        targetUser: GuildMember,
        reason: string
    ): Promise<void> {
        const { guild } = intr;

        if (await this.checkModeratorOrHigher(targetUser, guild, intr)) return;

        try {
            const userEmbed = this.createModerationEmbed(
                '⛔ Ban Issued',
                '31', // red
                `You have been banned from ${guild.name}.\n\nReason: ${reason}`,
                `${intr.user.tag}(${intr.user.id})`,
                Lang.getCom('colors.error'),
                targetUser.user.tag,
                targetUser.user.id
            );

            const logEmbed = this.createModerationEmbed(
                '⛔ Ban Issued',
                '31', // red
                `${targetUser.user.tag} has been banned!!\n\nReason: ${reason}`,
                `${intr.user.tag}(${intr.user.id})`,
                Lang.getCom('colors.error'),
                targetUser.user.tag,
                targetUser.user.id
            );

            await MessageUtils.send(targetUser.user, { embeds: [userEmbed] });
            await InteractionUtils.editReply(intr, { embeds: [logEmbed] });
            await MessageUtils.sendToLogChannel(guild, { embeds: [logEmbed] });
            await targetUser.ban({ deleteMessageSeconds: this.DAY_SECONDS, reason });
        } catch (error) {
            console.error('Error banning user:', error);
            throw new Error('An error occurred while trying to ban the user. Please try again.');
        }
    }
}
