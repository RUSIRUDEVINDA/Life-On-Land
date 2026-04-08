import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import {
    validateCreateAnimal,
    validatePatchAnimal
} from "../../validators/animal.validator.js";

const makeRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

describe("Animal Validator", () => {
    it("should accept a valid create payload and normalize fields (Positive)", () => {
        const req = {
            body: {
                tagId: "t-001",
                species: "  Sri Lankan Elephant ",
                sex: "male",
                ageClass: "adult",
                protectedAreaId: new mongoose.Types.ObjectId().toString(),
                zoneId: new mongoose.Types.ObjectId().toString(),
                status: "active",
                description: "  Large adult  ",
                endemicToSriLanka: "true"
            }
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreateAnimal(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(res.status.called).to.equal(false);
        expect(req.body.tagId).to.equal("T-001");
        expect(req.body.species).to.equal("Sri Lankan Elephant");
        expect(req.body.sex).to.equal("MALE");
        expect(req.body.ageClass).to.equal("ADULT");
        expect(req.body.status).to.equal("ACTIVE");
        expect(req.body.description).to.equal("Large adult");
        expect(req.body.endemicToSriLanka).to.equal(true);
    });

    it("should reject invalid tagId and objectIds (Negative)", () => {
        const req = {
            body: {
                tagId: "X1",
                species: "Elephant",
                sex: "MALE",
                ageClass: "ADULT",
                protectedAreaId: "bad-id",
                zoneId: "bad-id",
                status: "ACTIVE"
            }
        };
        const res = makeRes();
        const next = sinon.stub();

        validateCreateAnimal(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("tagId must start with 'T' followed by 2-19 letters, numbers, or hyphens (3-20 total length)");
        expect(details).to.include("protectedAreaId must be a valid ObjectId");
        expect(details).to.include("zoneId must be a valid ObjectId");
    });

    it("should reject empty patch body (Negative)", () => {
        const req = { body: {} };
        const res = makeRes();
        const next = sinon.stub();

        validatePatchAnimal(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        expect(res.json.firstCall.args[0]?.error).to.equal("No fields provided to update");
    });
});

