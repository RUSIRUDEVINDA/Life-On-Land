import * as userRepo from "../repositories/user.repository.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import { cloudinary } from "../utils/cloudinary.js";


// @desc    Get all users with filtering
// @route   GET /api/users
// @access  Private (Admin, Ranger)
export const getUsers = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = { createdAt: -1 };

    const query = {};
    if (req.query.role) query.role = req.query.role.toUpperCase();
    if (req.query.name) query.name = { $regex: req.query.name, $options: "i" };
    if (req.query.email) query.email = { $regex: req.query.email, $options: "i" };
    if (req.query.phone) query.phone = { $regex: req.query.phone, $options: "i" };

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
    const { name, email, phone, role, password } = req.body;
    const isSelf = req.user._id.toString() === id;
    const isAdmin = req.user.role === 'ADMIN';

    // Authorization check: 
    // 1. Rangers can only update themselves
    // 2. Admins can update others, but with restrictions
    if (!isAdmin && !isSelf) {
        return res.status(403).json({ error: "Access denied. You can only update your own profile." });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;

    // Field-level Authorization:
    // Only 'self' or an 'Admin' can change email
    if (email !== undefined) {
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ error: "Access denied. Only you or an admin can change email." });
        }
        updateData.email = email;
    }

    // Only 'self' or an 'Admin' can change phone
    if (phone !== undefined) {
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ error: "Access denied. Only you or an admin can change phone." });
        }
        updateData.phone = phone;
    }

    // Only 'self' can change password (Admins cannot change others' passwords)
    if (password !== undefined) {
        if (!isSelf) {
            return res.status(403).json({ error: "Access denied. Only you can change your own password." });
        }
        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    // Role restriction: Only admins can change roles
    if (role !== undefined) {
        if (!isAdmin) {
            return res.status(403).json({ error: "Access denied. Only admins can update user roles." });
        }
        // Safety check for valid role values (normalized by validator usually)
        const normalizedRole = role.toUpperCase();
        if (!['ADMIN', 'RANGER'].includes(normalizedRole)) {
            return res.status(400).json({ error: "Invalid role. Must be 'ADMIN' or 'RANGER'." });
        }
        updateData.role = normalizedRole;
    }

    if (req.file) {
        // Fetch existing user to get old photo ID
        const existingUser = await userRepo.findById(id);
        if (existingUser && existingUser.profilePhotoPublicId) {
            try {
                await cloudinary.uploader.destroy(existingUser.profilePhotoPublicId);
            } catch (err) {
                console.error("Failed to delete old profile photo from Cloudinary:", err);
            }
        }
        updateData.profilePhoto = req.file.path;
        updateData.profilePhotoPublicId = req.file.filename;
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
