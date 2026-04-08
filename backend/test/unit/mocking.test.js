import { expect } from 'chai';
import sinon from 'sinon';

import * as animalService from '../../services/animal.service.js';
import * as movementService from '../../services/movement.service.js';
import * as incidentService from '../../services/incident.service.js';
import * as areaService from '../../services/protectedArea.Service.js';
import * as zoneService from '../../services/zone.Service.js';
import * as patrolService from '../../services/patrol.service.js';

// Default imports — sinon can stub properties on plain objects
import animalRepo from '../../repositories/animal.repository.js';
import movementRepo from '../../repositories/movement.repository.js';
import incidentRepo from '../../repositories/incident.repository.js';
import areaRepo from '../../repositories/protectedArea.repository.js';
import zoneRepo from '../../repositories/zone.repository.js';
import patrolRepo from '../../repositories/patrol.repository.js';

describe('IT23293526 - Vimasha J P O: Mocking & Service Layer Tests', () => {

    // DOMAIN 1: ANIMAL SERVICE 
    describe('Domain: Animal Service Mocking', () => {
        let findStub;

        beforeEach(() => { findStub = sinon.stub(animalRepo, 'findById'); });
        afterEach(() => { findStub.restore(); });

        it('should return animal data when repo finds the animal (Positive)', async () => {
            findStub.resolves({ tagId: "T123A", species: "Sri Lankan Leopard", status: "ACTIVE" });
            const result = await animalService.getAnimalById("MOCK-ID");
            expect(result.tagId).to.equal("T123A");
            expect(findStub.calledOnce).to.be.true;
        });

        it('should throw 404 when the animal does not exist (Negative)', async () => {
            findStub.resolves(null);
            try {
                await animalService.getAnimalById("NONEXISTENT");
            } catch (err) {
                expect(err.statusCode).to.equal(404);
                expect(err.message).to.include("not found");
            }
        });
    });

    // DOMAIN 2: MOVEMENT SERVICE 
    describe('Domain: Movement Service Mocking', () => {
        let createStub;

        beforeEach(() => { createStub = sinon.stub(movementRepo, 'create'); });
        afterEach(() => { createStub.restore(); });

        it('should return a saved movement record on success (Positive)', async () => {
            const fakeMovement = { tagId: "T123A", lat: 8.4, lng: 80.1, speed: 12 };
            createStub.resolves(fakeMovement);
            const result = await movementService.createMovement(fakeMovement);
            expect(result.tagId).to.equal("T123A");
            expect(createStub.calledOnce).to.be.true;
        });

        it('should throw an error if movement creation fails (Negative)', async () => {
            createStub.rejects(new Error("DB write failed"));
            try {
                await movementService.createMovement({});
            } catch (err) {
                expect(err.message).to.equal("DB write failed");
            }
        });
    });

    // DOMAIN 3: INCIDENT SERVICE
    describe('Domain: Incident Service Mocking', () => {
        let findStub;

        beforeEach(() => { findStub = sinon.stub(incidentRepo, 'findById'); });
        afterEach(() => { findStub.restore(); });

        it('should return an incident record when it exists (Positive)', async () => {
            findStub.resolves({ type: "POACHING", severity: "CRITICAL", status: "REPORTED" });
            const result = await incidentService.getIncidentById("MOCK-ID");
            expect(result.type).to.equal("POACHING");
        });

        it('should throw 404 if incident does not exist (Negative)', async () => {
            findStub.resolves(null);
            try {
                await incidentService.getIncidentById("WRONG-ID");
            } catch (err) {
                expect(err.statusCode).to.equal(404);
            }
        });
    });

    // DOMAIN 4: PROTECTED AREA SERVICE
    describe('Domain: Protected Area Service Mocking', () => {
        let findAllStub;

        beforeEach(() => { findAllStub = sinon.stub(areaRepo, 'findAll'); });
        afterEach(() => { findAllStub.restore(); });

        it('should return a list of protected areas (Positive)', async () => {
            findAllStub.resolves([
                { name: "Wilpattu", type: "NATIONAL_PARK" },
                { name: "Yala", type: "NATIONAL_PARK" }
            ]);
            const result = await areaService.getAllProtectedAreas();
            expect(result).to.be.an('array').with.lengthOf(2);
        });

        it('should return empty array when no areas exist (Negative)', async () => {
            findAllStub.resolves([]);
            const result = await areaService.getAllProtectedAreas();
            expect(result).to.be.an('array').that.is.empty;
        });
    });

    // DOMAIN 5: ZONE SERVICE 
    describe('Domain: Zone Service Mocking', () => {
        let findStub;

        beforeEach(() => { findStub = sinon.stub(zoneRepo, 'findById'); });
        afterEach(() => { findStub.restore(); });

        it('should return a CORE zone when it exists (Positive)', async () => {
            findStub.resolves({ name: "Core Buffer A", zoneType: "CORE" });
            const result = await zoneService.getZoneById("ZONE-ID");
            expect(result.zoneType).to.equal("CORE");
        });

        it('should throw 404 if zone does not exist (Negative)', async () => {
            findStub.resolves(null);
            try {
                await zoneService.getZoneById("WRONG-ID");
            } catch (err) {
                expect(err.statusCode).to.equal(404);
            }
        });
    });

    // DOMAIN 6: PATROL SERVICE 
    describe('Domain: Patrol Service Mocking', () => {
        let findStub;
        let updateStub;

        beforeEach(() => {
            findStub = sinon.stub(patrolRepo, 'findById');
            updateStub = sinon.stub(patrolRepo, 'updateById');
        });
        afterEach(() => {
            findStub.restore();
            updateStub.restore();
        });

        it('should return a patrol record when it exists (Positive)', async () => {
            const fakePatrol = { status: "STARTED", assignedRangers: ["R-101"] };
            findStub.resolves(fakePatrol);
            updateStub.resolves(fakePatrol);
            const result = await patrolService.updatePatrol("MOCK-ID", { status: "COMPLETED" });
            expect(result.status).to.equal("STARTED");
            expect(findStub.calledOnce).to.be.true;
        });

        it('should throw 404 when patrol is not found (Negative)', async () => {
            findStub.resolves(null);
            try {
                await patrolService.updatePatrol("WRONG-ID", {});
            } catch (err) {
                expect(err.statusCode).to.equal(404);
                expect(err.message).to.equal("Patrol not found");
            }
        });
    });

});
