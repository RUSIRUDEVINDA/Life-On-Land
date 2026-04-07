import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import { validateCreatePatrol } from "../validators/patrol.validator.js";

const makeRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

describe("Patrol Validator", () => {
    it("should accept a valid create payload and normalize status/title (Positive)", () => {
        const req = {
            body: {
                protectedAreaId: new mongoose.Types.ObjectId().toString(),
                exactLocation: { lat: 7.25, lng: 80.65 },
                zoneIds: [new mongoose.Types.ObjectId().toString()],
                plannedStart: "2026-01-01T10:00:00.000Z",
                plannedEnd: "2026-01-01T12:00:00.000Z",
                assignedRangerIds: [new mongoose.Types.ObjectId().toString()],
                status: "in_progress",
                notes: "  Carry water  ",
                title: "  Morning Patrol  "
            }
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreatePatrol(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(res.status.called).to.equal(false);
        expect(req.body.status).to.equal("IN_PROGRESS");
        expect(req.body.title).to.equal("Morning Patrol");
        expect(req.body.notes).to.equal("Carry water");
        expect(req.body.plannedStart).to.be.instanceOf(Date);
        expect(req.body.plannedEnd).to.be.instanceOf(Date);
    });

    it("should reject missing required fields (Negative)", () => {
        const req = {
            body: {
                protectedAreaId: new mongoose.Types.ObjectId().toString(),
                exactLocation: { lat: 7.2, lng: 80.6 },
                plannedEnd: "2026-01-01T12:00:00.000Z",
                assignedRangerIds: []
            }
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreatePatrol(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("plannedStart must be a valid date");
        expect(details).to.include("assignedRangerIds must be a non-empty array");
    });
});