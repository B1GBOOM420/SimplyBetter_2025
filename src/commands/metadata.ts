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
    ROLE: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.role', Language.Default),
        description: Lang.getRef('commandDescs.role', Language.Default),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'add-or-remove',
                description: 'The choice on what you would like to do with the specified role',
                required: true,
                choices: [
                    { name: 'add', value: 'ADD' },
                    { name: 'remove', value: 'REMOVE' },
                ],
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'user',
                description:
                    'The user you want to add / remove a role from - @User-mention / User-ID',
                required: true,
            },
            {
                name: 'role-mention',
                description: 'The role you wish to add or remove ( ONE PER COMMAND )',
                type: ApplicationCommandOptionType.Mentionable,
                required: true,
            },
        ],
    },
    CHECK: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.check', Language.Default),
        description: Lang.getRef('commandDescs.check', Language.Default),
        dm_permission: false,
        default_member_permissions: undefined,
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'user',
                description: 'The user you want to check information on - @User-mention / User-ID',
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
