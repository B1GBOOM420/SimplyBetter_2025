import { ButtonInteraction, ChatInputApplicationCommandData } from 'discord.js';
import { Button, ButtonDeferType } from '../button.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { ClientUtils } from '../../utils/client-utils.js';
import { ModerationUtils } from '../../utils/moderation-utils.js';
import { SecurityUtils } from '../../utils/security-utils.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class TimeoutUserButton implements Button {
    public ids = [Lang.getCom('buttonNames.timeout')];
    public deferType = ButtonDeferType.REPLY;
    public requireGuild = true;
    public requireEmbedAuthorTag: true;
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('buttonNames.timeout'),
        description: 'A button shown on the check command to action a user',
        defaultMemberPermissions: ['ManageMessages'],
        dmPermission: false,
    };

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        const { guild } = intr;
        const targetText = intr.message.embeds[0].footer.text;

        const targetMember = await ClientUtils.findMember(intr.guild, targetText);

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

        await ModerationUtils.timeoutUser(
            intr,
            targetMember,
            Lang.getRef('moderation.base', data.lang)
        );
    }
}
