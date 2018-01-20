import * as sinon from 'sinon';
import axios from 'axios';
import { EntityTypes, Candidate } from '@bullhorn/bullhorn-types';
import { Entity } from '../src/index';
import { okJsonResponse, candidateMetaResponse } from './_Helpers';

function getRecord(): Candidate {
    return Object.assign({
        name: 'John Smith',
        phone: '555-271-8815'
    });
};

describe('Entity', () => {
    it('should add fields, getters, and setters', () => {
        let entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).set(getRecord()).fields('name', 'phone');
        expect(entity.value.phone).toEqual('555-271-8815');
    });

    it('should have proxied fields that are observables', (done) => {
        let entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).set(getRecord()).fields('name', 'phone');
        entity.name.subscribe(v => {
            expect(v).toEqual('John Smith');
            done();
        });
    });

    it('should set observables', (done) => {
        let entity: Entity<Candidate> = new Entity(EntityTypes.Candidate, undefined, getRecord()).fields('name', 'phone');
        entity.name = 'Jane Smith';
        entity.name.subscribe(v => {
            expect(entity.value.name).toEqual('Jane Smith');
            done();
        });
    });

    it('should link entities through Message Broker with same id', () => {
        let john: Entity<Candidate> = new Entity(EntityTypes.Candidate, undefined, { id: 100, name: 'John' });
        let jack: Entity<Candidate> = new Entity(EntityTypes.Candidate, undefined, { id: 100, name: 'Jack' });
        expect(john.value.name).toEqual('John');
        expect(jack.value.name).toEqual('Jack');
        jack.patch({ name: 'Harry' });
        expect(john.value.name).toEqual('Harry');
        expect(jack.value.name).toEqual('Harry');
    });

    it('should dispatch multiple event through proxied field', (done) => {
        let entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).set(getRecord());
        let expectations = ['John Smith', 'Jane Smith']
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

        it('should save record and set id value from response', (done) => {
            let entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).set(getRecord()).fields('name', 'phone');
            let okResponse = okJsonResponse({ changedEntityId: 100 });
            server.respondWith('PUT', /entity\/Candidate/, okResponse);
            entity.save().then(res => {
                expect(entity.value.id).toEqual(100);
                done();
            });
            setTimeout(() => server.respond(), 10);

        });

        // it('should get record from server through promise', (done) => {
        //     let entity: Entity<Candidate> = new Entity(EntityTypes.Candidate, {}).fields('name', 'phone');
        //     le t okResponse = okJsonResponse({ data: { id: 100, name: 'Fred', phone: '555-251-9321' } });
        //     let metaResponse = candidateMetaResponse();
        //     server.respondWith('GET', /entity\/Candidate/, okResponse);
        //     server.respondWith('GET', /meta\/Candidate/, metaResponse);
        //     entity.get(100).then(res => {
        //         expect(entity.data.id).toEqual(100);
        //         expect(entity.data.name).toEqual('Fred');
        //         expect(entity.data.phone).toEqual('555-251-9321');
        //         done();
        //     }).catch((err) => {
        //         console.error(err);
        //     });
        //     server.respond();
        // });

        it('should get record from server and emit response through observable', (done) => {
            let okResponse = okJsonResponse({ data: { id: 100, name: 'Fred', phone: '555-251-9321' } });
            let metaResponse = candidateMetaResponse();
            server.respondWith('GET', /entity\/Candidate/, okResponse);
            server.respondWith('GET', /meta\/Candidate/, metaResponse);

            let entity: Entity<Candidate> = new Entity(EntityTypes.Candidate).fields('name', 'phone').get(100);

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
