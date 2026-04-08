import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import { validateRiskMapQuery } from "../../validators/incident.validator.js";

const makeRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

describe("Risk map Validator — validateRiskMapQuery", () => {
    it("should accept valid protectedAreaId only (Positive)", () => {
        const id = new mongoose.Types.ObjectId().toString();
        const req = { query: { protectedAreaId: id } };
        const res = makeRes();
        const next = sinon.stub();

        validateRiskMapQuery(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(res.status.called).to.equal(false);
        expect(req.query.protectedAreaId).to.equal(id);
    });

    it("should accept optional from and to as valid dates (Positive)", () => {
        const id = new mongoose.Types.ObjectId().toString();
        const req = { query: { protectedAreaId: id, from: "2024-01-01", to: "2024-06-30" } };
        const res = makeRes();
        const next = sinon.stub();

        validateRiskMapQuery(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(req.query.protectedAreaId).to.equal(id);
        expect(req.query.from).to.be.instanceOf(Date);
        expect(req.query.to).to.be.instanceOf(Date);
    });

    it("should reject missing protectedAreaId (Negative)", () => {
        const req = { query: {} };
        const res = makeRes();
        const next = sinon.stub();

        validateRiskMapQuery(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("Protected Area ID is required");
    });

    it("should reject invalid protectedAreaId (Negative)", () => {
        const req = { query: { protectedAreaId: "not-a-valid-object-id" } };
        const res = makeRes();
        const next = sinon.stub();

        validateRiskMapQuery(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("Protected Area ID must be a valid MongoDB ObjectId");
    });

    it("should reject invalid from date (Negative)", () => {
        const id = new mongoose.Types.ObjectId().toString();
        const req = { query: { protectedAreaId: id, from: "not-a-date" } };
        const res = makeRes();
        const next = sinon.stub();

        validateRiskMapQuery(req, res, next);

        expect(next.called).to.equal(false);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("From date must be a valid date");
    });

    it("should reject when from is after to (Negative)", () => {
        const id = new mongoose.Types.ObjectId().toString();
        const req = {
            query: {
                protectedAreaId: id,
                from: "2024-12-31",
                to: "2024-01-01",
            },
        };
        const res = makeRes();
        const next = sinon.stub();

        validateRiskMapQuery(req, res, next);

        expect(next.called).to.equal(false);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("From date must be before or equal to To date");
    });
});
