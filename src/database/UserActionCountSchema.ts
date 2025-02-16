import mongoose from 'mongoose';

const UserActionCountSchema = new mongoose.Schema({
    messageCount: {
        type: Number,
        required: true,
        default: 0,
    },
    reactionCount: {
        type: Number,
        required: true,
        default: 0,
    },
    discord_id: {
        type: String,
        required: true,
    },
    timesJoined: {
        type: Number,
        required: true,
        default: 1,
    },
});

export default mongoose.model('msgcounts', UserActionCountSchema);
