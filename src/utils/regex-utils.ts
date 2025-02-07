import { ChatInputCommandInteraction } from 'discord.js';

export class RegexUtils {
    /**
     * Converts a string in the format "/pattern/flags" into a RegExp object.
     *
     * @param input - The string to convert into a RegExp.
     * @returns A RegExp object or undefined if the input format is invalid.
     */
    public static regex(input: string): RegExp {
        let match = input.match(/^\/(.*)\/([^/]*)$/);
        if (!match) {
            return;
        }

        return new RegExp(match[1], match[2]);
    }

    /**
     * Escapes special regex characters in a string to make it safe for use in regex patterns.
     *
     * @param input - The string to escape.
     * @returns The escaped string.
     */
    public static escapeRegex(input: string): string {
        return input?.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    /**
     * Extracts a Discord ID (17-20 digits) from a string.
     *
     * @param input - The string to search for a Discord ID.
     * @returns The extracted Discord ID or undefined if no valid ID is found.
     */
    public static discordId(input: string): string {
        return input?.match(/\b\d{17,20}\b/)?.[0];
    }

    /**
     * Extracts a Discord tag (username#discriminator) from a string.
     *
     * @param input - The string to search for a Discord tag.
     * @returns An object containing the tag, username, and discriminator, or undefined if no valid tag is found.
     */
    public static tag(input: string): { username: string; tag: string; discriminator: string } {
        let match = input.match(/\b(.+)#([\d]{4})\b/);
        if (!match) {
            return;
        }

        return {
            tag: match[0],
            username: match[1],
            discriminator: match[2],
        };
    }

    /**
     * Extracts the target user ID from command arguments.
     * Handles both mention format (<@userId>) and raw Discord IDs.
     * Falls back to the interaction user's ID if no valid ID is found.
     *
     * @param intr - The chat input command interaction object.
     * @param target - The target argument provided by the user.
     * @returns The extracted user ID or the interaction user's ID as a fallback.
     */
    public static extractTargetUserId(intr: ChatInputCommandInteraction, target: string): string {
        if (target.startsWith('<@')) {
            return target.slice(2, -1);
        } else if (RegexUtils.discordId(target)) {
            return target;
        } else {
            return intr.user.id;
        }
    }
}
