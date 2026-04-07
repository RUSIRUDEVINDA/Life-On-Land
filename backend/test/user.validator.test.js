import { expect } from "chai";
import sinon from "sinon";
import { validateUpdateUser, validateUserQuery } from "../validators/user.validator.js";

const makeRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

describe("User Validator", () => {
    it("should accept a valid PATCH payload and normalize phone/role (Positive)", () => {
        const req = {
            user: { role: "ADMIN" },
            body: { phone: "0711234567", role: "ranger" }
        };
        const res = makeRes();
        const next = sinon.stub();

        const middleware = validateUpdateUser(false);
        middleware(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(res.status.called).to.equal(false);
        expect(req.body.phone).to.equal("+94711234567");
        expect(req.body.role).to.equal("RANGER");
    });

    it("should reject invalid email in PATCH (Negative)", () => {
        const req = { user: { role: "ADMIN" }, body: { email: "bad-email" } };
        const res = makeRes();
        const next = sinon.stub();

        const middleware = validateUpdateUser(false);
        middleware(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("Email must be a valid format");
    });

    it("should reject missing role on full update for admin (Negative)", () => {
        const req = {
            user: { role: "ADMIN" },
            body: {
                name: "Admin User",
                email: "admin@test.com",
                phone: "0711234567"
            }
        };
        const res = makeRes();
        const next = sinon.stub();

        const middleware = validateUpdateUser(true);
        middleware(req, res, next);

        expect(next.called).to.equal(false);
        expect(res.status.calledWith(400)).to.equal(true);
        const details = res.json.firstCall.args[0]?.details || [];
        expect(details).to.include("Role is required for Admin full update");
    });

    it("should accept user query with normalized phone (Positive)", () => {
        const req = { query: { phone: "0711234567" } };
        const res = makeRes();
        const next = sinon.stub();

        validateUserQuery(req, res, next);

        expect(next.calledOnce).to.equal(true);
        expect(res.status.called).to.equal(false);
        expect(req.query.phone).to.equal("+94711234567");
    });
});

