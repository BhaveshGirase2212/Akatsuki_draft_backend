
import mongoose from "mongoose";
import Post from "../models/Post.js";

// 1. Get all pending posts
export const getPendingPosts = async (req, res) => {
    try {
        const posts = await Post.find({ status: "pending" })
            .populate("author", "name email")
            .sort({ submittedAt: -1 });

        return res.status(200).json({
            success: true,
            count: posts.length,
            posts,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending posts",
        });
    }
};

// 2. Approve a pending post
export const approvePost = async (req, res) => {
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
            status: "pending",
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Pending post not found",
            });
        }

        post.status = "approved";
        post.approvedAt = new Date();
        post.rejectionReason = "";

        await post.save();

        return res.status(200).json({
            success: true,
            message: "Post approved successfully",
            post,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to approve post",
        });
    }
};

// 3. Reject a pending post
export const rejectPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid post ID",
            });
        }

        if (
            typeof rejectionReason !== "string" ||
            !rejectionReason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a rejection reason",
            });
        }

        const post = await Post.findOne({
            _id: id,
            status: "pending",
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Pending post not found",
            });
        }

        post.status = "rejected";
        post.rejectionReason = rejectionReason.trim();

        await post.save();

        return res.status(200).json({
            success: true,
            message: "Post rejected successfully",
            post,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to reject post",
        });
    }
};
