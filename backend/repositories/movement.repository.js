import Movement from "../models/Movement.js";

export const create = (data) => Movement.create(data);

export const findWithPagination = (query, sort, skip, limit) =>
    Movement.find(query).sort(sort).skip(skip).limit(limit);

export const count = (query) =>
    Movement.countDocuments(query);

export const findLatestByAnimalId = (tagId) =>
    Movement.findOne({ tagId }).sort({ timestamp: -1 });

export const findByAnimalIdWithPagination = (tagId, query, sort, skip, limit) =>
    Movement.find({ tagId, ...query }).sort(sort).skip(skip).limit(limit);

export const aggregateSummary = (match) =>
    Movement.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$zoneId",
                count: { $sum: 1 },
                latestTimestamp: { $max: "$timestamp" },
                animals: { $addToSet: "$tagId" }
            }
        },
        {
            $lookup: {
                from: "zones",
                localField: "_id",
                foreignField: "_id",
                as: "zoneDetails"
            }
        },
        { $unwind: { path: "$zoneDetails", preserveNullAndEmptyArrays: true } }
    ]);
