import mongoose from "mongoose";

const animalSchema = new mongoose.Schema(
    {
        tagId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },
        protectedAreaId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        zoneId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        species: {
            type: String,
            required: true,
            index: true,
            trim: true
        },
        sex: {
            type: String,
            enum: ["MALE", "FEMALE", "UNKNOWN"],
            required: true,
            default: "UNKNOWN"
        },
        ageClass: {
            type: String,
            enum: ["INFANT", "JUVENILE", "SUBADULT", "ADULT", "UNKNOWN"],
            required: true,
            default: "UNKNOWN"
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "RETIRED", "DECEASED"],
            required: true,
            default: "ACTIVE",
            index: true
        },
    },
    { timestamps: true }
);

const Animal = mongoose.model("Animal", animalSchema);

export default Animal;
