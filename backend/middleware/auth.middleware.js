import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
    console.log("Auth middleware reached");
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
