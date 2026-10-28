
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true,
        },
        answer: {
            type: String,
            default: "",
        },
        feedback: {
            type: String,
            default: "",
        },
        score: {
            type: Number,
            min: 0,
            max: 10,
            default: null,
        },
    },
    { _id: true }
);

const interviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        role: {
            type: String,
            required: true,
            trim: true,
        },
        interviewType: {
            type: String,
            enum: ["technical", "hr", "mixed"],
            default: "technical",
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },
        questions: {
            type: [questionSchema],
            default: [],
        },
        overallScore: {
            type: Number,
            min: 0,
            max: 10,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed"],
            default: "pending",
        },
        startedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
