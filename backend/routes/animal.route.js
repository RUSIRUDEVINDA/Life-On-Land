import express from "express";
import { createAnimal, getAnimals, getAnimalById, updateAnimal, deleteAnimal } from "../controllers/animal.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateCreateAnimal, validatePutAnimal, validatePatchAnimal, validateAnimalQuery, validateTagIdParam } from "../validators/animal.validator.js";
import { upload } from "../utils/cloudinary.js";


const router = express.Router(); 

// Register a new animal (Admin only)
router.post("/", protect, authorizeRoles("ADMIN"), upload.single('photo'), validateCreateAnimal, createAnimal);


// Retrieve all animals with filtering (Admin, Ranger)
router.get("/", protect, authorizeRoles("ADMIN", "RANGER"), validateAnimalQuery, getAnimals);

// Retrieve single animal details (Admin, Ranger)
router.get("/:tagId", protect, authorizeRoles("ADMIN", "RANGER"), validateTagIdParam, getAnimalById);

// Update animal record (Admin only)
router.put("/:tagId", protect, authorizeRoles("ADMIN"), upload.single('photo'), validateTagIdParam, validatePutAnimal, updateAnimal);

// Partial update animal record (Admin only)
router.patch("/:tagId", protect, authorizeRoles("ADMIN"), upload.single('photo'), validateTagIdParam, validatePatchAnimal, updateAnimal);


// Remove animal record (Admin only)
router.delete("/:tagId", protect, authorizeRoles("ADMIN"), validateTagIdParam, deleteAnimal);

export default router;
