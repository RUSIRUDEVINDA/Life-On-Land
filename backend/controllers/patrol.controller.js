import Patrol from "../models/Patrol.js";

// @desc    Create a new patrol
// @route   POST /api/patrols
// @access  Private (Admin/Officer)
export const createPatrol = async (req, res) => {
    try {
        const patrol = new Patrol(req.body);
        const savedPatrol = await patrol.save();
        res.status(201).json(savedPatrol);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all patrols
// @route   GET /api/patrols
// @access  Private (Admin/Ranger)
export const getPatrols = async (req, res) => {
    try {
        const { protectedAreaId, from, to, rangerId } = req.query;
        let query = {};

        if (protectedAreaId) query.protectedAreaId = protectedAreaId;
        if (rangerId) query.assignedRangerIds = rangerId;
        if (from || to) {
            query.plannedStart = {};
            if (from) query.plannedStart.$gte = new Date(from);
            if (to) query.plannedStart.$lte = new Date(to);
        }

        const patrols = await Patrol.find(query)
            .populate("assignedRangerIds", "name email")
            .sort({ plannedStart: -1 });
        res.status(200).json(patrols);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single patrol details
// @route   GET /api/patrols/:id
// @access  Private (Admin/Ranger)
export const getPatrolById = async (req, res) => {
    try {
        const patrol = await Patrol.findById(req.params.id)
            .populate("assignedRangerIds", "name email");
        if (!patrol) return res.status(404).json({ message: "Patrol not found" });
        res.status(200).json(patrol);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update patrol
// @route   PUT /api/patrols/:id
// @access  Private (Admin/Officer)
export const updatePatrol = async (req, res) => {
    try {
        const updatedPatrol = await Patrol.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedPatrol) return res.status(404).json({ message: "Patrol not found" });
        res.status(200).json(updatedPatrol);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete patrol (Soft delete recommended, but this performs hard delete)
// @route   DELETE /api/patrols/:id
// @access  Private (Admin/Officer)
export const deletePatrol = async (req, res) => {
    try {
        const deletedPatrol = await Patrol.findByIdAndDelete(req.params.id);
        if (!deletedPatrol) return res.status(404).json({ message: "Patrol not found" });
        res.status(200).json({ message: "Patrol deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add check-in to patrol
// @route   POST /api/patrols/:id/check-ins
// @access  Private (Ranger)
export const addCheckIn = async (req, res) => {
    try {
        const patrol = await Patrol.findById(req.params.id);
        if (!patrol) return res.status(404).json({ message: "Patrol not found" });

        patrol.checkIns.push(req.body);
        if (patrol.status === "PLANNED") {
            patrol.status = "IN_PROGRESS";
        }

        const savedPatrol = await patrol.save();
        res.status(201).json(savedPatrol);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get check-ins for a patrol
// @route   GET /api/patrols/:id/check-ins
// @access  Private (Admin/Ranger)
export const getCheckIns = async (req, res) => {
    try {
        const patrol = await Patrol.findById(req.params.id).select("checkIns");
        if (!patrol) return res.status(404).json({ message: "Patrol not found" });
        res.status(200).json(patrol.checkIns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};