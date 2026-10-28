
const adminMiddleware = (req, res, next) => {
    // Check whether user is authenticated
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    // Check whether user has admin role
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin only.",
        });
    }

    // User is an admin
    next();
};

export default adminMiddleware;
