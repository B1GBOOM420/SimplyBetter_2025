import { ButtonInteraction, ChatInputApplicationCommandData } from 'discord.js';
import { Button, ButtonDeferType } from '../button.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { ClientUtils } from '../../utils/client-utils.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class VerifyTrueButton implements Button {
    public ids = [Lang.getCom('buttonNames.verify-true')];
    public deferType = ButtonDeferType.REPLY;
    public requireGuild = true;
    public requireEmbedAuthorTag: true;
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('buttonNames.verify-true'),
        description: 'Actual verify button',
        defaultMemberPermissions: [],
        dmPermission: false,
    };

    public async execute(intr: ButtonInteraction, data: EventData): Promise<void> {
        const { guild, member } = intr;

        const Member = await ClientUtils.findMember(guild, member.user.id);

        await Member.roles.add(Lang.getCom('roles.verification'));

        await InteractionUtils.send(intr, `Thank you for verifying - Welcome to ${guild.name}!`);
        return;
    }
}
