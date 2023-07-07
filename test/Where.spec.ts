import { Where } from '../src/index';

describe('Where', () => {
  describe('with simple queries', () => {
    const SIMPLE_QUERY = {
      id: 101,
      status: 'New Lead',
      categories: [101, 102],
      dateAdded: 1426709667357,
    };

    it('should create a simple lucene query', () => {
      const where = Where.toSearchSyntax(SIMPLE_QUERY);
      expect(where).toEqual('id:101 AND status:"New Lead" AND categories:(101 102) AND dateAdded:1426709667357');
    });

    it('should create a simple database query', () => {
      const where = Where.toQuerySyntax(SIMPLE_QUERY);
      expect(where).toEqual("id=101 AND status='New Lead' AND categories IN (101,102) AND dateAdded=1426709667357");
    });

    it('should create a simple lucene query with isNull true', () => {
      const SIMPLE_QUERY = {
        id: 101,
        status: 'New Lead',
        categories: [101, 102],
        dateAdded: 1426709667357,
        owner: {
          name: {
            isNull: true,
          },
        },
      };
      const where = Where.toQuerySyntax(SIMPLE_QUERY);
      expect(where).toEqual("id=101 AND status='New Lead' AND categories IN (101,102) AND dateAdded=1426709667357 AND owner.name IS NULL");
    });

    it('should create a simple lucene query with isNull false', () => {
      const SIMPLE_QUERY = {
        id: 101,
        status: 'New Lead',
        categories: [101, 102],
        dateAdded: 1426709667357,
        owner: {
          name: {
            isNull: false,
          },
        },
      };
      const where = Where.toQuerySyntax(SIMPLE_QUERY);
      expect(where).toEqual("id=101 AND status='New Lead' AND categories IN (101,102) AND dateAdded=1426709667357 AND owner.name IS NOT NULL");
    });
  });

  describe('with negative queries', () => {
    it('should create a valid lucene query', () => {
      const where = Where.toSearchSyntax({
        id: 101,
        status: { not: 'Archived' },
        categories: { not: { any: [103, 104] } },
      });

      expect(where).toEqual('id:101 AND NOT (status:"Archived") AND NOT (categories:(103 104))');
    });

    it('should create a valid database query', () => {
      const where = Where.toQuerySyntax({
        id: 101,
        status: { not: 'Archived' },
        categories: { not: { any: [103, 104] } },
      });

      expect(where).toEqual("id=101 AND status<>'Archived' AND categories NOT IN (103,104)");
    });
  });

  describe('with or queries', () => {
    it('should create a valid OR query', () => {
      const where = Where.toSearchSyntax({
        or: {
          firstName: 'Abe',
          lastName: 'Lincoln',
        },
        owner: {
          or: {
            firstName: 'Abe',
            lastName: 'Lincoln',
          },
        },
      });

      expect(where).toEqual('(firstName:"Abe" OR lastName:"Lincoln") AND (owner.firstName:"Abe" OR owner.lastName:"Lincoln")');
    });
    it('should create a valid OR query with 3 or more or conditions', () => {
      const where = Where.toSearchSyntax({
        or: {
          firstName: 'Abe',
          lastName: 'Lincoln',
          title: 'Mr. President',
        },
        owner: {
          or: {
            firstName: 'Abe',
            lastName: 'Lincoln',
          },
        },
      });

      expect(where).toEqual('(firstName:"Abe" OR lastName:"Lincoln" OR title:"Mr. President") AND (owner.firstName:"Abe" OR owner.lastName:"Lincoln")');
    });
  });

  describe('with OR min/max queries', () => {
    it('should create a valid nested OR min/max query', () => {
      const where = Where.toQuerySyntax({
        earncode: {
          orMinMax: {
            title: { min: 'tes', max: 'tet' },
            code: { min: 'tes', max: 'tet' },
          },
        },
      });

      expect(where).toEqual("((earncode.title>='tes' AND earncode.title<'tet') OR (earncode.code>='tes' AND earncode.code<'tet'))");
    });
    it('should create a valid nested OR min/max query with 3 or more conditions', () => {
      const where = Where.toQuerySyntax({
        earncode: {
          orMinMax: {
            title: { min: 'tes', max: 'tet' },
            code: { min: 'tes', max: 'tet' },
            externalID: { min: 'tes', max: 'tet' },
          },
        },
      });

      expect(where).toEqual("((earncode.title>='tes' AND earncode.title<'tet') OR (earncode.code>='tes' AND earncode.code<'tet') OR (earncode.externalID>='tes' AND earncode.externalID<'tet'))");
    });
    it('should create a valid nested OR min/max query with other conditions', () => {
      const where = Where.toQuerySyntax({
        earncode: {
          orMinMax: {
            title: { min: 'tes', max: 'tet' },
            code: { min: 'tes', max: 'tet' },
          },
        },
        or: {
          firstName: 'Abe',
          lastName: 'Lincoln',
        },
        externalID: 'testID',
      });

      expect(where).toEqual("((earncode.title>='tes' AND earncode.title<'tet') OR (earncode.code>='tes' AND earncode.code<'tet')) AND (firstName='Abe' OR lastName='Lincoln') AND externalID='testID'");
    });
    it('should a valid OR min/max query', () => {
      const where = Where.toQuerySyntax({
          orMinMax: {
            title: { min: 'tes', max: 'tet' },
            code: { min: 'tes', max: 'tet' },
          },
      });

      expect(where).toEqual("((title>='tes' AND title<'tet') OR (code>='tes' AND code<'tet'))");
    });
    it('should a valid OR min/max query with 3 or more conditions', () => {
      const where = Where.toQuerySyntax({
          orMinMax: {
            title: { min: 'tes', max: 'tet' },
            code: { min: 'tes', max: 'tet' },
            externalID: { min: 'tes', max: 'tet' },
          },
      });

      expect(where).toEqual("((title>='tes' AND title<'tet') OR (code>='tes' AND code<'tet') OR (externalID>='tes' AND externalID<'tet'))");
    });
    it('should create a valid nested OR min/max query with string', () => {
      const where = Where.toQuerySyntax({
        earncode: {
          orMinMax: {
            title: { min: 'tes', max: 'tet' },
            code: 'codeTest',
          },
        },
      });

      expect(where).toEqual("((earncode.title>='tes' AND earncode.title<'tet') OR (earncode.code='codeTest'))");
    });
    it('should create a valid nested OR min/max query with string order reversed', () => {
      const where = Where.toQuerySyntax({
        earncode: {
          orMinMax: {
            code: 'codeTest',
            title: { min: 'tes', max: 'tet' },
          },
        },
      });

      expect(where).toEqual("((earncode.code='codeTest') OR (earncode.title>='tes' AND earncode.title<'tet'))");
    });
    it('should a valid OR min/max query with string', () => {
      const where = Where.toQuerySyntax({
          orMinMax: {
            title: { min: 'tes', max: 'tet' },
            code: 'testCode',
          },
      });

      expect(where).toEqual("((title>='tes' AND title<'tet') OR (code='testCode'))");
    });
    it('should a valid OR min/max query with string reverse order', () => {
      const where = Where.toQuerySyntax({
          orMinMax: {
            code: 'testCode',
            title: { min: 'tes', max: 'tet' },
          },
      });

      expect(where).toEqual("((code='testCode') OR (title>='tes' AND title<'tet'))");
    });
  });

  describe('with nested queries', () => {
    it('should create a valid lucene query', () => {
      const where = Where.toSearchSyntax({
        id: 101,
        owner: {
          id: {
            not: { min: 101, max: 102 },
          },
          department: {
            id: 122,
          },
        },
      });

      expect(where).toEqual('id:101 AND NOT (owner.id:[101 TO 102]) AND owner.department.id:122');
    });
    it('should create a valid database query', () => {
      const where = Where.toQuerySyntax({
        id: 101,
        owner: {
          id: {
            not: { min: 101, max: 102 },
          },
          department: {
            id: 122,
          },
        },
      });

      expect(where).toEqual('id=101 AND owner.id<101 AND owner.id>=102 AND owner.department.id=122');
    });

    it('should create a valid search call with multiple MEMBER OFs', () => {
      const where = Where.toSearchSyntax({
        id: 103,
        owner: {
          departments: {
            memberOf: [121, 129],
          },
        },
      });

      expect(where).toEqual('id:103 AND owner.departments.id: (121 129)');
    });

    it('should create a valid search call with multiple NOT MEMBER OFs', () => {
      const where = Where.toSearchSyntax({
        id: 103,
        owner: {
          departments: {
            not: {
              memberOf: [122, 128],
            },
          },
        },
      });

      expect(where).toEqual('id:103 AND NOT (owner.departments.id: (122 128))');
    });

    it('should create a valid lucene query with multiple MEMBER OFs', () => {
      const where = Where.toQuerySyntax({
        id: 103,
        owner: {
          departments: {
            memberOf: [121, 129],
          },
        },
      });

      expect(where).toEqual('id=103 AND (121 MEMBER OF owner.departments OR 129 MEMBER OF owner.departments)');
    });

    it('should create a valid lucene query with multiple NOT MEMBER OFs', () => {
      const where = Where.toQuerySyntax({
        id: 103,
        owner: {
          departments: {
            not: {
              memberOf: [123, 124],
            },
          },
        },
      });

      expect(where).toEqual('id=103 AND (123 NOT MEMBER OF owner.departments AND 124 NOT MEMBER OF owner.departments)');
    });
  });

  describe('with lookup queries', () => {
    it('should create a valid lucene query', () => {
      const where = Where.toSearchSyntax({
        owner: {
          id: {
            lookup: {
              firstName: { min: 'Bob', max: 'Boc' },
              lastName: { min: 'Jones', max: 'Jonet' },
            },
          },
        },
      });

      expect(where).toEqual("owner.id:\"^(firstName>='Bob' AND firstName<'Boc' AND lastName>='Jones' AND lastName<'Jonet')\"");
    });
  });

  describe('with group queries', () => {
    it('should create a valid lucene query for A AND (B OR C) AND (D OR E)', () => {
      const where = Where.toSearchSyntax({
        id: 103,
        group_1: {
          startDate: { or: {max: '2022-01-01', isNull: true}},
        },
        group_2: {
          endDate: { or: { min: '2026-12-31', isNull: true }},
        }
      });
      expect(where).toEqual('id:103 AND (startDate: IS NULL OR startDate < \'2022-01-01\') AND (endDate: IS NULL OR endDate >= \'2026-12-31\')');
    });
    it('should create a valid lucene query with groups for A AND (B OR C) AND (D.id OR E.id)', () => {
      const where = Where.toSearchSyntax({
        id: 103,
        group_1: {
          or: {
            firstName: 'test',
            lastName: 'test'
          }
        },
        group_2: {
          or: {
            owner: {
              id: 103
            },
            secondaryOwners: {
              id: 103
            }
          }
        }
      });
      expect(where).toEqual('id:103 AND ((firstName:\"test\" OR lastName:\"test\")) AND ((owner.id:103 OR secondaryOwners.id:103))');
    });
    it('should create a valid lucene query with groups for (A AND (B OR C)) AND (D AND (E OR F))', () => {
      const where = Where.toSearchSyntax({
        group_1: {
          id: 103,
          or: {
            firstName: 'test',
            lastName: 'test'
          }
        },
        group_2: {
          id: 103,
          or: {
            owner: {
              id: 103
            },
            secondaryOwners: {
              id: 103
            }
          }
        }
      });
      expect(where).toEqual('(id:103 AND (firstName:\"test\" OR lastName:\"test\")) AND (id:103 AND (owner.id:103 OR secondaryOwners.id:103))');
    });
  });
});
