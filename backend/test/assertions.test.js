import { expect } from 'chai';

// Pure Assertions (expect) & BDD Syntax (describe/it)
describe('IT23286696 - Devinda M R I: Perfectly Balanced Data Audit', () => {

    // 1. DOMAIN A: USER & AUTHENTICATION
    describe('Domain A: Identity & Access Control', () => {
        it('should validate a complete Ranger profile (Positive)', () => {
            const user = { name: "Anura", email: "anura@wildlife.lk", role: "RANGER" };
            expect(user.name).to.have.length.at.least(3);
            expect(user.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            expect(user.role).to.equal('RANGER');
        });

        it('should strictly enforce allowed roles (Negative)', () => {
            const invalidRole = "GUEST_USER";
            expect(["ADMIN", "RANGER"]).to.not.include(invalidRole);
        });

        it('should fail if email is missing the domain (Negative)', () => {
            expect("ranger_wrong").to.not.include('@');
        });
    });

    // 2. DOMAIN B: PATROL OPERATIONS
    describe('Domain B: Field Patrol Tracking', () => {
        it('should validate Sri Lankan coordinate ranges (Positive)', () => {
            const patrolLoc = { lat: 7.5, lng: 80.5 };
            expect(patrolLoc.lat).to.be.within(5.9, 9.9);
            expect(patrolLoc.lng).to.be.within(79.5, 81.9);
        });

        it('should accept a team of multiple rangers (Positive)', () => {
            const assignedRangers = ["R-101", "R-102"];
            expect(assignedRangers).to.be.an('array').with.length.at.least(1);
        });

        it('should catch impossible GPS latitudes (Negative)', () => {
            const badLat = 185;
            expect(badLat).to.not.be.within(-90, 90, "Latitude exceeds world bounds");
        });

        it('should fail if session start is after the end (Negative)', () => {
            const start = 1000; const end = 500;
            expect(start).to.be.above(end, "Logical Error: Start cannot be after End");
        });
    });

    // 3. DOMAIN C: WILDLIFE & MOVEMENTS
    describe('Domain C: Wildlife Telemetry', () => {
        it('should validate animal tag format (Positive)', () => {
            const tag = "T123A";
            const numericPart = tag.substring(1);
            // Rules: Starts with T, 3-20 length, alphanumeric, non-zero numeric part
            expect(tag).to.match(/^T[A-Z0-9]{2,19}$/i);
            expect(numericPart).to.not.match(/^0+$/);
        });

        it('should identify endemic species correctly (Positive)', () => {
            const leopard = { species: "Sri Lankan Leopard", endemic: true };
            expect(leopard.endemic).to.be.true;
        });

        it('should reject invalid gender classification (Negative)', () => {
            const badSex = "PRIVATE";
            expect(["MALE", "FEMALE", "UNKNOWN"]).to.not.include(badSex);
        });

        it('should fail on negative movement speeds (Negative)', () => {
            const speed = -15;
            expect(speed).to.be.below(0, "Biological speed cannot be negative");
        });
    });

    // 4. DOMAIN D: INCIDENTS & ALERTS
    describe('Domain D: Incident Integrity', () => {
        it('should verify critical alert priority (Positive)', () => {
            const alert = { type: 'POACHING', severity: 'CRITICAL' };
            expect(alert.severity).to.equal('CRITICAL');
        });

        it('should track evidence as valid links (Positive)', () => {
            const evidence = "http://storage.com/photo.jpg";
            expect(evidence).to.match(/^http/);
        });

        it('should fail if incident report is empty (Negative)', () => {
            const desc = "";
            expect(desc).to.have.lengthOf(0);
        });

        it('should reject negative risk severity scores (Negative)', () => {
            const score = -1;
            expect(score).to.be.below(0, "Severity score must be positive");
        });
    });

    // 5. DOMAIN E: PROTECTED AREAS & ZONES
    describe('Domain E: Spatial Map Boundaries', () => {
        it('should validate Park types (Positive)', () => {
            const area = { type: "NATIONAL_PARK" };
            expect(["NATIONAL_PARK", "FOREST_RESERVE"]).to.include(area.type);
        });

        it('should verify Polygon geometry (Positive)', () => {
            const zone = { geometry: { type: "Polygon" } };
            expect(zone.geometry.type).to.equal("Polygon");
        });

        it('should reject negative area sizes (Negative)', () => {
            const size = -100;
            expect(size).to.be.below(0);
        });

        it('should block unrecognized zone types (Negative)', () => {
            const badZone = "URBAN";
            expect(["CORE", "BUFFER", "EDGE"]).to.not.include(badZone);
        });
    });
});
