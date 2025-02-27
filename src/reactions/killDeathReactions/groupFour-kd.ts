import { Message, MessageReaction, User } from 'discord.js';

import DeploymentSchema from '../../database/Deployment-Schema.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { Reaction } from '../index.js';

export class KillDeathFourReaction implements Reaction {
    public emoji = '4️⃣';
    public requireGuild = true;
    public requireSentByClient = true;
    public requireEmbedAuthorTag = false;

    public async execute(
        msgReaction: MessageReaction,
        msg: Message,
        reactor: User,
        data: EventData
    ): Promise<void> {
        const KillDeathRole = Lang.getCom('roles.kd4');
        const RolesChannel = Lang.getCom('channel.rolesChannel');

        if (msg.channelId !== RolesChannel) {
            return;
        }

        const MemberSavedData = await DeploymentSchema.find({
            discord_id: reactor.id,
        });

        if (MemberSavedData.length > 0) {
            const previousRole = MemberSavedData.at(-1).KdRole;

            if (previousRole === null) {
                await DeploymentSchema.findOneAndUpdate(
                    {
                        discord_id: reactor.id,
                    },
                    { KdRole: KillDeathRole }
                );
                await msg.guild.members.cache.get(reactor.id).roles.add(KillDeathRole);
                return;
            }

            if (previousRole !== KillDeathRole) {
                await msg.guild.members.cache.get(reactor.id).roles.remove(previousRole);

                await DeploymentSchema.findOneAndUpdate(
                    {
                        discord_id: reactor.id,
                    },
                    { KdRole: KillDeathRole }
                );

                await msg.guild.members.cache.get(reactor.id).roles.add(KillDeathRole);
                // }

                return;
            }

            if (MemberSavedData.length === 0) {
                await DeploymentSchema.create({
                    discord_id: reactor.id,
                    regionRole: KillDeathRole,
                });
                await msg.guild.members.cache.get(reactor.id).roles.add(KillDeathRole);

                throw new Error(
                    'This user can not be found in the database when trying to gain a KillDeathRole - New document created in mongoDB and user was roled, but wtf dude'
                );
            }
        }
    }
}
