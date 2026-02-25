import Patrol from "../models/Patrol.js";

export const create = (data) => Patrol.create(data);

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

    // We also need the total count for pagination metadata
    const fullPatrol = await Patrol.findById(id).select("checkIns");
    const total = fullPatrol ? fullPatrol.checkIns.length : 0;

    return { checkIns: patrol.checkIns, total };
};

export const updateCheckIn = async (patrolId, checkInId, checkInData) => {
    return Patrol.findOneAndUpdate(
        { _id: patrolId, "checkIns._id": checkInId },
        {
            $set: {
                "checkIns.$.location": checkInData.location,
                "checkIns.$.note": checkInData.note,
                "checkIns.$.timestamp": checkInData.timestamp || new Date()
            }
        },
        { new: true, runValidators: true }
    );
};

export const deleteCheckIn = async (patrolId, checkInId) => {
    return Patrol.findByIdAndUpdate(
        patrolId,
        {
            $pull: { checkIns: { _id: checkInId } }
        },
        { new: true }
    );
};
