import { Where } from '../src/index';

describe('Where', () => {
    describe('with simple queries', () => {
        const SIMPLE_QUERY = {
            id: 101,
            status: 'New Lead',
            categories: [101, 102],
            dateAdded: 1426709667357
        };

        it('should create a simple lucene query', () => {
            let where = Where.toSearchSyntax(SIMPLE_QUERY);
            expect(where).toEqual('id:101 AND status:"New Lead" AND categories:(101 102) AND dateAdded:1426709667357');
        });

        it('should create a simple database query', () => {
            let where = Where.toQuerySyntax(SIMPLE_QUERY);
            expect(where).toEqual(`id=101 AND status='New Lead' AND categories IN (101,102) AND dateAdded=1426709667357`);
        });
    });

    describe('with negative queries', () => {
        it('should create a valid lucene query', () => {
            let where = Where.toSearchSyntax({
                id: 101,
                status: { not: 'Archived' },
                categories: { not: { any: [103, 104] } }
            });

            expect(where).toEqual('id:101 AND NOT (status:"Archived") AND NOT (categories:(103 104))');
        });

        it('should create a valid database query', () => {
            let where = Where.toQuerySyntax({
                id: 101,
                status: { not: 'Archived' },
                categories: { not: { any: [103, 104] } }
            });

            expect(where).toEqual(`id=101 AND status<>'Archived' AND categories NOT IN (103,104)`);
        });
    });
    
    describe('with or queries', () => {
        it('should create a valid OR query', () => {
            let where = Where.toSearchSyntax({
                or: {
                    firstName: 'Abe',
                    lastName: 'Lincoln'
                },
                owner: {
                    or: {
                        firstName: 'Abe',
                        lastName: 'Lincoln'
                    }
                }
            });

            expect(where).toEqual('(firstName:"Abe" OR lastName:"Lincoln") AND (owner.firstName:"Abe" OR owner.lastName:"Lincoln")');
        });
    });

    describe('with nested queries', () => {
        it('should create a valid lucene query', () => {
            let where = Where.toSearchSyntax({
                id: 101,
                owner: {
                    id: {
                        not: { min: 101, max: 102 }
                    },
                    department: {
                        id: 122
                    }
                }
            });

            expect(where).toEqual('id:101 AND NOT (owner.id:[101 TO 102]) AND owner.department.id:122');
        });
        it('should create a valid database query', () => {
            let where = Where.toQuerySyntax({
                id: 101,
                owner: {
                    id: {
                        not: { min: 101, max: 102 }
                    },
                    department: {
                        id: 122
                    }
                }
            });

            expect(where).toEqual('id=101 AND owner.id<101 AND owner.id>=102 AND owner.department.id=122');
        });
    });

    describe('with lookup queries', () => {
        it('should create a valid lucene query', () => {
            let where = Where.toSearchSyntax({
                owner: {
                    id: {
                        lookup: {
                            firstName: { min: 'Bob', max: 'Boc' },
                            lastName: { min: 'Jones', max: 'Jonet' }
                        }
                    }
                }
            });

            expect(where).toEqual(`owner.id:"^(firstName>='Bob' AND firstName<'Boc' AND lastName>='Jones' AND lastName<'Jonet')"`);
        });
    });
});
