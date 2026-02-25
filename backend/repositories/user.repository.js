import User from "../models/User.js";

export const create = (data) => User.create(data);

export const findByEmail = (email) => User.findOne({ email });

export const findByEmailWithPassword = (email) =>
    User.findOne({ email }).select("+password");

export const findById = (id) => User.findById(id);

export const findAll = () => User.find({});

export const updateById = (id, update) =>
    User.findByIdAndUpdate(id, update, { new: true });

export const deleteById = (id) => User.findByIdAndDelete(id);
