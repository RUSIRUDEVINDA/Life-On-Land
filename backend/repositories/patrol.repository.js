import Patrol from "../models/Patrol.js";

const create = (data) => Patrol.create(data);
export { create };

export const findById = (id) =>
    Patrol.findById(id);

export const findWithPagination = (query, sort, skip, limit) =>
    Patrol.find(query)
        .populate("assignedRangerIds", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit);

export const count = (query) =>
    Patrol.countDocuments(query);

export const updateById = (id, update) =>
    Patrol.findByIdAndUpdate(
        id,
        update,
        { new: true, runValidators: true }
    );

export const deleteById = (id) =>
    Patrol.findByIdAndDelete(id);

export const addCheckIn = async (id, checkInData) => {
    const patrol = await Patrol.findById(id);
    if (!patrol) return null;

    patrol.checkIns.push(checkInData);
    if (patrol.status === "PLANNED") {
        patrol.status = "IN_PROGRESS";
    }

    return patrol.save();
};

export const getCheckIns = async (id, skip, limit) => {
    const patrol = await Patrol.findById(id).select({
        checkIns: { $slice: [skip, limit] }
    });

    if (!patrol) return null;

    const fullPatrol = await Patrol.findById(id).select("checkIns");
    const total = fullPatrol ? fullPatrol.checkIns.length : 0;

    return { checkIns: patrol.checkIns, total };
};

export const updateCheckIn = async (patrolId, checkInId, checkInData) => {
    const update = {};
    if (checkInData.location) update["checkIns.$.location"] = checkInData.location;
    if (checkInData.note !== undefined) update["checkIns.$.note"] = checkInData.note;
    if (checkInData.zoneId !== undefined) update["checkIns.$.zoneId"] = checkInData.zoneId;
    update["checkIns.$.timestamp"] = checkInData.timestamp || new Date();

    return Patrol.findOneAndUpdate(
        { _id: patrolId, "checkIns._id": checkInId },
        { $set: update },
        { new: true, runValidators: true }
    );
};

export const deleteCheckIn = async (patrolId, checkInId) => {
    return Patrol.findByIdAndUpdate(
        patrolId,
        { $pull: { checkIns: { _id: checkInId } } },
        { new: true }
    );
};

// Default export — sinon can stub properties on this object
const patrolRepo = {
    create,
    findById,
    findWithPagination,
    count,
    updateById,
    deleteById,
    addCheckIn,
    getCheckIns,
    updateCheckIn,
    deleteCheckIn,
};

export default patrolRepo;