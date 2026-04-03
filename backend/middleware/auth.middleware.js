import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authorizeRoles } from "./role.middleware.js";

export const authenticate = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Check for token in Authorization header (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        const potentialToken = req.headers.authorization.split(" ")[1];
        if (potentialToken && potentialToken !== "null" && potentialToken !== "undefined") {
            token = potentialToken;
        }
    }

    // 2. Fallback to token in httpOnly cookie
    if (!token && req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return res.status(401).json({
            error: "Not authorized, no token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB and omit sensitive fields
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                error: "User no longer exists"
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            error: "Not authorized, token failed"
        });
    }
});

// Alias for standard authentication usage
export const protect = authenticate;

// Optional authentication that doesn't halt request.
export const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

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

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (user) {
            req.user = user;
        }

        next();
    } catch (error) {
        // Continue even on verification failure (token expired/invalid)
        next();
    }
});


// estricts access to specific user roles.

export const authorize = (...roles) => {
    return authorizeRoles(...roles);
};

