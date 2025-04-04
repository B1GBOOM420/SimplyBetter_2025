import { REST } from '@discordjs/rest';
import { Options, Partials } from 'discord.js';
import { createRequire } from 'node:module';

import {
    Button,
    WarnUserButton,
    BanUserButton,
    TimeoutUserButton,
    VerifyFalseButton,
    VerifyTrueButton,
    AwaitingRoleButton,
    ConfirmCloseTicketButton,
    FirstCloseTicketButton,
    OpenTicketButton,
    ReportSomeoneButton,
    UnlistedOptionButton,
    ConfirmBanUserButton,
    CancelBanUserButton,
} from './buttons/index.js';
import {
    AvatarSlashCommand,
    BanSlashCommand,
    CheckSlashCommand,
    RoleSlashCommand,
    TimeoutSlashCommand,
} from './commands/chat/index.js';
import {
    AgeGroundFiveReaction,
    AgeGroundFourReaction,
    AgeGroundOneReaction,
    AgeGroundThreeReaction,
    AgeGroundTwoReaction,
    AgressivePlaystyleReaction,
    AsDeploymentReaction,
    CautiousPlaystyleReaction,
    EuDeploymentReaction,
    HasMicReaction,
    HasNoMicReaction,
    KillDeathFiveReaction,
    KillDeathFourReaction,
    KillDeathOneReaction,
    KillDeathThreeReaction,
    KillDeathTwoReaction,
    MildPlaystyleReaction,
    NaeDeploymentReaction,
    NawDeploymentReaction,
    OcDeploymentReaction,
    PcPlatformReaction,
    PlayStationPlatformReaction,
    Reaction,
    SaDeploymentReaction,
    XboxPlatformReaction,
} from './reactions/index.js';
import {
    ChatCommandMetadata,
    Command,
    MessageCommandMetadata,
    UserCommandMetadata,
} from './commands/index.js';
import { CheckAuthorMessageCommand, TimeoutAuthorCommand } from './commands/message/index.js';
import { AvatarUserCommand, CheckUserCommand, TimeoutUserCommand } from './commands/user/index.js';
import {
    ButtonHandler,
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events/index.js';
import { CustomClient } from './extensions/index.js';
import { Job } from './jobs/index.js';
import { Bot } from './models/bot.js';
import {
    CommandRegistrationService,
    EventDataService,
    JobService,
    Logger,
} from './services/index.js';
import { AskJgodTrigger, BotWatchTrigger, Trigger } from './triggers/index.js';
import mongoose from 'mongoose';

const require = createRequire(import.meta.url);
let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function MongoConnection(): Promise<void> {
    try {
        await mongoose.connect(Config.client.mongoURI || '', {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        Logger.info('MongoDB connected!');
    } catch (error) {
        Logger.error('-> MongoDB Failed to connect!!!', error);
    }
}

async function start(): Promise<void> {
    // Services
    let eventDataService = new EventDataService();

    // Client
    let client = new CustomClient({
        intents: Config.client.intents,
        partials: (Config.client.partials as string[]).map(partial => Partials[partial]),
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.DefaultMakeCacheSettings,
            // Override specific options from config
            ...Config.client.caches,
        }),
    });

    // Commands
    let commands: Command[] = [
        new AvatarSlashCommand(),
        new BanSlashCommand(),
        new RoleSlashCommand(),
        new CheckSlashCommand(),
        new TimeoutSlashCommand(),

        // Message Context Commands
        new CheckAuthorMessageCommand(),
        new TimeoutAuthorCommand(),

        // // User Context Commands
        new CheckUserCommand(),
        new AvatarUserCommand(),
        new TimeoutUserCommand(),
        // TODO: Add new commands here
    ];

    // Buttons
    let buttons: Button[] = [
        // Moderation
        new WarnUserButton(),
        new BanUserButton(),
        new ConfirmBanUserButton(),
        new CancelBanUserButton(),
        new TimeoutUserButton(),

        // Verification
        new VerifyTrueButton(),
        new VerifyFalseButton(),

        // Ticketing
        new AwaitingRoleButton(),
        new FirstCloseTicketButton(),
        new ConfirmCloseTicketButton(),
        new ReportSomeoneButton(),
        new OpenTicketButton(),
        new UnlistedOptionButton(),
    ];

    // Reactions
    let reactions: Reaction[] = [
        new OcDeploymentReaction(),
        new EuDeploymentReaction(),
        new SaDeploymentReaction(),
        new AsDeploymentReaction(),
        new NaeDeploymentReaction(),
        new NawDeploymentReaction(),

        new PcPlatformReaction(),
        new PlayStationPlatformReaction(),
        new XboxPlatformReaction(),

        new HasMicReaction(),
        new HasNoMicReaction(),

        new AgressivePlaystyleReaction(),
        new MildPlaystyleReaction(),
        new CautiousPlaystyleReaction(),

        new AgeGroundOneReaction(),
        new AgeGroundTwoReaction(),
        new AgeGroundThreeReaction(),
        new AgeGroundFourReaction(),
        new AgeGroundFiveReaction(),

        new KillDeathOneReaction(),
        new KillDeathTwoReaction(),
        new KillDeathThreeReaction(),
        new KillDeathFourReaction(),
        new KillDeathFiveReaction(),
    ];

    // Triggers
    let triggers: Trigger[] = [
        // TODO: Add new triggers here
        new AskJgodTrigger(),
        new BotWatchTrigger(),
    ];

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler(eventDataService);
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler(commands, eventDataService);
    let buttonHandler = new ButtonHandler(buttons, eventDataService);
    let triggerHandler = new TriggerHandler(triggers, eventDataService);
    let messageHandler = new MessageHandler(triggerHandler);
    let reactionHandler = new ReactionHandler(reactions, eventDataService);

    // Jobs
    let jobs: Job[] = [
        // TODO: Add new jobs here
    ];

    // Bot
    let bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        commandHandler,
        buttonHandler,
        reactionHandler,
        new JobService(jobs)
    );

    // Register
    if (process.argv[2] == 'commands') {
        try {
            let rest = new REST({ version: '10' }).setToken(Config.client.token);
            let commandRegistrationService = new CommandRegistrationService(rest);
            let localCmds = [
                ...Object.values(ChatCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                ...Object.values(MessageCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                ...Object.values(UserCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
            ];
            await commandRegistrationService.process(localCmds, process.argv);
        } catch (error) {
            Logger.error(Logs.error.commandAction, error);
        }
        // Wait for any final logs to be written.
        await new Promise(resolve => setTimeout(resolve, 1000));
        process.exit();
    }

    await bot.start();
    await MongoConnection();
}

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
