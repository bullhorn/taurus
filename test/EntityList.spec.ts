import * as sinon from 'sinon';
import { EntityTypes, Candidate } from '@bullhorn/bullhorn-types';
import { EntityList } from '../src/index';
import { candidateMetaResponse, candidateListResponse } from './_Helpers';

describe('EntityList', () => {
  let server;
  beforeEach(() => {
    server = sinon.createFakeServer();
    server.autoRespond = true;
  });
  afterEach(() => {
    server.restore();
  });

  it('should get list data', (done) => {
    server.respondWith('GET', /search\/Candidate/, candidateListResponse());
    server.respondWith('GET', /meta\/Candidate/, candidateMetaResponse());
    const candidates: EntityList<Candidate> = new EntityList(EntityTypes.Candidate, {
      fields: ['id', 'name', 'phone'],
      limitTo: 20,
    });
    candidates.subscribe((records) => {
      expect(records.length).toEqual(20);
      done();
    });
  });
});
