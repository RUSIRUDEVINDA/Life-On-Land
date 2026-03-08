import mongoose from "mongoose";

import {
  listProtectedAreas,
  createProtectedArea,
  getProtectedAreaById,
  updateProtectedArea,
  softDeleteProtectedArea,
} from "../repositories/protectedArea.repository.js";

import {
  validateCreateProtectedArea,
  validateUpdateProtectedArea,
} from "../validators/protectedArea.validator.js";


/* ===============================
   LIST
================================ */
const list = async (req, res, next) => {
  try {
    const items = await listProtectedAreas();
    return res.status(200).json({ data: items });
  } catch (error) {
    return next(error);
  }
};


/* ===============================
   CREATE
================================ */
const create = async (req, res, next) => {
  try {
    const error = validateCreateProtectedArea(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const created = await createProtectedArea(req.body);

    return res.status(201).json({ data: created });
  } catch (error) {
    return next(error);
  }
};


/* ===============================
   GET BY ID
================================ */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔥 Validate MongoDB ObjectId format first
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid protected area ID" });
    }

    const item = await getProtectedAreaById(id);

    if (!item) {
      return res.status(404).json({ message: "Protected area not found" });
    }

    return res.status(200).json({ data: item });
  } catch (error) {
    return next(error);
  }
};


/* ===============================
   UPDATE
================================ */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid protected area ID" });
    }

    const error = validateUpdateProtectedArea(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const updated = await updateProtectedArea(id, req.body);

    if (!updated) {
      return res.status(404).json({ message: "Protected area not found" });
    }

    return res.status(200).json({ data: updated });
  } catch (error) {
    return next(error);
  }
};


/* ===============================
   DELETE (Soft Delete)
================================ */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid protected area ID" });
    }

    const removed = await softDeleteProtectedArea(id);

    if (!removed) {
      return res.status(404).json({ message: "Protected area not found" });
    }

    return res.status(200).json({ message: "Protected area deleted" });
  } catch (error) {
    return next(error);
  }
};


export { list, create, getById, update, remove };
