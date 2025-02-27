import mongoose from 'mongoose';

export interface IDeployment {
    discord_id: string;
    regionRole: string;
    platformRole: string;
    micRole: string;
    playStyleRole: string;
    ageRole: string;
    KdRole: string;
}

const deploymentSchema = new mongoose.Schema({
    discord_id: {
        type: String,
        required: true,
    },
    regionRole: {
        type: String,
        required: true,
    },
    platformRole: {
        type: String,
        required: false,
        default: null,
    },
    micRole: {
        type: String,
        required: false,
        default: null,
    },
    playStyleRole: {
        type: String,
        required: false,
        default: null,
    },
    ageRole: {
        type: String,
        required: false,
        default: null,
    },
    KdRole: {
        type: String,
        required: false,
        default: null,
    },
});

export default mongoose.model<IDeployment>('deployment', deploymentSchema);
