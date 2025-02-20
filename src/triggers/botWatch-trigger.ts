import { Message, TextBasedChannel } from 'discord.js';

import { EventData } from '../models/internal-models.js';
import { Trigger } from './index.js';
import { Lang } from '../services/lang.js';
import { MessageUtils } from '../utils/message-utils.js';

export class BotWatchTrigger implements Trigger {
    public requireGuild = true;

    public triggered(msg: Message): boolean {
        const exemptFromTrigger = nonAsyncCheckBotRole(msg);

        return msg.author.bot && exemptFromTrigger === false;
    }

    public async execute(msg: Message, data: EventData): Promise<void> {
        const { guild, author } = msg;

        await MessageUtils.sendToLogChannel(
            guild,
            `${author} has the bot flag set to TRUE on their account - This is a bad sign, remove this user ASAP`
        );
    }
}

function nonAsyncCheckBotRole(msg: Message): boolean {
    const { guild, author } = msg;
    const Member = guild.members.cache.get(author.id);

    const HasBotRole = Member.roles.cache.get(Lang.getCom('roles.bot'));

    if (!HasBotRole) {
        return false;
    }

    if (HasBotRole) {
        return true;
    }
}
