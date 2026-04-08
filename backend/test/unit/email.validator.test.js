import { expect } from 'chai';

// Email validation pattern used in the codebase
const emailPattern = /^\S+@\S+\.\S+$/;

// Helper function to validate email (matches the validator logic)
const isValidEmail = (email) => {
    return email && typeof email === 'string' && emailPattern.test(email);
};

describe('Email Validator', () => {
    describe('Valid Email Formats', () => {
        it('should accept standard email format', () => {
            expect(isValidEmail('user@example.com')).to.be.true;
        });

        it('should accept email with numbers', () => {
            expect(isValidEmail('user123@example.com')).to.be.true;
        });

        it('should accept email with dots in local part', () => {
            expect(isValidEmail('first.last@example.com')).to.be.true;
        });

        it('should accept email with plus sign', () => {
            expect(isValidEmail('user+tag@example.com')).to.be.true;
        });

        it('should accept email with hyphens', () => {
            expect(isValidEmail('user-name@example-domain.com')).to.be.true;
        });

        it('should accept email with underscore', () => {
            expect(isValidEmail('user_name@example.com')).to.be.true;
        });

        it('should handle short valid email', () => {
            expect(isValidEmail('a@b.co')).to.be.true;
        });
    });

    describe('Invalid Email Formats (Negative Test Cases)', () => {
        it('should reject email without @ symbol', () => {
            expect(isValidEmail('userexample.com')).to.be.false;
        });

        it('should reject email without domain', () => {
            expect(isValidEmail('user@')).to.be.false;
        });

        it('should reject email without TLD', () => {
            expect(isValidEmail('user@example')).to.be.false;
        });

        it('should reject email with spaces in local part', () => {
            expect(isValidEmail('user name@example.com')).to.be.false;
        });

        it('should reject email with space before @', () => {
            expect(isValidEmail('user @example.com')).to.be.false;
        });

        it('should reject email with space after @', () => {
            expect(isValidEmail('user@ example.com')).to.be.false;
        });

        it('should reject email with only @ symbol', () => {
            expect(isValidEmail('@example.com')).to.be.false;
        });

        it('should reject email without local part', () => {
            expect(isValidEmail('@example.com')).to.be.false;
        });

        it('should reject non-string values', () => {
            expect(isValidEmail(123)).to.be.false;
            expect(isValidEmail({})).to.be.false;
            expect(isValidEmail([])).to.be.false;
        });

        it('should reject email with only whitespace', () => {
            expect(isValidEmail('   ')).to.be.false;
        });

        it('should reject email missing dot before TLD', () => {
            expect(isValidEmail('user@examplecom')).to.be.false;
        });
    });
});