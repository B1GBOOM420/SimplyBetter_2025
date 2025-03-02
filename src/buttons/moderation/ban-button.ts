import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputApplicationCommandData,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from 'discord.js';
import { Button, ButtonDeferType } from '../button.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { ClientUtils } from '../../utils/client-utils.js';
import { SecurityUtils } from '../../utils/security-utils.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { MODERATION_REASONS } from '../../constants/moderation-reasons.js';

export class BanUserButton implements Button {
    public ids = [Lang.getCom('buttonNames.ban')];
    public deferType = ButtonDeferType.NONE;
    public requireGuild = true;
    public requireEmbedAuthorTag: true;
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('buttonNames.ban'),
        description: 'A button shown on the check command to action a user',
        defaultMemberPermissions: ['ManageMessages'],
        dmPermission: false,
    };

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        const { guild } = intr;
        const targetText = intr.message.embeds[0].footer.text;

        const targetMember = await ClientUtils.findMember(intr.guild, targetText);

        // Check if the target user is a mod or higher, or if they are not bannable
        const targetIsModOrHigher = await SecurityUtils.checkModOrHigher(targetMember, guild);
        if (targetIsModOrHigher === true || !targetMember.bannable) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.cantActionMod', data.lang, {
                    COMMAND: Lang.getRef('chatCommands.ban', data.lang),
                }),
                true
            );
            return;
        }

        // Create and send the dropdown menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ban_reason')
            .setPlaceholder('Select a reason for the ban')
            .addOptions(MODERATION_REASONS);

        const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            selectMenu
        );
        const dropdownMessage = await intr.reply({
            content: 'Please select a reason for the ban:',
            components: [selectMenuRow],
            ephemeral: true,
            fetchReply: true,
        });

        // Wait for the user to select a reason
        const filter = (i: StringSelectMenuInteraction) =>
            i.customId === 'ban_reason' && i.user.id === intr.user.id;

        try {
            const selectMenuInteraction = await dropdownMessage.awaitMessageComponent({
                filter,
                time: 60_000,
            });
            if (selectMenuInteraction && selectMenuInteraction.isStringSelectMenu()) {
                const selectedReason = selectMenuInteraction.values[0];

                // Create confirmation buttons
                const confirmBanButton = new ButtonBuilder()
                    .setCustomId(Lang.getCom('buttonNames.confirm-ban'))
                    .setLabel('Confirm Ban')
                    .setStyle(ButtonStyle.Danger);

                const cancelBanButton = new ButtonBuilder()
                    .setCustomId(Lang.getCom('buttonNames.cancel-ban'))
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary);

                const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
                    confirmBanButton,
                    cancelBanButton,
                ]);

                await selectMenuInteraction.update({
                    content: `Are you sure you want to ban <@${targetMember.user.id}> for ${selectedReason}?`,
                    components: [buttonRow],
                });
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            await intr.followUp({
                content:
                    'No selection or confirmation made within the time limit. Ban action canceled.',
                ephemeral: true,
            });
        }
    }
}
