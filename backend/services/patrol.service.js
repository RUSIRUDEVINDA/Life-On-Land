import * as repo from "../repositories/patrol.repository.js";

// Create a new patrol record in the database
export const createPatrol = async (data) => {
    return repo.create(data);
};

// Update an existing patrol's details or status
export const updatePatrol = async (id, data) => {
    const currentPatrol = await repo.findById(id);
    if (!currentPatrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }

    const updatedPatrol = await repo.updateById(id, { $set: data });
    if (!updatedPatrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }

    return updatedPatrol;
};

// Soft delete or permanently remove a patrol
export const deletePatrol = async (id) => {
    const patrol = await repo.deleteById(id);

    if (!patrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }

    return patrol;
};

// Append a new check-in log to a patrol
export const addCheckIn = async (id, checkInData) => {
    const updatedPatrol = await repo.addCheckIn(id, checkInData);
    if (!updatedPatrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }
    return updatedPatrol;
};

// Update a specific check-in record within a patrol
export const updateCheckIn = async (patrolId, checkInId, checkInData) => {
    const updatedPatrol = await repo.updateCheckIn(patrolId, checkInId, checkInData);
    if (!updatedPatrol) {
        const error = new Error("Patrol or Check-in not found");
        error.statusCode = 404;
        throw error;
    }
    return updatedPatrol;
};

// Remove a specific check-in log from a patrol
export const deleteCheckIn = async (patrolId, checkInId) => {
    const updatedPatrol = await repo.deleteCheckIn(patrolId, checkInId);
    if (!updatedPatrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }
    return updatedPatrol;
};
