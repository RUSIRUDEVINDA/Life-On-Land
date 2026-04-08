import { expect } from "chai";
import sinon from "sinon";
import { validateUpdateAlert } from "../../validators/alert.validator.js";

const makeRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

describe("Alert Validator", () => {
    it("should accept valid status and normalize to uppercase (Positive)", () => {
        const req = { body: { status: "new" } };
        const res = makeRes();
        const next = sinon.stub();

        validateUpdateAlert(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(res.status.called).to.equal(false);
        expect(req.body.status).to.equal("NEW");
    });

    it("should reject missing status or extra fields (Negative)", () => {
        const req = { body: { foo: "bar" } };
        const res = makeRes();
        const next = sinon.stub();

        validateUpdateAlert(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details.some(d => d.includes("Only the 'status' field"))).to.equal(true);
        expect(details.some(d => d.includes("status"))).to.equal(true);
    });
});