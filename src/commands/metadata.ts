import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    PermissionFlagsBits,
    PermissionsBitField,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';

// import { Args } from './index.js';
import { Language } from '../models/enum-helpers/index.js';
import { Lang } from '../services/index.js';

export const ChatCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    TEST: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.test', Language.Default),
        description: Lang.getRef('commandDescs.test', Language.Default),
        dm_permission: true,
        default_member_permissions: undefined,
    },
    SHOWAVATAR: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.showAvatar', Language.Default),
        description: Lang.getRef('commandDescs.showAvatar', Language.Default),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'user',
                description:
                    'The target whoms profile picture you want to see - @User-mention / User-ID',
                required: false,
            },
            {
                type: ApplicationCommandOptionType.Boolean,
                name: 'hide-response',
                description: 'Whether the avatar embed should be hidden (default: false).',
                required: false,
            },
        ],
    },
};

export const MessageCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {
    VIEW_DATE_SENT: {
        type: ApplicationCommandType.Message,
        name: Lang.getRef('messageCommands.viewDateSent', Language.Default),
        default_member_permissions: undefined,
        dm_permission: true,
    },
};

export const UserCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {
    VIEW_DATE_JOINED: {
        type: ApplicationCommandType.User,
        name: Lang.getRef('userCommands.viewDateJoined', Language.Default),
        default_member_permissions: undefined,
        dm_permission: true,
    },
};
