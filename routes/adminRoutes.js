
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
    getPendingPosts,
    approvePost,
    rejectPost,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes below require an authenticated admin
router.use(authMiddleware, adminMiddleware);

// Admin-only test route
router.get("/test", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Admin access granted",
        user: {
            id: req.user._id,
            name: req.user.name,
            role: req.user.role,
        },
    });
});

// Get all posts waiting for approval
router.get("/posts/pending", getPendingPosts);

// Approve a pending post
router.patch("/posts/approve/:id", approvePost);

// Reject a pending post
router.patch("/posts/reject/:id", rejectPost);

export default router;
