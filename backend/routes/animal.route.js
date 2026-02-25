import express from "express";
import { createAnimal, getAnimals, getAnimalById, updateAnimal, deleteAnimal } from "../controllers/animal.controller.js";
import { getAnimalMovements } from "../controllers/movement.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateCreateAnimal, validatePutAnimal, validatePatchAnimal, validateAnimalQuery, validateTagIdParam } from "../validators/animal.validator.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("ADMIN"), validateCreateAnimal, createAnimal);

router.get("/", protect, authorizeRoles("ADMIN", "RANGER"), validateAnimalQuery, getAnimals);

router.get("/:tagId", protect, authorizeRoles("ADMIN", "RANGER"), validateTagIdParam, getAnimalById);

router.get("/:tagId/movements", protect, authorizeRoles("ADMIN", "RANGER"), validateTagIdParam, getAnimalMovements);

router.put("/:tagId", protect, authorizeRoles("ADMIN"), validateTagIdParam, validatePutAnimal, updateAnimal);

router.patch("/:tagId", protect, authorizeRoles("ADMIN"), validateTagIdParam, validatePatchAnimal, updateAnimal);

router.delete("/:tagId", protect, authorizeRoles("ADMIN"), validateTagIdParam, deleteAnimal);

export default router;
