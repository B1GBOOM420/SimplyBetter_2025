import { Message, BaseMessageOptions, TextBasedChannel } from 'discord.js';

import { EventData } from '../models/internal-models.js';
import { Lang } from '../services/index.js';
import { MessageUtils } from '../utils/message-utils.js';
import { Trigger } from './index.js';

export class AskJgodTrigger implements Trigger {
    public requireGuild = true;

    public triggered(msg: Message): boolean {
        const exemptFromTrigger = nonAsyncCheckModOrHigher(msg);

        return (
            !msg.content.includes(Lang.getCom('users.jgod')) &&
            msg.channel.id === Lang.getCom('channels.askJGOD') &&
            exemptFromTrigger === false
        );
    }

    public async execute(msg: Message, data: EventData): Promise<void> {
        const { guild } = msg;
        try {
            msg.delete();
        } catch (error) {
            const errorEmbed = Lang.getEmbed('errorEmbeds.logErrorEmbed', data.lang, {
                STACKERROR: error.content,
            });

            const ErrorLog: BaseMessageOptions = {
                content: `<@${Lang.getCom('users.boom')}>`,
                embeds: [errorEmbed],
            };

            MessageUtils.sendToLogChannel(guild, ErrorLog);
            return;
        }
    }
}

function nonAsyncCheckModOrHigher(msg: Message): boolean {
    const { guild, author } = msg;
    const Member = guild.members.cache.get(author.id);
    const targetHighestRolePosition = Member?.roles?.highest?.position;
    const moderationRolePosition = guild.roles.cache.get(Lang.getCom('roles.moderator')).position;

    if (targetHighestRolePosition < moderationRolePosition) {
        return false;
    }

    if (targetHighestRolePosition >= moderationRolePosition) {
        return true;
    }
}
