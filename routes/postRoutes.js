
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
    createPost,
    getApprovedPosts,
    getApprovedPostById,
    getMyPosts,
    updatePost,
    deletePost,
} from "../controllers/postController.js";

const router = express.Router();

// Get logged-in user's posts and drafts
router.get("/my-posts", authMiddleware, getMyPosts);

// Get all approved posts
router.get("/", getApprovedPosts);

// Create a post or save a draft
router.post("/", authMiddleware, createPost);

// Update a post owned by the logged-in user
router.patch("/:id", authMiddleware, updatePost);

// Delete a post owned by the logged-in user
router.delete("/:id", authMiddleware, deletePost);

// Get one approved post by ID
router.get("/:id", getApprovedPostById);

export default router;
