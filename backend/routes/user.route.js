import express from "express";
import { getUsers, getUserById, updateUser, deleteUser } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateUpdateUser, validateUserQuery } from "../validators/user.validator.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// List all users (Admin, Ranger)
router.get("/", authorizeRoles("ADMIN", "RANGER"), validateUserQuery, getUsers);

// Get profile by ID (Admin, Ranger, or Self)
router.get("/:id", getUserById);

// Update user details (Full replace)
router.put("/:id", validateUpdateUser(true), updateUser);

// Update user details (Partial update)
router.patch("/:id", validateUpdateUser(false), updateUser);

// Delete user account (Admin only)
router.delete("/:id", authorizeRoles("ADMIN"), deleteUser);

export default router;


