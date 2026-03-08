import Movement from "../models/Movement.js";

// Create a new movement record
export const create = (data) => Movement.create(data);

// Find movements with pagination and sorting
export const findWithPagination = (query, sort, skip, limit) =>
    Movement.find(query).sort(sort).skip(skip).limit(limit);

// Count movements matching a query
export const count = (query) =>
    Movement.countDocuments(query);

// Find the most recent movement for a specific animal
export const findLatestByAnimalId = (tagId) =>
    Movement.findOne({ tagId }).sort({ timestamp: -1 });

// Find paginated movement history for an animal
export const findByAnimalIdWithPagination = (tagId, query, sort, skip, limit) =>
    Movement.find({ tagId, ...query }).sort(sort).skip(skip).limit(limit);

// Aggregate movement data to summarize activity per zone
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

// Default export — sinon can stub properties on this object
const movementRepo = {
    create,
    findWithPagination,
    count,
    findLatestByAnimalId,
    findByAnimalIdWithPagination,
    aggregateSummary,
};

export default movementRepo;