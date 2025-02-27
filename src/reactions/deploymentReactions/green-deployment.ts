import { Message, MessageReaction, User } from 'discord.js';

import DeploymentSchema from '../../database/Deployment-Schema.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { Reaction } from '../index.js';

export class AsDeploymentReaction implements Reaction {
    public emoji = '🟢';
    public requireGuild = true;
    public requireSentByClient = true;
    public requireEmbedAuthorTag = false;

    public async execute(
        msgReaction: MessageReaction,
        msg: Message,
        reactor: User,
        data: EventData
    ): Promise<void> {
        const RegionalRole = Lang.getCom('roles.as');
        const RulesChannel = Lang.getCom('channel.rules');

        if (msg.channelId !== RulesChannel) {
            return;
        }

        const MemberSavedData = await DeploymentSchema.find({
            discord_id: reactor.id,
        });

        if (MemberSavedData.length > 0) {
            const previousRole = MemberSavedData.at(-1).regionRole;

            if (previousRole !== RegionalRole) {
                await msg.guild.members.cache.get(reactor.id).roles.remove(previousRole);

                await DeploymentSchema.findOneAndUpdate(
                    {
                        discord_id: reactor.id,
                    },
                    { regionRole: RegionalRole }
                );

                await msg.guild.members.cache.get(reactor.id).roles.add(RegionalRole);
            }

            return;
        }

        if (MemberSavedData.length === 0) {
            await DeploymentSchema.create({
                discord_id: reactor.id,
                regionRole: RegionalRole,
            });
            await msg.guild.members.cache.get(reactor.id).roles.add(RegionalRole);
        }
    }
}
