import * as userRepo from "../repositories/user.repository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUsers = asyncHandler(async (req, res) => {
    const users = await userRepo.findAll();
    res.json(users);

});

export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Authorization check: Admin can see anyone, users can only see themselves
    if (req.user.role !== 'ADMIN' && req.user._id.toString() !== id) {
        return res.status(403).json({ error: "Access denied. You can only view your own profile." });
    }

    const user = await userRepo.findById(id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Authorization check: Admin can update anyone, users can only update themselves
    if (req.user.role !== 'ADMIN' && req.user._id.toString() !== id) {
        return res.status(403).json({ error: "Access denied. You can only update your own profile." });
    }

    // Role restriction: Non-admins cannot change their own role or others' roles
    const updateData = { name, email };
    if (req.user.role === 'ADMIN' && role) {
        updateData.role = role;
    }

    const updatedUser = await userRepo.updateById(id, updateData);
    if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({
        message: "User updated successfully",
        user: updatedUser
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userRepo.findById(id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    await userRepo.deleteById(id);
    res.json({ message: "User deleted successfully" });
});
