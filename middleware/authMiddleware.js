
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token is required.",
            });
        }

        const token = authHeader.split(" ")[1];

        // 2. Verify token
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");

            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Find user in database
        const user = await User.findById(decoded.userId).select(
            "_id name email role"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists",
            });
        }

        // 4. Attach user to request
        req.user = user;

        // 5. Continue to the next middleware or route
        next();
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        console.error("Authentication error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export default authMiddleware;
