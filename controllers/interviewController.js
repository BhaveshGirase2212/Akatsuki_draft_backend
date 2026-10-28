
import Interview from "../models/Interview.js";

// 1. Create a new interview
const createInterview = async (req, res) => {
    try {
        const {
            title,
            role,
            interviewType = "technical",
            difficulty = "medium",
            questions = [],
        } = req.body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof role !== "string" ||
            !role.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title and role are required",
            });
        }

        if (!["technical", "hr", "mixed"].includes(interviewType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview type",
            });
        }

        if (!["easy", "medium", "hard"].includes(difficulty)) {
            return res.status(400).json({
                success: false,
                message: "Invalid difficulty",
            });
        }

        if (
            !Array.isArray(questions) ||
            questions.some(
                (q) =>
                    !q ||
                    typeof q.question !== "string" ||
                    !q.question.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Questions must be an array of valid questions",
            });
        }

        const interview = await Interview.create({
            user: req.user._id,
            title: title.trim(),
            role: role.trim(),
            interviewType,
            difficulty,
            questions: questions.map((q) => ({
                question: q.question.trim(),
            })),
        });

        return res.status(201).json({
            success: true,
            message: "Interview created successfully",
            interview,
        });
    } catch (error) {
        console.error("Create interview error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create interview",
        });
    }
};

// 2. Get all interviews of the logged-in user
const getMyInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({
            user: req.user._id,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: interviews.length,
            interviews,
        });
    } catch (error) {
        console.error("Get interviews error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch interviews",
        });
    }
};

// 3. Start an interview
const startInterview = async (req, res) => {
    try {
        const interview = await Interview.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        if (interview.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Interview is already completed",
            });
        }

        if (interview.status === "pending") {
            interview.status = "in_progress";
            interview.startedAt = new Date();
            await interview.save();
        }

        return res.status(200).json({
            success: true,
            message: "Interview started successfully",
            interview,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid interview ID",
            });
        }

        console.error("Start interview error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to start interview",
        });
    }
};

// 4. Save an answer
const saveAnswer = async (req, res) => {
    try {
        const { questionId, answer } = req.body;

        if (
            typeof questionId !== "string" ||
            !questionId.trim() ||
            typeof answer !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid questionId and answer are required",
            });
        }

        const interview = await Interview.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        if (interview.status !== "in_progress") {
            return res.status(400).json({
                success: false,
                message: "Start the interview before saving answers",
            });
        }

        const question = interview.questions.id(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        question.answer = answer.trim();
        await interview.save();

        return res.status(200).json({
            success: true,
            message: "Answer saved successfully",
            question,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid interview or question ID",
            });
        }

        console.error("Save answer error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save answer",
        });
    }
};

// 5. Save a score and feedback for one question
const setQuestionScore = async (req, res) => {
    try {
        const { questionId, score, feedback } = req.body;

        if (
            typeof questionId !== "string" ||
            !questionId.trim() ||
            typeof score !== "number" ||
            !Number.isFinite(score) ||
            score < 0 ||
            score > 10 ||
            (feedback !== undefined && typeof feedback !== "string")
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Provide a valid questionId, score between 0 and 10, and optional feedback string",
            });
        }

        const interview = await Interview.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        if (interview.status !== "in_progress") {
            return res.status(400).json({
                success: false,
                message: "Interview must be in progress to score answers",
            });
        }

        const question = interview.questions.id(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        question.score = score;

        if (feedback !== undefined) {
            question.feedback = feedback.trim();
        }

        await interview.save();

        return res.status(200).json({
            success: true,
            message: "Question score and feedback saved successfully",
            question,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid interview or question ID",
            });
        }

        console.error("Set question score error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save question score",
        });
    }
};

// 6. Complete the interview and calculate the overall score
const completeInterview = async (req, res) => {
    try {
        const interview = await Interview.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        if (interview.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Interview is already completed",
            });
        }

        if (interview.status !== "in_progress") {
            return res.status(400).json({
                success: false,
                message: "Start the interview before completing it",
            });
        }

        if (interview.questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Interview has no questions to score",
            });
        }

        const allScored = interview.questions.every(
            (question) =>
                typeof question.score === "number" &&
                Number.isFinite(question.score) &&
                question.score >= 0 &&
                question.score <= 10
        );

        if (!allScored) {
            return res.status(400).json({
                success: false,
                message: "Score every question before completing the interview",
            });
        }

        const totalScore = interview.questions.reduce(
            (sum, question) => sum + question.score,
            0
        );

        interview.overallScore = Number(
            (totalScore / interview.questions.length).toFixed(2)
        );

        interview.status = "completed";
        interview.completedAt = new Date();

        await interview.save();

        return res.status(200).json({
            success: true,
            message: "Interview completed successfully",
            overallScore: interview.overallScore,
            interview,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid interview ID",
            });
        }

        console.error("Complete interview error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to complete interview",
        });
    }
};

export {
    createInterview,
    getMyInterviews,
    startInterview,
    saveAnswer,
    setQuestionScore,
    completeInterview,
};
