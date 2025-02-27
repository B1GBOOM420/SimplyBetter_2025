import { Message, MessageReaction, User } from 'discord.js';

import DeploymentSchema from '../../database/Deployment-Schema.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { Reaction } from '../index.js';

export class CautiousPlaystyleReaction implements Reaction {
    public emoji = '⛺';
    public requireGuild = true;
    public requireSentByClient = true;
    public requireEmbedAuthorTag = false;

    public async execute(
        msgReaction: MessageReaction,
        msg: Message,
        reactor: User,
        data: EventData
    ): Promise<void> {
        const PlaystyleRole = Lang.getCom('roles.cautious');
        const RolesChannel = Lang.getCom('channel.rolesChannel');

        if (msg.channelId !== RolesChannel) {
            return;
        }

        const MemberSavedData = await DeploymentSchema.find({
            discord_id: reactor.id,
        });

        if (MemberSavedData.length > 0) {
            const previousRole = MemberSavedData.at(-1).playStyleRole;

            if (previousRole === null) {
                await DeploymentSchema.findOneAndUpdate(
                    {
                        discord_id: reactor.id,
                    },
                    { playStyleRole: PlaystyleRole }
                );
                await msg.guild.members.cache.get(reactor.id).roles.add(PlaystyleRole);
                return;
            }

            if (previousRole !== PlaystyleRole) {
                await msg.guild.members.cache.get(reactor.id).roles.remove(previousRole);

                await DeploymentSchema.findOneAndUpdate(
                    {
                        discord_id: reactor.id,
                    },
                    { playStyleRole: PlaystyleRole }
                );

                await msg.guild.members.cache.get(reactor.id).roles.add(PlaystyleRole);
                // }

                return;
            }

            if (MemberSavedData.length === 0) {
                await DeploymentSchema.create({
                    discord_id: reactor.id,
                    regionRole: PlaystyleRole,
                });
                await msg.guild.members.cache.get(reactor.id).roles.add(PlaystyleRole);

                throw new Error(
                    'This user can not be found in the database when trying to gain a Playstyle Role - New document created in mongoDB and user was roled, but wtf dude'
                );
            }
        }
    }
}
