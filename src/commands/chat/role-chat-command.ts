import { ChatInputCommandInteraction, GuildMember, PermissionsString, Role } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang, Logger } from '../../services/index.js';
import { InteractionUtils, MessageUtils, RegexUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import { SecurityUtils } from '../../utils/security-utils.js';

export class RoleChatCommand implements Command {
    public names = [Lang.getRef('chatCommands.role', Language.Default)];
    public description = [Lang.getRef('chatCommands.role', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.NONE;
    public requireClientPerms: PermissionsString[] = ['ManageRoles'];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const { options, guild } = intr;

        // Extract target user ID
        const target = String(options.getString('user'));
        const targetUser = RegexUtils.extractTargetUserId(intr, target);

        // Find the target member
        const member = guild.members.cache.get(targetUser);
        if (!member) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.memberNotFound', data.lang)
            );
            return;
        }

        // Extract role and action
        const action = options.getString('add-or-remove', true).toLowerCase();
        const roleMention = options.getMentionable('role-mention', true) as Role;
        const targetIsModOrHigher = await SecurityUtils.checkModOrHigher(member, guild);

        if (!roleMention || !(roleMention instanceof Role)) {
            console.log('Invalid role mention');
            return;
        }

        // Check if the user has a moderator role or higher
        if (targetIsModOrHigher === true) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.cantActionMod', data.lang, {
                    COMMAND: Lang.getRef('chatCommands.role', data.lang),
                }),
                true
            );
            return;
        }

        // Check if the target already has the role (for add) or doesn't have the role (for remove)
        if (action === 'add' && member.roles.cache.has(roleMention.id)) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('validationEmbeds.alreadyHasRole', data.lang, {
                    MEMBER_ID: member.user.id,
                    ROLEMENTION_ID: roleMention.id,
                }),
                true
            );
            return;
        } else if (action === 'remove' && !member.roles.cache.has(roleMention.id)) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('validationEmbeds.doesNotHaveRole', data.lang, {
                    MEMBER_ID: member.user.id,
                    ROLEMENTION_ID: roleMention.id,
                }),
                true
            );

            return;
        }

        // Prepare embed for role action
        const embedOptions = {
            TARGET_NAME: member.user.username,
            TARGET_ID: member.user.id,
            TIMEHOLDER: new Date().toString(),
        };

        const roleGainedEmbed = Lang.getEmbed('displayEmbeds.roleAction', data.lang, {
            COLOR: Lang.getCom('colors.success'),
            TITLE: 'Role Granted',
            DESC: `+ @${member.user.username} has gained the role @${roleMention.name}`,
            MODERATION_INFO: `+ Moderator: ${intr.user.username}`,
            ...embedOptions,
        });

        const roleLostEmbed = Lang.getEmbed('displayEmbeds.roleAction', data.lang, {
            COLOR: Lang.getCom('colors.error'),
            TITLE: 'Role Removed',
            DESC: `- @${member.user.username} has lost the role @${roleMention.name}`,
            MODERATION_INFO: `- Moderator: ${intr.user.username}`,
            ...embedOptions,
        });

        // Perform role action
        try {
            if (action === 'add') {
                await member.roles.add(roleMention.id);
                await InteractionUtils.send(intr, roleGainedEmbed);
                await MessageUtils.sendToLogChannel(guild, roleGainedEmbed);
            } else if (action === 'remove') {
                await member.roles.remove(roleMention.id);
                await InteractionUtils.send(intr, roleLostEmbed);
                await MessageUtils.sendToLogChannel(guild, roleLostEmbed);
            }
        } catch (error) {
            Logger.error(`Failed to ${action} role:`, error);
            await InteractionUtils.send(
                intr,
                `An error has occured - Roles un-modified for ${member.user.username}.`,
                true
            );
        }
    }
}
