import express from "express";
import {createAnimal,getAnimals,getAnimalById,updateAnimal,deleteAnimal} from "../controllers/animal.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {validateCreateAnimal,validateUpdateAnimal,validateAnimalQuery} from "../validators/animal.validator.js";

const router = express.Router();

router.post("/",protect, authorizeRoles("ADMIN"),validateCreateAnimal,createAnimal);

router.get("/",protect,authorizeRoles("ADMIN", "RANGER"),validateAnimalQuery,getAnimals);

router.get("/:id",protect,authorizeRoles("ADMIN", "RANGER"),getAnimalById);

router.put("/:id",protect,authorizeRoles("ADMIN"),validateUpdateAnimal,updateAnimal);

router.delete("/:id",protect,authorizeRoles("ADMIN"),deleteAnimal);

export default router;
