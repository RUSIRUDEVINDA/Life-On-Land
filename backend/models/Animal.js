import mongoose from "mongoose";

/**
 * @desc    Animal Schema defining tracked wildlife
 */
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
        protectedAreaName: {
            type: String,
            default: null
        },
        zoneId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        zoneName: {
            type: String,
            default: null
        },
        species: {
            type: String,
            required: true,
            index: true,
            trim: true
        },
        description: {
            type: String,
            default: null,
            trim: true
        },
        endemicToSriLanka: {
            type: Boolean,
            default: false
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
            enum: ["ACTIVE", "INACTIVE", "DECEASED"],
            required: true,
            default: "ACTIVE",
            index: true
        },
        photo: {
            type: String,
            default: null
        },
        photoPublicId: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

const Animal = mongoose.model("Animal", animalSchema);

export default Animal;
