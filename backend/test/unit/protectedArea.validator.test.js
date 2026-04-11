import { expect } from "chai";
import {
    validateCreateProtectedArea,
    validateUpdateProtectedArea,
} from "../../validators/protectedArea.validator.js";

describe("Protected Area Validator", () => {
    it("should accept a valid create payload (Positive)", () => {
        const body = {
            name: "Udawalawe National Park",
            type: "NATIONAL_PARK",
            district: "Ratnapura",
            areaSize: 308.21,
            geometry: {
                type: "Polygon",
                coordinates: [[[80, 6], [81, 6], [81, 7], [80, 7], [80, 6]]],
            },
        };

        const error = validateCreateProtectedArea(body);

        expect(error).to.equal(null);
    });

    it("should reject missing create fields (Negative)", () => {
        const error = validateCreateProtectedArea({ name: "Incomplete Area" });

        expect(error).to.equal(
            "name, type, district, areaSize, and geometry are required fields"
        );
    });

    it("should reject invalid geometry type on update (Negative)", () => {
        const error = validateUpdateProtectedArea({
            geometry: {
                type: "Point",
                coordinates: [80, 6],
            },
        });

        expect(error).to.equal("geometry.type must be 'Polygon'");
    });
});