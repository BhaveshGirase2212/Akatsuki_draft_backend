
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
    createInterview,
    getMyInterviews,
    startInterview,
    saveAnswer,
    setQuestionScore,
    completeInterview,
} from "../controllers/interviewController.js";

const router = express.Router();

// Create an interview
router.post("/", authMiddleware, createInterview);

// Get logged-in user's interviews
router.get("/", authMiddleware, getMyInterviews);

// Start an interview
router.patch("/:id/start", authMiddleware, startInterview);

// Save an answer
router.patch("/:id/answer", authMiddleware, saveAnswer);

// Score a question and save feedback
router.patch("/:id/score", authMiddleware, setQuestionScore);

// Complete an interview
router.patch("/:id/complete", authMiddleware, completeInterview);

export default router;
