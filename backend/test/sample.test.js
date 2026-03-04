import { expect } from 'chai';

describe('Sample Test Suite', () => {
  it('should verify that 1 + 1 equals 2', () => {
    expect(1 + 1).to.equal(2);
  });

  it('should verify basic string operations', () => {
    const str = 'Life-On-Land';
    expect(str).to.include('Life');
  });
});
