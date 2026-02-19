import * as repo from "../repositories/patrol.repository.js";

export const createPatrol = async (data) => {
    return repo.create(data);
};

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

export const deletePatrol = async (id) => {
    const patrol = await repo.deleteById(id);

    if (!patrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }

    return patrol;
};

export const addCheckIn = async (id, checkInData) => {
    const updatedPatrol = await repo.addCheckIn(id, checkInData);
    if (!updatedPatrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }
    return updatedPatrol;
};

export const updateCheckIn = async (patrolId, checkInId, checkInData) => {
    const updatedPatrol = await repo.updateCheckIn(patrolId, checkInId, checkInData);
    if (!updatedPatrol) {
        const error = new Error("Patrol or Check-in not found");
        error.statusCode = 404;
        throw error;
    }
    return updatedPatrol;
};

export const deleteCheckIn = async (patrolId, checkInId) => {
    const updatedPatrol = await repo.deleteCheckIn(patrolId, checkInId);
    if (!updatedPatrol) {
        const error = new Error("Patrol not found");
        error.statusCode = 404;
        throw error;
    }
    return updatedPatrol;
};
