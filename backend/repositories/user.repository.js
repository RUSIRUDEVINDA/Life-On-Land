import User from "../models/User.js";

const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Create a new user document
export const create = (data) => User.create(data);

// Find user by email
export const findByEmail = (email) => {
    const em = String(email || "").trim();
    if (!em) return Promise.resolve(null);
    return User.findOne({ email: new RegExp(`^${escapeRegExp(em)}$`, "i") });
};

// Find user by phone
export const findByPhone = (phone) => User.findOne({ phone });

// Find user by email and include password (used for login)
export const findByEmailWithPassword = (email) => {
    const em = String(email || "").trim();
    if (!em) return Promise.resolve(null);
    return User.findOne({ email: new RegExp(`^${escapeRegExp(em)}$`, "i") }).select("+password");
};

export const findByPasswordResetTokenHash = (passwordResetTokenHash) =>
    User.findOne({
        passwordResetTokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
    });

// Find user by Mongo ID
export const findById = (id) => User.findById(id);

//Find all users
export const findAll = () => User.find({});

//Find users with pagination and sorting
export const findWithPagination = (query, sort, skip, limit) =>
    User.find(query).sort(sort).skip(skip).limit(limit);

// Count users matching a query
export const count = (query) =>
    User.countDocuments(query);

// Update user by Mongo ID
export const updateById = (id, update) =>
    User.findByIdAndUpdate(id, update, { new: true });

// Delete user by Mongo ID
export const deleteById = (id) => User.findByIdAndDelete(id);

export default {
    create,
    findByEmail,
    findByEmailWithPassword,
    findByPasswordResetTokenHash,
    findById,
    findAll,
    findWithPagination,
    count,
    updateById,
    deleteById,
};

