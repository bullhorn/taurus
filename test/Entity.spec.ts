import * as sinon from 'sinon';
import { EntityTypes, Candidate } from '@bullhorn/bullhorn-types';
import { Entity } from '../src/index';
import { okJsonResponse, candidateMetaResponse } from './_Helpers';

function getRecord(): Candidate {
    return {
        name: 'John Smith',
        phone: '555-271-8815'};
}

describe('Entity', () => {
    it('should add fields, getters, and setters', () => {
        const entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).set(getRecord()).fields('name', 'phone');
        expect(entity.value.phone).toEqual('555-271-8815');
    });

    it('should have proxied fields that are observables', done => {
        const entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).set(getRecord()).fields('name', 'phone');
        entity.name.subscribe(v => {
            expect(v).toEqual('John Smith');
            done();
        });
    });

    it('should set observables', done => {
        const entity: Entity<Candidate> = new Entity(EntityTypes.Candidate, undefined, getRecord()).fields('name', 'phone');
        entity.name = 'Jane Smith';
        entity.name.subscribe(v => {
            expect(entity.value.name).toEqual('Jane Smith');
            done();
        });
    });

    it('should link entities through Message Broker with same id', () => {
        const john: Entity<Candidate> = new Entity(EntityTypes.Candidate, undefined, { id: 100, name: 'John' });
        const jack: Entity<Candidate> = new Entity(EntityTypes.Candidate, undefined, { id: 100, name: 'Jack' });
        expect(john.value.name).toEqual('John');
        expect(jack.value.name).toEqual('Jack');
        jack.patch({ name: 'Harry' });
        expect(john.value.name).toEqual('Harry');
        expect(jack.value.name).toEqual('Harry');
    });

    it('should dispatch multiple event through proxied field', done => {
        const entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).set(getRecord());
        const expectations = ['John Smith', 'Jane Smith'];
        // Inital Value will be John Smith
        entity.subscribe(v => {
            expect(entity.value.name).toEqual(expectations.shift());
            if (!expectations.length) {
                done();
            }
        });
        // Next Value will be Jane Smith
        entity.name = 'Jane Smith';
    });

    describe('with API calls', () => {
        let server;
        beforeEach(function () {
            server = sinon.fakeServer.create();
        });
        afterEach(function () {
            server.restore();
        });

        it('should save record and set id value from response', done => {
            const entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).set(getRecord()).fields('name', 'phone');
            const okResponse = okJsonResponse({ changedEntityId: 100 });
            server.respondWith('PUT', /entity\/Candidate/, okResponse);
            entity.save().then(res => {
                expect(entity.value.id).toEqual(100);
                done();
            });
            setTimeout(() => server.respond(), 10);

        });

        // It('should get record from server through promise', (done) => {
        //     Let entity: Entity<Candidate> = new Entity(EntityTypes.Candidate, {}).fields('name', 'phone');
        //     Le t okResponse = okJsonResponse({ data: { id: 100, name: 'Fred', phone: '555-251-9321' } });
        //     Let metaResponse = candidateMetaResponse();
        //     Server.respondWith('GET', /entity\/Candidate/, okResponse);
        //     Server.respondWith('GET', /meta\/Candidate/, metaResponse);
        //     Entity.get(100).then(res => {
        //         Expect(entity.data.id).toEqual(100);
        //         Expect(entity.data.name).toEqual('Fred');
        //         Expect(entity.data.phone).toEqual('555-251-9321');
        //         Done();
        //     }).catch((err) => {
        //         Console.error(err);
        //     });
        //     Server.respond();
        // });

        it('should get record from server and emit response through observable', done => {
            const okResponse = okJsonResponse({ data: { id: 100, name: 'Fred', phone: '555-251-9321' } });
            const metaResponse = candidateMetaResponse();
            server.respondWith('GET', /entity\/Candidate/, okResponse);
            server.respondWith('GET', /meta\/Candidate/, metaResponse);

            const entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).fields('name', 'phone').get(100);

            entity.subscribe(res => {
                expect(entity.value.id).toEqual(100);
                expect(entity.value.name).toEqual('Fred');
                expect(entity.value.phone).toEqual('555-251-9321');
                done();
            });

            setTimeout(() => server.respond(), 10);
        });
    });
});
