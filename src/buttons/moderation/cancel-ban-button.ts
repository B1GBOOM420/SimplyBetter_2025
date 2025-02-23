import { ButtonInteraction, ChatInputApplicationCommandData } from 'discord.js';
import { Button, ButtonDeferType } from '../button.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class CancelBanUserButton implements Button {
    public ids = [Lang.getCom('buttonNames.cancel-ban')];
    public deferType = ButtonDeferType.UPDATE;
    public requireGuild = true;
    public requireEmbedAuthorTag: true;
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('buttonNames.cancel-ban'),
        description: 'Cancel the ban process',
        defaultMemberPermissions: ['ManageMessages'],
        dmPermission: false,
    };

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        const buttonValidation = Lang.getEmbed('validationEmbeds.buttonConfirmation', data.lang, {
            CONFIRMATION_STRING: 'You saved a life today...Ban Canceled',
        });

        await InteractionUtils.editReply(intr, {
            embeds: [buttonValidation],
            components: [],
        });
    }
}
