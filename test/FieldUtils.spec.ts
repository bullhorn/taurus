import { readField, readFields, stringify, missingSubFields } from '../src';

describe('FieldUtils', () => {
  expect.extend({
    toBeSameArray(received, argument) {
      const expected = JSON.stringify(received);
      const comparison = JSON.stringify(argument);
      const pass = expected === comparison;
      if (pass) {
        return {
          pass: true,
          message: () => `expected value: \n${expected}\nnot to be equal to:\n${comparison}`,
        };
      }
      return {
        pass: false,
        message: () => `expected value: \n${expected}\nto be equal to:\n${comparison}`,
      };
    },
  });

  describe('function: readField', () => {
    it('should parse regular field', () => {
      const field = 'name';
      const res = readField(field);
      expect(res).toBe('name');
    });
    it('should parse nested field', () => {
      const field = 'jobOrders(id,title,status)';
      const res = readField(field);
      expect(res).toBeSameArray(['jobOrders', ['id', 'title', 'status']]);
    });
    it('should parse nested field and ignore query and count syntax', () => {
      // tslint:disable-next-line: quotemark
      const field = `businessSectors[3](name,id){name='Insurance'}`;
      const res = readField(field);
      expect(res).toBeSameArray(['businessSectors', ['name', 'id']]);
    });
    it('should parse double nested field', () => {
      const field = 'placement(id,candidate(id,name))';
      const res = readField(field);
      expect(res).toBeSameArray(['placement', ['id', ['candidate', ['id', 'name']]]]);
    });
  });

  describe('function: readFields', () => {
    it('should the whole fields string', () => {
      const fields = 'id,title,placement(id,candidate(id,name))';
      const res = readFields(fields);
      expect(res).toBeSameArray(['id', 'title', ['placement', ['id', ['candidate', ['id', 'name']]]]]);
    });
  });

  describe('function: stringify', () => {
    it('should write the string back', () => {
      const fields = 'id,title,placement(id,candidate(id,name))';
      const res = readFields(fields);
      const str = stringify(res);
      expect(str).toBe(fields);
    });
  });

  describe('function: missingSubFields', () => {
    it('should return whole field request when no meta is present', () => {
      const fields = 'placement(id,candidate(id,name))';
      const res = missingSubFields(fields, null);
      expect(res).toBe(fields);
    });

    it('should extract only missing fields', () => {
      const fields = 'placement(id,candidate(id,name,address))';
      const meta = {
        associatedEntity: {
          fields: [
            { name: 'id' },
            {
              name: 'candidate',
              associatedEntity: {
                fields: [{ name: 'id' }, { name: 'name' }],
              },
            },
          ],
        },
      };
      const res = missingSubFields(fields, meta);
      expect(res).toBe('placement(candidate(address))');
    });

    it('should extract only missing fields when multiple nested fields', () => {
      const fields = 'placement(id,payRate,candidate(id,name,address),jobOrder(id,status,title))';
      const meta = {
        associatedEntity: {
          fields: [
            { name: 'id' },
            {
              name: 'candidate',
              associatedEntity: {
                fields: [{ name: 'id' }, { name: 'name' }],
              },
            },
            {
              name: 'jobOrder',
              associatedEntity: {
                fields: [{ name: 'id' }, { name: 'title' }],
              },
            },
          ],
        },
      };
      const res = missingSubFields(fields, meta);
      expect(res).toBe('placement(payRate,candidate(address),jobOrder(status))');
    });

    it('should extract missing fields when missing nested root field', () => {
      const fields = 'placement(id,payRate,candidate(id,name,address),jobOrder(id,status,title))';
      const meta = {
        associatedEntity: {
          fields: [
            { name: 'id' },
            {
              name: 'candidate',
              associatedEntity: {
                fields: [{ name: 'id' }, { name: 'name' }],
              },
            },
          ],
        },
      };
      const res = missingSubFields(fields, meta);
      expect(res).toBe('placement(payRate,candidate(address),jobOrder(id,status,title))');
    });
  });
});
