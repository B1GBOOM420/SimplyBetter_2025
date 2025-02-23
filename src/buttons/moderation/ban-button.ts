import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputApplicationCommandData,
} from 'discord.js';
import { Button, ButtonDeferType } from '../button.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { ClientUtils } from '../../utils/client-utils.js';
import { ModerationUtils } from '../../utils/moderation-utils.js';
import { SecurityUtils } from '../../utils/security-utils.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class BanUserButton implements Button {
    public ids = [Lang.getCom('buttonNames.ban')];
    public deferType = ButtonDeferType.UPDATE;
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

        const confrimBanButton = new ButtonBuilder()
            .setCustomId(Lang.getCom('buttonNames.confirm-ban'))
            .setLabel('Ban Hammer')
            .setEmoji('🔨')
            .setStyle(ButtonStyle.Danger);

        const cancelBanButton = new ButtonBuilder()
            .setCustomId(Lang.getCom('buttonNames.cancel-ban'))
            .setLabel('Cancel')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
            confrimBanButton,
            cancelBanButton,
        ]);

        const buttonValidation = Lang.getEmbed('validationEmbeds.buttonConfirmation', data.lang, {
            CONFIRMATION_STRING: `Are you sure you want to ban\n${targetMember.user.tag} ( ${targetMember.user.id} )?`,
        });

        InteractionUtils.send(
            intr,
            {
                embeds: [buttonValidation],
                components: [row],
            },
            true
        );
    }
}
