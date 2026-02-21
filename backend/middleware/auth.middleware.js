import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authorizeRoles } from "./role.middleware.js";

// Alias for protect - used in incident routes
export const authenticate = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Get token from header or cookie
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        const potentialToken = req.headers.authorization.split(" ")[1];
        if (potentialToken && potentialToken !== "null" && potentialToken !== "undefined") {
            token = potentialToken;
        }
    }

    if (!token && req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    // 2. No token
    if (!token) {
        return res.status(401).json({
            error: "Not authorized, no token provided"
        });
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Get user
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                error: "User no longer exists"
            });
        }

        // 5. Attach user to request
        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            error: "Not authorized, token failed"
        });
    }
});

// Keep the original protect export for backward compatibility
export const protect = authenticate;

// Optional authentication - doesn't fail if no token, but attaches user if token is valid
export const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Get token from header or cookie
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        const potentialToken = req.headers.authorization.split(" ")[1];
        if (potentialToken && potentialToken !== "null" && potentialToken !== "undefined") {
            token = potentialToken;
        }
    }

    if (!token && req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    // 2. If no token, just continue (don't attach user)
    if (!token) {
        return next();
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Get user
        const user = await User.findById(decoded.id).select("-password");

        if (user) {
            // 5. Attach user to request if token is valid
            req.user = user;
        }

        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
});

// Authorization middleware - checks if user has required roles
export const authorize = (...roles) => {
    return authorizeRoles(...roles);
};
