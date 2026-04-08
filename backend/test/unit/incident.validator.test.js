import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import Incident from "../../models/Incident.model.js";
import {
    validateCreateIncident,
    validateGetIncidentsQuery,
    validateUpdateIncident,
} from "../../validators/incident.validator.js";

const makeRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

describe("Incident Validator — validateCreateIncident", () => {
    const zoneId = new mongoose.Types.ObjectId().toString();
    const protectedAreaId = new mongoose.Types.ObjectId().toString();

    it("should accept a valid payload and normalize fields (Positive)", () => {
        const req = {
            body: {
                type: "other",
                description: "  Valid incident description for unit testing.  ",
                zoneId,
                protectedAreaId,
                severity: "low",
                incidentDate: "2024-06-15T12:00:00.000Z",
                location: {
                    type: "Point",
                    coordinates: [80.5, 6.8],
                },
                evidence: ["https://example.com/photo.jpg"],
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreateIncident(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(res.status.called).to.equal(false);
        expect(req.body.type).to.equal("OTHER");
        expect(req.body.description).to.equal("Valid incident description for unit testing.");
        expect(req.body.severity).to.equal("LOW");
        expect(req.body.zoneId).to.equal(zoneId);
        expect(req.body.protectedAreaId).to.equal(protectedAreaId);
        expect(req.body.incidentDate).to.be.instanceOf(Date);
        expect(req.body.location).to.deep.equal({
            type: "Point",
            coordinates: [80.5, 6.8],
        });
        expect(req.body.evidence).to.deep.equal(["https://example.com/photo.jpg"]);
    });

    it("should default severity to MEDIUM when omitted (Positive)", () => {
        const req = {
            body: {
                type: "POACHING",
                description: "Another valid incident description long enough.",
                zoneId,
                protectedAreaId,
                incidentDate: "2023-01-10",
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreateIncident(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(req.body.severity).to.equal("MEDIUM");
    });

    it("should reject description shorter than 10 characters (Negative)", () => {
        const req = {
            body: {
                type: "OTHER",
                description: "Short",
                zoneId,
                protectedAreaId,
                incidentDate: "2024-01-01",
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreateIncident(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("Description must be at least 10 characters");
    });

    it("should reject invalid incident type (Negative)", () => {
        const req = {
            body: {
                type: "INVALID_TYPE",
                description: "Valid length description text here.",
                zoneId,
                protectedAreaId,
                incidentDate: "2024-01-01",
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreateIncident(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details.some((d) => d.includes("Type must be one of"))).to.equal(true);
    });

    it("should reject invalid zoneId (Negative)", () => {
        const req = {
            body: {
                type: "OTHER",
                description: "Valid length description text here.",
                zoneId: "not-valid",
                protectedAreaId,
                incidentDate: "2024-01-01",
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreateIncident(req, res, next);

        expect(next.called).to.equal(false);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("Zone ID must be a valid MongoDB ObjectId");
    });

    it("should reject invalid evidence URL (Negative)", () => {
        const req = {
            body: {
                type: "OTHER",
                description: "Valid length description text here.",
                zoneId,
                protectedAreaId,
                incidentDate: "2024-01-01",
                evidence: ["not-a-url"],
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreateIncident(req, res, next);

        expect(next.called).to.equal(false);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details.some((d) => d.includes("Evidence item at index 0"))).to.equal(true);
    });
});

describe("Incident Validator — validateGetIncidentsQuery", () => {
    it("should apply default pagination and sort (Positive)", () => {
        const req = { query: {} };
        const res = makeRes();
        const next = sinon.stub();

        validateGetIncidentsQuery(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(req.query.page).to.equal(1);
        expect(req.query.limit).to.equal(10);
        expect(req.query.sortBy).to.equal("incidentDate");
        expect(req.query.sortOrder).to.equal("desc");
    });

    it("should accept valid protectedAreaId and normalize sortOrder to lowercase (Positive)", () => {
        const id = new mongoose.Types.ObjectId().toString();
        const req = { query: { protectedAreaId: id, sortOrder: "ASC" } };
        const res = makeRes();
        const next = sinon.stub();

        validateGetIncidentsQuery(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(req.query.protectedAreaId).to.equal(id);
        expect(req.query.sortOrder).to.equal("asc");
    });

    it("should reject invalid sortBy (Negative)", () => {
        const req = { query: { sortBy: "invalidField" } };
        const res = makeRes();
        const next = sinon.stub();

        validateGetIncidentsQuery(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details.some((d) => d.includes("SortBy must be one of"))).to.equal(true);
    });

    it("should reject when from is after to (Negative)", () => {
        const req = {
            query: {
                from: "2024-12-31",
                to: "2024-01-01",
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        validateGetIncidentsQuery(req, res, next);

        expect(next.called).to.equal(false);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("From date must be before or equal to To date");
    });
});

describe("Incident Validator — validateUpdateIncident", () => {
    let findByIdStub;

    afterEach(() => {
        if (findByIdStub) {
            findByIdStub.restore();
            findByIdStub = null;
        }
    });

    it("should reject empty body (Negative)", async () => {
        const req = { params: { id: new mongoose.Types.ObjectId().toString() }, body: {} };
        const res = makeRes();
        const next = sinon.stub();

        await validateUpdateIncident(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("At least one field must be provided for update");
    });

    it("should accept valid partial update and normalize fields (Positive)", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: {
                description: "Updated incident narrative with enough length.",
                severity: "high",
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        await validateUpdateIncident(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(res.status.called).to.equal(false);
        expect(req.body).to.deep.equal({
            description: "Updated incident narrative with enough length.",
            severity: "HIGH",
        });
    });

    it("should reject changing protectedAreaId (Negative)", async () => {
        const incidentId = new mongoose.Types.ObjectId().toString();
        const existingPa = new mongoose.Types.ObjectId();
        const otherPa = new mongoose.Types.ObjectId().toString();

        findByIdStub = sinon.stub(Incident, "findById").resolves({
            protectedAreaId: existingPa,
        });

        const req = {
            params: { id: incidentId },
            body: {
                protectedAreaId: otherPa,
                description: "Companion description for protected area rule testing.",
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        await validateUpdateIncident(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("Protected area id cannot be updated");
    });
});
