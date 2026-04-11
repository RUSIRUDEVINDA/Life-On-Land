import { expect } from "chai";
import {
    validateCreateZone,
    validateUpdateZone,
} from "../../validators/zone.validator.js";

describe("Zone Validator", () => {
    it("should accept a valid create payload (Positive)", () => {
        const body = {
            name: "Core Zone A",
            zoneType: "CORE",
            areaSize: 120.5,
            geometry: {
                type: "Polygon",
                coordinates: [[[80.1, 6.1], [80.9, 6.1], [80.9, 6.9], [80.1, 6.9], [80.1, 6.1]]],
            },
        };

        const error = validateCreateZone(body);

        expect(error).to.equal(null);
    });

    it("should reject missing create fields (Negative)", () => {
        const error = validateCreateZone({ name: "Incomplete Zone" });

        expect(error).to.equal(
            "name, zoneType, areaSize, and geometry are required fields"
        );
    });

    it("should reject invalid zoneType on update (Negative)", () => {
        const error = validateUpdateZone({ zoneType: "HABITAT" });

        expect(error).to.equal("zoneType must be one of CORE, BUFFER, EDGE, CORRIDOR");
    });
});