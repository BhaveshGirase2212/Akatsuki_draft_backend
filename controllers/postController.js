
import mongoose from "mongoose";
import Post from "../models/Post.js";

// Create a new post or save it as a draft
const createPost = async (req, res) => {
    try {
        const { title, content, status = "draft" } = req.body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof content !== "string" ||
            !content.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required",
            });
        }

        if (title.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: "Title cannot exceed 200 characters",
            });
        }

        if (!["draft", "pending"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be draft or pending",
            });
        }

        const post = await Post.create({
            title: title.trim(),
            content: content.trim(),
            author: req.user._id,
            status,
            submittedAt: status === "pending" ? new Date() : null,
        });

        return res.status(201).json({
            success: true,
            message:
                status === "draft"
                    ? "Draft saved successfully"
                    : "Post submitted for admin approval",
            post,
        });
    } catch (error) {
        console.error("Create post error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create post",
        });
    }
};

// Get only admin-approved posts
const getApprovedPosts = async (req, res) => {
    try {
        const posts = await Post.find({ status: "approved" })
            .populate("author", "name")
            .sort({ approvedAt: -1 });

        return res.status(200).json({
            success: true,
            count: posts.length,
            posts,
        });
    } catch (error) {
        console.error("Get approved posts error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch posts",
        });
    }
};

// Get one post by ID, only if approved
const getApprovedPostById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid post ID",
            });
        }

        const post = await Post.findOne({
            _id: id,
            status: "approved",
        }).populate("author", "name");

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Approved post not found",
            });
        }

        return res.status(200).json({
            success: true,
            post,
        });
    } catch (error) {
        console.error("Get approved post error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch post",
        });
    }
};

// Get all posts belonging to the logged-in user
const getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            author: req.user._id,
        }).sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: posts.length,
            posts,
        });
    } catch (error) {
        console.error("Get my posts error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your posts",
        });
    }
};

// Update a post owned by the logged-in user
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, status } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid post ID",
            });
        }

        if (
            title === undefined &&
            content === undefined &&
            status === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide title, content, or status to update",
            });
        }

        const updates = {};

        if (title !== undefined) {
            if (
                typeof title !== "string" ||
                !title.trim() ||
                title.trim().length > 200
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Title must be 1–200 characters",
                });
            }

            updates.title = title.trim();
        }

        if (content !== undefined) {
            if (typeof content !== "string" || !content.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Content cannot be empty",
                });
            }

            updates.content = content.trim();
        }

        if (status !== undefined) {
            if (!["draft", "pending"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be draft or pending",
                });
            }

            updates.status = status;
            updates.submittedAt =
                status === "pending" ? new Date() : null;
        }

        const post = await Post.findOne({
            _id: id,
            author: req.user._id,
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found or you do not own this post",
            });
        }

        // Edited approved posts must be reviewed again.
        if (post.status === "approved") {
            updates.status = "pending";
            updates.submittedAt = new Date();
            updates.approvedAt = null;
        }

        Object.assign(post, updates);
        await post.save();

        return res.status(200).json({
            success: true,
            message:
                post.status === "pending"
                    ? "Post updated and submitted for admin approval"
                    : "Post updated successfully",
            post,
        });
    } catch (error) {
        console.error("Update post error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update post",
        });
    }
};

// Delete a post owned by the logged-in user
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid post ID",
            });
        }

        const post = await Post.findOneAndDelete({
            _id: id,
            author: req.user._id,
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found or you do not own this post",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        console.error("Delete post error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete post",
        });
    }
};

export {
    createPost,
    getApprovedPosts,
    getApprovedPostById,
    getMyPosts,
    updatePost,
    deletePost,
};
