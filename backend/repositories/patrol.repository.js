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

export const getCheckIns = async (id) => {
    const patrol = await Patrol.findById(id).select("checkIns");
    return patrol ? patrol.checkIns : null;
};
