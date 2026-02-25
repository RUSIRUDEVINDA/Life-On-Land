import express from "express";
import { getUsers, getUserById, updateUser, deleteUser } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateUpdateUser, validateUserQuery } from "../validators/user.validator.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/", authorizeRoles("ADMIN", "RANGER"), getUsers);
router.get("/:id", authorizeRoles("ADMIN", "RANGER"), getUserById);
router.put("/:id", authorizeRoles("ADMIN", "RANGER"), updateUser);
router.get("/", authorizeRoles("ADMIN", "RANGER"), validateUserQuery, getUsers);
router.get("/:id", getUserById);
router.put("/:id", authorizeRoles("ADMIN", "RANGER"), validateUpdateUser(true), updateUser);    // Full replace
router.patch("/:id", authorizeRoles("ADMIN", "RANGER"), validateUpdateUser(false), updateUser);  // Partial update
router.delete("/:id", authorizeRoles("ADMIN"), deleteUser);

export default router;


