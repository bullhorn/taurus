import { MetaService } from '../src';

describe('MetaService', () => {
  describe('function: hasMemory', () => {
    it('should be defined', () => {
      const meta: MetaService = new MetaService('Candidate');
      const actual = meta.hasMemory;
      expect(actual).toBeDefined();
    });
    it('should return false when memory is undefined', () => {
      const meta: MetaService = new MetaService('Candidate');
      meta.memory = undefined;
      const actual = meta.hasMemory();
      expect(actual).toEqual(false);
    });
    it('should return false when memory is null', () => {
      const meta: MetaService = new MetaService('Candidate');
      meta.memory = null;
      const actual = meta.hasMemory();
      expect(actual).toEqual(false);
    });
    it('should return false when memory is false', () => {
      const meta: MetaService = new MetaService('Candidate');
      meta.memory = false;
      const actual = meta.hasMemory();
      expect(actual).toEqual(false);
    });
    it('should return false when memory is not an Object', () => {
      const meta: MetaService = new MetaService('Candidate');
      meta.memory = [];
      const actual = meta.hasMemory();
      expect(actual).toEqual(false);
    });
    it('should return false when memory is an empty Object', () => {
      const meta: MetaService = new MetaService('Candidate');
      meta.memory = {};
      const actual = meta.hasMemory();
      expect(actual).toEqual(false);
    });
    it('should return true when memory is a non-empty Object', () => {
      const meta: MetaService = new MetaService('Candidate');
      meta.memory = { test: 'test' };
      const actual = meta.hasMemory();
      expect(actual).toEqual(true);
    });
  });

  describe('function: missing', () => {
    it('should be defined', () => {
      const meta: MetaService = new MetaService('EarnCodeGroup');
      const actual = meta.missing;
      expect(actual).toBeDefined();
    });
    it('should return array of fields case 1', () => {
      const meta: MetaService = new MetaService('EarnCodeGroup');
      const associatedEntity = { fields: [{ name: 'id' }] };
      meta.memory = {
        id: { name: 'id' },
        candidate: { name: 'candidate', associatedEntity },
        jobOrder: { name: 'jobOrder', associatedEntity },
      };
      const fields = ['id', 'payRate', 'candidate(id,name,address)', 'jobOrder(id,status,title)'];
      const res = meta.missing(fields);
      expect(res[0]).toBe('payRate');
      expect(res[1]).toBe('candidate(name,address)');
      expect(res[2]).toBe('jobOrder(status,title)');
    });
  });

  describe('function: _clean', () => {
    it('should be defined', () => {
      const meta: MetaService = new MetaService('Candidate');
      const actual = meta._clean;
      expect(actual).toBeDefined();
    });
    it('should return a field name case 1', () => {
      const meta: MetaService = new MetaService('Candidate');
      const field = 'name';
      const res = meta._clean(field);
      expect(res).toBe('name');
    });
    it('should return a field name case 2', () => {
      const meta: MetaService = new MetaService('Candidate');
      const field = 'jobOrder(id,title)';
      const res = meta._clean(field);
      expect(res).toBe('jobOrder');
    });
    it('should return a field name case 3', () => {
      const meta: MetaService = new MetaService('Candidate');
      const field = 'jobOrder[3](id,title)';
      const res = meta._clean(field);
      expect(res).toBe('jobOrder');
    });
    it('should return a field name case 4', () => {
      const meta: MetaService = new MetaService('Candidate');
      const field = 'jobOrder.title';
      const res = meta._clean(field);
      expect(res).toBe('jobOrder');
    });
  });
});
