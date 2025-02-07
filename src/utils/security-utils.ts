import { Guild, GuildMember, Interaction } from 'discord.js';
import { Lang } from '../services/lang.js';

/**
 * This utility class provides methods to check user permissions and roles within a Discord guild.
 */
export class SecurityUtils {
    /**
     * Checks if the target user's highest role position is at least as high as the moderator role.
     *
     * @param target - The target GuildMember to check.
     * @param guild - The Guild where the roles are being checked.
     * @returns A boolean indicating whether the target user has a role position at least as high as the moderator role.
     */
    public static async checkModOrHigher(target: GuildMember, guild: Guild): Promise<boolean> {
        const targetHighestRolePosition = target.roles.highest.position;
        const moderationRolePosition = guild.roles.cache.get(
            Lang.getCom('roles.moderator')
        )?.position;

        // If the moderator role doesn't exist, return false
        if (moderationRolePosition === undefined) {
            return false;
        }

        return targetHighestRolePosition >= moderationRolePosition;
    }

    /**
     * Checks if the caller of the interaction outranks the target user.
     *
     * @param target - The target GuildMember to check.
     * @param intr - The Interaction object representing the caller.
     * @returns A boolean indicating whether the caller outranks the target user.
     */
    public static async isTargetActionable(
        target: GuildMember,
        intr: Interaction
    ): Promise<boolean> {
        // Ensure the interaction has a guild and a member
        if (!intr.guild || !intr.member) {
            return false;
        }

        const targetHighestRolePosition = target.roles.highest.position;
        const callerHighestRolePosition = (intr.member as GuildMember).roles.highest.position;

        return callerHighestRolePosition > targetHighestRolePosition;
    }
}
