import { Message, MessageReaction, User } from 'discord.js';

import DeploymentSchema from '../../database/Deployment-Schema.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { Reaction } from '../index.js';

export class XboxPlatformReaction implements Reaction {
    public emoji = '❌';
    public requireGuild = true;
    public requireSentByClient = true;
    public requireEmbedAuthorTag = false;

    public async execute(
        msgReaction: MessageReaction,
        msg: Message,
        reactor: User,
        data: EventData
    ): Promise<void> {
        const PlatformRole = Lang.getCom('roles.xbox');
        const RolesChannel = Lang.getCom('channel.rolesChannel');

        if (msg.channelId !== RolesChannel) {
            return;
        }

        const MemberSavedData = await DeploymentSchema.find({
            discord_id: reactor.id,
        });

        if (MemberSavedData.length > 0) {
            const previousRole = MemberSavedData.at(-1).platformRole;

            if (previousRole === null) {
                await DeploymentSchema.findOneAndUpdate(
                    {
                        discord_id: reactor.id,
                    },
                    { platformRole: PlatformRole }
                );
                await msg.guild.members.cache.get(reactor.id).roles.add(PlatformRole);
                return;
            }

            if (previousRole !== PlatformRole) {
                await msg.guild.members.cache.get(reactor.id).roles.remove(previousRole);

                await DeploymentSchema.findOneAndUpdate(
                    {
                        discord_id: reactor.id,
                    },
                    { platformRole: PlatformRole }
                );

                await msg.guild.members.cache.get(reactor.id).roles.add(PlatformRole);

                return;
            }

            if (MemberSavedData.length === 0) {
                await DeploymentSchema.create({
                    discord_id: reactor.id,
                    regionRole: PlatformRole,
                });
                await msg.guild.members.cache.get(reactor.id).roles.add(PlatformRole);

                throw new Error(
                    'This user can not be found in the database when trying to gain a Platform Role - New document created in mongoDB and user was roled, but wtf dude'
                );
            }
        }
    }
}
