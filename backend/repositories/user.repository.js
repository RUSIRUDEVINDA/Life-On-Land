import User from "../models/User.js";

// Create a new user document
export const create = (data) => User.create(data);

// Find user by email
export const findByEmail = (email) => User.findOne({ email });

// Find user by email and include password (used for login)
export const findByEmailWithPassword = (email) =>
    User.findOne({ email }).select("+password");

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
