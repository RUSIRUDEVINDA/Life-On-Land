import Alert from "../models/Alert.js";

export const create = (data) => Alert.create(data);

export const findById = (id) => Alert.findById(id);

export const findWithPagination = (query, sort, skip, limit) =>
    Alert.find(query)
        .populate("zoneId", "name")
        .populate("protectedAreaId", "name")
        .sort(sort)
        .skip(skip)
        .limit(limit);

export const count = (query) => Alert.countDocuments(query);

export const updateById = (id, update) =>
    Alert.findByIdAndUpdate(id, update, { new: true, runValidators: true });

export const deleteById = (id) => Alert.findByIdAndDelete(id);
