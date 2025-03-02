import {
    ActionRowBuilder,
    ButtonInteraction,
    ChatInputApplicationCommandData,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from 'discord.js';
import { Button, ButtonDeferType } from '../button.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { ClientUtils } from '../../utils/client-utils.js';
import { ModerationUtils } from '../../utils/moderation-utils.js';
import { SecurityUtils } from '../../utils/security-utils.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { MODERATION_REASONS } from '../../constants/moderation-reasons.js';

// Define the timeout reasons (reusable across commands)

export class TimeoutUserButton implements Button {
    public ids = [Lang.getCom('buttonNames.timeOut')];
    public deferType = ButtonDeferType.NONE;
    public requireGuild = true;
    public requireEmbedAuthorTag: true;
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('buttonNames.timeOut'),
        description: 'A button shown on the check command to action a user',
        defaultMemberPermissions: ['ManageMessages'],
        dmPermission: false,
    };

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        const { guild } = intr;
        const targetText = intr.message.embeds[0].footer.text;

        const targetMember = await ClientUtils.findMember(intr.guild, targetText);

        // Check if the target user is a mod or higher
        const targetIsModOrHigher = await SecurityUtils.checkModOrHigher(targetMember, guild);
        if (targetIsModOrHigher === true) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.cantActionMod', data.lang, {
                    COMMAND: Lang.getRef('chatCommands.timeout', data.lang),
                }),
                true
            );
            return;
        }

        // Create the dropdown menu for timeout reasons
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('timeout_reason')
            .setPlaceholder('Select a reason for the timeout')
            .addOptions(MODERATION_REASONS);

        const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            selectMenu
        );

        // Send the dropdown menu
        const dropdownMessage = await intr.reply({
            content: 'Please select a reason for the timeout:',
            components: [selectMenuRow],
            ephemeral: true, // Only the user who clicked the button can see this
            fetchReply: true, // Fetch the message so we can edit it later
        });

        // Wait for the user to select a reason from the dropdown
        const filter = (i: StringSelectMenuInteraction) =>
            i.customId === 'timeout_reason' && i.user.id === intr.user.id;

        try {
            const selectMenuInteraction = await dropdownMessage.awaitMessageComponent({
                filter,
                time: 60_000, // 60 seconds timeout
            });

            if (selectMenuInteraction && selectMenuInteraction.isStringSelectMenu()) {
                const selectedReason = selectMenuInteraction.values[0]; // Get the selected reason

                // Timeout the user with the selected reason
                await ModerationUtils.timeoutUser(
                    intr,
                    targetMember,
                    selectedReason // Pass the selected reason
                );

                // Confirm the timeout to the moderator
                await selectMenuInteraction.update({
                    content: `<@${targetMember.user.id}> has been timed out for: ${selectedReason}.`,
                    components: [], // Remove the dropdown menu
                });
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            await intr.followUp({
                content: 'No selection made within the time limit. Timeout action canceled.',
                ephemeral: true,
            });
        }
    }
}
