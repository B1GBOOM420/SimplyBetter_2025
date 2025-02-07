import {
    ApplicationCommandOptionChoiceData,
    AutocompleteFocusedOption,
    AutocompleteInteraction,
    CommandInteraction,
    PermissionsString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../models/internal-models.js';

/**
 * Represents a command that can be executed by the bot.
 * Includes metadata and methods for handling command execution and autocomplete.
 */
export interface Command {
    /** The names/aliases of the command. */
    names: string[];

    /** Optional rate limiter to control command usage frequency. */
    cooldown?: RateLimiter;

    /** Specifies how the command response should be deferred (e.g., public, hidden, or none). */
    deferType: CommandDeferType;

    /** Permissions required by the client (bot) to execute the command. */
    requireClientPerms: PermissionsString[];

    /**
     * Optional method to handle autocomplete for the command.
     *
     * @param intr - The autocomplete interaction object.
     * @param option - The focused option in the autocomplete interaction.
     * @returns A promise resolving to an array of autocomplete choices.
     */
    autocomplete?(
        intr: AutocompleteInteraction,
        option: AutocompleteFocusedOption
    ): Promise<ApplicationCommandOptionChoiceData[]>;

    /**
     * Executes the command logic.
     *
     * @param intr - The command interaction object.
     * @param data - Additional event data for the command.
     * @returns A promise that resolves when the command execution is complete.
     */
    execute(intr: CommandInteraction, data: EventData): Promise<void>;
}

/**
 * Defines how the command response should be deferred.
 * - PUBLIC: The response is visible to everyone.
 * - HIDDEN: The response is only visible to the user who invoked the command.
 * - NONE: No deferral is applied.
 */
export enum CommandDeferType {
    PUBLIC = 'PUBLIC',
    HIDDEN = 'HIDDEN',
    NONE = 'NONE',
}
