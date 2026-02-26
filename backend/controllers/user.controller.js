import * as userRepo from "../repositories/user.repository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @desc    Get all users with filtering
// @route   GET /api/users
// @access  Private (Admin, Ranger)
export const getUsers = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = { createdAt: -1 };

    const query = {};
    if (req.query.role) query.role = req.query.role.toUpperCase();

    const skip = (page - 1) * limit;

    // Concurrently fetch counts and paginated data
    const [total, users] = await Promise.all([
        userRepo.count(query),
        userRepo.findWithPagination(query, sort, skip, limit)
    ]);

    res.json({
        data: users,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit) || 1
        }
    });
});

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private (Self or Admin)
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

// @desc    Update user profile or role
// @route   PUT /api/users/:id
// @access  Private (Self or Admin)
export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Authorization check: Admin can update anyone, users can only update themselves
    if (req.user.role !== 'ADMIN' && req.user._id.toString() !== id) {
        return res.status(403).json({ error: "Access denied. You can only update your own profile." });
    }

    // Role restriction: Non-admins CANNOT change their own role or anyone else's
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    if (role !== undefined) {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: "Access denied. Only admins can update user roles." });
        }
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

// @desc    Delete user record
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userRepo.findById(id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    await userRepo.deleteById(id);
    res.json({ message: "User deleted successfully" });
});
