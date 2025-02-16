import mongoose from 'mongoose';

interface IModeration {
    discord_id: string;
    type: string;
    reason: string;
    moderator: string;
    time: string;
    duration?: string;
    roles?: [string];
}

const modSchema = new mongoose.Schema({
    discord_id: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    moderator: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    duration: {
        type: String || null,
    },
    roles: [String],
});

export default mongoose.model<IModeration>('moderations', modSchema);
