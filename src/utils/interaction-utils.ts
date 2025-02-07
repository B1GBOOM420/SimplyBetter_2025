import {
    ApplicationCommandOptionChoiceData,
    AutocompleteInteraction,
    CommandInteraction,
    DiscordAPIError,
    RESTJSONErrorCodes as DiscordApiErrors,
    EmbedBuilder,
    InteractionReplyOptions,
    InteractionResponse,
    InteractionUpdateOptions,
    Message,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    WebhookMessageEditOptions,
} from 'discord.js';

// List of Discord API error codes that should be ignored (e.g., non-critical errors)
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

/**
 * Utility class for handling Discord interactions.
 */
export class InteractionUtils {
    /**
     * Defers a reply to an interaction, optionally making it ephemeral (hidden).
     *
     * @param intr - The interaction to defer (CommandInteraction, MessageComponentInteraction, or ModalSubmitInteraction).
     * @param hidden - Whether the reply should be ephemeral (hidden). Defaults to false.
     * @returns A promise resolving to the InteractionResponse, or undefined if an ignored error occurs.
     */
    public static async deferReply(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        hidden: boolean = false
    ): Promise<InteractionResponse | undefined> {
        try {
            return await intr.deferReply({
                ephemeral: hidden,
            });
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
     * Defers an update to an interaction (used for component interactions).
     *
     * @param intr - The interaction to defer (MessageComponentInteraction or ModalSubmitInteraction).
     * @returns A promise resolving to the InteractionResponse, or undefined if an ignored error occurs.
     */
    public static async deferUpdate(
        intr: MessageComponentInteraction | ModalSubmitInteraction
    ): Promise<InteractionResponse | undefined> {
        try {
            return await intr.deferUpdate();
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
     * Sends a response to an interaction. Can handle strings, embeds, or InteractionReplyOptions.
     *
     * @param intr - The interaction to reply to (CommandInteraction, MessageComponentInteraction, or ModalSubmitInteraction).
     * @param content - The content to send (string, EmbedBuilder, or InteractionReplyOptions).
     * @param hidden - Whether the reply should be ephemeral (hidden). Defaults to false.
     * @returns A promise resolving to the sent Message, or undefined if an ignored error occurs.
     */
    public static async send(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        content: string | EmbedBuilder | InteractionReplyOptions,
        hidden: boolean = false
    ): Promise<Message | undefined> {
        try {
            let options: InteractionReplyOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                      ? { embeds: [content] }
                      : content;
            if (intr.deferred || intr.replied) {
                return await intr.followUp({
                    ...options,
                    ephemeral: hidden,
                });
            } else {
                return await intr.reply({
                    ...options,
                    ephemeral: hidden,
                    fetchReply: true,
                });
            }
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
     * Responds to an autocomplete interaction with a list of choices.
     *
     * @param intr - The AutocompleteInteraction to respond to.
     * @param choices - The list of choices to send. Defaults to an empty array.
     * @returns A promise resolving to void, or undefined if an ignored error occurs.
     */
    public static async respond(
        intr: AutocompleteInteraction,
        choices: ApplicationCommandOptionChoiceData[] = []
    ): Promise<void | undefined> {
        try {
            return await intr.respond(choices);
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
     * Edits the initial reply to an interaction.
     *
     * @param intr - The interaction to edit (CommandInteraction, MessageComponentInteraction, or ModalSubmitInteraction).
     * @param content - The new content to send (string, EmbedBuilder, or WebhookMessageEditOptions).
     * @returns A promise resolving to the edited Message, or undefined if an ignored error occurs.
     */
    public static async editReply(
        intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
        content: string | EmbedBuilder | WebhookMessageEditOptions
    ): Promise<Message | undefined> {
        try {
            let options: WebhookMessageEditOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                      ? { embeds: [content] }
                      : content;
            return await intr.editReply(options);
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
     * Updates a message component interaction with new content.
     *
     * @param intr - The MessageComponentInteraction to update.
     * @param content - The new content to send (string, EmbedBuilder, or InteractionUpdateOptions).
     * @returns A promise resolving to the updated Message, or undefined if an ignored error occurs.
     */
    public static async update(
        intr: MessageComponentInteraction,
        content: string | EmbedBuilder | InteractionUpdateOptions
    ): Promise<Message | undefined> {
        try {
            let options: InteractionUpdateOptions =
                typeof content === 'string'
                    ? { content }
                    : content instanceof EmbedBuilder
                      ? { embeds: [content] }
                      : content;
            return await intr.update({
                ...options,
                fetchReply: true,
            });
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
