import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";

import * as movementService from "../services/movement.service.js";
import movementRepo from "../repositories/movement.repository.js";
import zoneRepo from "../repositories/zone.repository.js";
import animalRepo from "../repositories/animal.repository.js";

describe("Movement Service", () => {
    afterEach(() => {
        sinon.restore();
    });

    it("should ingest movement when zone exists (Positive)", async () => {
        const zone = {
            _id: new mongoose.Types.ObjectId(),
            protectedAreaId: new mongoose.Types.ObjectId(),
            zoneType: "BUFFER",
            name: "Normal Zone"
        };
        const movement = {
            _id: new mongoose.Types.ObjectId(),
            tagId: "T-001",
            lat: 7.2,
            lng: 80.6,
            zoneId: zone._id,
            protectedAreaId: zone.protectedAreaId
        };

        const findZoneStub = sinon.stub(zoneRepo, "findZoneByCoordinates").resolves(zone);
        const createStub = sinon.stub(movementRepo, "create").resolves(movement);

        const result = await movementService.ingestMovement({ tagId: "T-001", lat: 7.2, lng: 80.6 });

        expect(findZoneStub.calledWith(80.6, 7.2)).to.equal(true);
        expect(createStub.calledOnce).to.equal(true);
        expect(result).to.equal(movement);
    });

    it("should reject ingest when tagId is missing (Negative)", async () => {
        try {
            await movementService.ingestMovement({ lat: 7.2, lng: 80.6 });
            throw new Error("Expected error not thrown");
        } catch (err) {
            expect(err.message).to.equal("Missing tagId in movement data");
        }
    });

    it("should reject ingest when no zone contains the coordinates (Negative)", async () => {
        sinon.stub(zoneRepo, "findZoneByCoordinates").resolves(null);
        const createStub = sinon.stub(movementRepo, "create");

        try {
            await movementService.ingestMovement({ tagId: "T-001", lat: 7.2, lng: 80.6 });
            throw new Error("Expected error not thrown");
        } catch (err) {
            expect(err.message).to.include("Movement rejected: coordinates");
        }

        expect(createStub.called).to.equal(false);
    });

    it("should throw 404 when animal does not exist for history (Negative)", async () => {
        sinon.stub(animalRepo, "findByTagId").resolves(null);

        try {
            await movementService.getMovementHistory("T-404", {});
            throw new Error("Expected error not thrown");
        } catch (err) {
            expect(err.statusCode).to.equal(404);
            expect(err.message).to.include("not found");
        }
    });
});
