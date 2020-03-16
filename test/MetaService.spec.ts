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
});
