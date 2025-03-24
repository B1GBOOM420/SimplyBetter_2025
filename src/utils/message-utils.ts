import {
    BaseMessageOptions,
    DiscordAPIError,
    RESTJSONErrorCodes as DiscordApiErrors,
    EmbedBuilder,
    EmojiResolvable,
    Guild,
    Message,
    MessageEditOptions,
    MessageReaction,
    PartialGroupDMChannel,
    StartThreadOptions,
    TextBasedChannel,
    TextChannel,
    ThreadChannel,
    User,
} from 'discord.js';
import { Lang } from '../services/lang.js';
import { Logger } from '../services/logger.js';

const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
    DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
    DiscordApiErrors.MaximumActiveThreads,
];

export class MessageUtils {
    /**
     * Sends a message to a specified target (user or text-based channel).
     * @param {User | TextBasedChannel} target - The target user or channel to send the message to.
     * @param {string | EmbedBuilder | BaseMessageOptions} content - The content to send. Can be a string, an EmbedBuilder, or a BaseMessageOptions object.
     * @returns {Promise<Message>} - The sent message.
     * @throws {Error} - If an unexpected error occurs.
     */

    public static async send(
        target: User | TextBasedChannel,
        content: string | EmbedBuilder | BaseMessageOptions
    ): Promise<Message> {
        if (target instanceof PartialGroupDMChannel) return;
        try {
            let options: BaseMessageOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                      ? { embeds: [content] }
                      : content;
            return await target.send(options);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    /**
     * Fetches the log channel for a given guild.
     * @param {Guild} guild - The guild to fetch the log channel from.
     * @returns {Promise<TextChannel | null>} - The log channel if found, otherwise null.
     */
    private static async fetchLogChannel(guild: Guild): Promise<TextChannel | null> {
        const logChannelId = Lang.getCom('channels.logs');
        const channel = await guild.channels.fetch(logChannelId);

        // Ensure the channel is a text channel
        return channel?.isTextBased() ? (channel as TextChannel) : null;
    }

    /**
     * Fetches the mod channel for a given guild.
     * @param {Guild} guild - The guild to fetch the mod channel from.
     * @returns {Promise<TextChannel | null>} - The mod channel if found, otherwise null.
     */
    private static async fetchModChannel(guild: Guild): Promise<TextChannel | null> {
        const logChannelId = Lang.getCom('channels.mod');
        const channel = await guild.channels.fetch(logChannelId);

        // Ensure the channel is a text channel
        return channel?.isTextBased() ? (channel as TextChannel) : null;
    }

    /**
     * Sends a message to the log channel of a guild.
     * @param {Guild} guild - The guild where the log channel is located.
     * @param {string | EmbedBuilder | BaseMessageOptions} content - The content to send to the log channel.
     * @returns {Promise<Message | void>} - The sent message, or void if the message could not be sent.
     */
    public static async sendToLogChannel(
        guild: Guild,
        content: string | EmbedBuilder | BaseMessageOptions
    ): Promise<Message | void> {
        const logChannel = await this.fetchLogChannel(guild);

        if (!logChannel) {
            console.warn('Log channel not found or is not a text channel.');
            return;
        }

        try {
            // Prepare the message options
            const options: BaseMessageOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                      ? { embeds: [content] }
                      : content;

            // Send the message to the log channel
            return await logChannel.send(options);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code === 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                // Ignore specific errors
                return;
            } else {
                // Re-throw unexpected errors
                throw error;
            }
        }
    }

    /**
     * Sends a message to the Mod channel of a guild.
     * @param {Guild} guild - The guild where the Mod channel is located.
     * @param {string | EmbedBuilder | BaseMessageOptions} content - The content to send to the mod channel.
     * @returns {Promise<Message | void>} - The sent message, or void if the message could not be sent.
     */
    public static async sendToModChannel(
        guild: Guild,
        content: string | EmbedBuilder | BaseMessageOptions
    ): Promise<Message | void> {
        const modChannel = await this.fetchModChannel(guild);

        if (!modChannel) {
            console.warn('Mod channel not found or is not a text channel.');
            return;
        }

        try {
            // Prepare the message options
            const options: BaseMessageOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                      ? { embeds: [content] }
                      : content;

            // Send the message to the log channel
            return await modChannel.send(options);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code === 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                // Ignore specific errors
                return;
            } else {
                // Re-throw unexpected errors
                throw error;
            }
        }
    }

    /**
     * Replies to a message.
     * @param {Message} msg - The message to reply to.
     * @param {string | EmbedBuilder | BaseMessageOptions} content - The content of the reply. Can be a string, an EmbedBuilder, or a BaseMessageOptions object.
     * @returns {Promise<Message>} - The reply message.
     * @throws {Error} - If an unexpected error occurs.
     */
    public static async reply(
        msg: Message,
        content: string | EmbedBuilder | BaseMessageOptions
    ): Promise<Message> {
        try {
            let options: BaseMessageOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                      ? { embeds: [content] }
                      : content;
            return await msg.reply(options);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    /**
     * Edits an existing message.
     * @param {Message} msg - The message to edit.
     * @param {string | EmbedBuilder | MessageEditOptions} content - The new content for the message. Can be a string, an EmbedBuilder, or a MessageEditOptions object.
     * @returns {Promise<Message>} - The edited message.
     * @throws {Error} - If an unexpected error occurs.
     */
    public static async edit(
        msg: Message,
        content: string | EmbedBuilder | MessageEditOptions
    ): Promise<Message> {
        try {
            let options: MessageEditOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                      ? { embeds: [content] }
                      : content;
            return await msg.edit(options);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    /**
     * Adds a reaction to a message.
     * @param {Message} msg - The message to react to.
     * @param {EmojiResolvable} emoji - The emoji to react with.
     * @returns {Promise<MessageReaction>} - The reaction object.
     * @throws {Error} - If an unexpected error occurs.
     */
    public static async react(msg: Message, emoji: EmojiResolvable): Promise<MessageReaction> {
        try {
            return await msg.react(emoji);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    /**
     * Pins or unpins a message.
     * @param {Message} msg - The message to pin or unpin.
     * @param {boolean} [pinned=true] - Whether to pin (true) or unpin (false) the message.
     * @returns {Promise<Message>} - The pinned or unpinned message.
     * @throws {Error} - If an unexpected error occurs.
     */
    public static async pin(msg: Message, pinned: boolean = true): Promise<Message> {
        try {
            return pinned ? await msg.pin() : await msg.unpin();
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    /**
     * Starts a thread from a message.
     * @param {Message} msg - The message to start the thread from.
     * @param {StartThreadOptions} options - The options for starting the thread.
     * @returns {Promise<ThreadChannel>} - The created thread channel.
     * @throws {Error} - If an unexpected error occurs.
     */
    public static async startThread(
        msg: Message,
        options: StartThreadOptions
    ): Promise<ThreadChannel> {
        try {
            return await msg.startThread(options);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    /**
     * Deletes a message.
     * @param {Message} msg - The message to delete.
     * @returns {Promise<Message>} - The deleted message.
     * @throws {Error} - If an unexpected error occurs.
     */
    public static async delete(msg: Message): Promise<Message> {
        try {
            return await msg.delete();
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }
}
