import { ButtonInteraction, ChatInputApplicationCommandData, Locale } from 'discord.js';
import { Button, ButtonDeferType } from '../button.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { ClientUtils } from '../../utils/client-utils.js';
import { ModerationUtils } from '../../utils/moderation-utils.js';
import { Logger } from '../../services/logger.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class ConfirmBanUserButton implements Button {
    public ids = [Lang.getCom('buttonNames.confirm-ban')];
    public deferType = ButtonDeferType.REPLY;
    public requireGuild = true;
    public requireEmbedAuthorTag: true;
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('buttonNames.confirm-ban'),
        description: 'A button shown on the check command to action a user',
        defaultMemberPermissions: ['ManageMessages'],
        dmPermission: false,
    };

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        const targetText = intr.message.content;
        const targetReason = intr.message.content.split(' for ')[1].slice(0, -1);

        const targetMember = await ClientUtils.findMember(intr.guild, targetText);

        try {
            await ModerationUtils.banUser(intr, targetMember, targetReason);
        } catch (error) {
            Logger.error('ban failure', error);
            InteractionUtils.editReply(intr, 'Ive encountered and error');
        }
    }
}
