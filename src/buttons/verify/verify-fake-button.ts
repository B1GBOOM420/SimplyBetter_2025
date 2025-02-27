import { ButtonInteraction, ChatInputApplicationCommandData } from 'discord.js';
import { Button, ButtonDeferType } from '../button.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class VerifyFalseButton implements Button {
    public ids = [Lang.getCom('buttonNames.verify-false')];
    public deferType = ButtonDeferType.REPLY;
    public requireGuild = true;
    public requireEmbedAuthorTag: true;
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('buttonNames.verify-false'),
        description: 'Bait button to attempt to keep bots out.',
        defaultMemberPermissions: [],
        dmPermission: false,
    };

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        await InteractionUtils.send(
            intr,
            'You must press the correct button to gain access to this server! Please try again'
        );
    }
}
