import jwt from 'jsonwebtoken';

// Function to generate a JWT token for a user
export const generateToken = (userID, res) => {
    const payload = { id: userID }
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })

    // Set the token in an HTTP-only cookie
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development" ? false : true, //this will be true in production and false in development
        sameSite: "strict", // Prevent CSRF attacks
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    })
}