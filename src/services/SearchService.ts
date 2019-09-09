import { QueryService } from './QueryService';
import { Where } from './Where';
/**
 * A class for making Search calls via Rest
 */
export class SearchService<T> extends QueryService<T> {
  /**
   * constructor description
   * @param endpoint - Base Url for all relative http calls eg. 'search/JobOrder'
   */
  constructor(entity, routeUrl: string = '') {
    super(entity, routeUrl);
    this.parameters = {
      fields: ['id'],
      sort: ['-dateAdded'],
      start: 0,
      count: 10,
    };
  }
  get endpoint(): string {
    return this._endpoint || `search/${this.entity}`;
  }
  set endpoint(value: string) {
    this._endpoint = value;
  }

  sort(...args) {
    this.parameters.sort = args[0] instanceof Array ? args[0] : args;
    return this;
  }

  where(value: any) {
    return this.query(Where.toSearchSyntax(value));
  }

  query(value: any) {
    this.parameters.query = value;
    return this;
  }

  async then(done: any, fail?: any): Promise<any> {
    return this.run(false).then(done, fail);
  }
}
