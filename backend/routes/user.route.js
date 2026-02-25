import express from "express";
import {getUsers,getUserById,updateUser,deleteUser} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/", authorizeRoles("ADMIN", "RANGER"), getUsers);
router.get("/:id", getUserById);
router.put("/:id", authorizeRoles("ADMIN", "RANGER"), updateUser);
router.delete("/:id", authorizeRoles("ADMIN"), deleteUser);

export default router;
