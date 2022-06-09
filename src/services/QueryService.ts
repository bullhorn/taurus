import { AxiosInstance, AxiosResponse } from 'axios';
import { BullhornListResponse } from '../types';
import { MetaService } from './MetaService';
import { Staffing } from './Staffing';
import { Where } from './Where';

/**
 * A base class for making Query calls via Rest
 */
export class QueryService<T> {
  http: AxiosInstance;
  meta: MetaService;
  records = [];
  parameters: { fields; orderBy?: string[]; start: number; count: number; where?: string; layout?: string; sort?; query?; showTotalMatched?: boolean} = {
    fields: ['id'],
    orderBy: ['-dateAdded'],
    start: 0,
    count: 10,
  };
  protected _page = 0;
  protected _endpoint: string;
  protected _lastResponse: BullhornListResponse<T>;
  private readonly initialized: Promise<unknown>;

  /**
   * constructor description
   * @param endpoint - Base Url for all relative http calls eg. 'query/JobOrder'
   */
  constructor(public entity: string, callingIdentifier = '') {
    this.initialized = this.initialize(callingIdentifier);
    this.meta = new MetaService(entity, callingIdentifier);
  }

  async initialize(callingIdentifier = '') {
    this.http = await Staffing.http(callingIdentifier);
  }

  get endpoint(): string {
    return this._endpoint || `query/${this.entity}`;
  }
  set endpoint(value: string) {
    this._endpoint = value;
  }

  get total(): Promise<number> {
    return (async () => {
      await this.initialized;
      if (this._lastResponse && this._lastResponse.total) {
        return this._lastResponse.total;
      }
      return this.http
        .get(this.endpoint, { params: { fields: 'id', count: 0, ...this.parameters } })
        .then((response: AxiosResponse) => response.data)
        .then((result: BullhornListResponse<T>) => {
          return result.total || 0;
        });
    })();
  }

  get snapshot() {
    return this._lastResponse;
  }

  fields(...args: string[][]) {
    this.parameters.fields = args[0] instanceof Array ? args[0] : args;
    return this;
  }
  sort(...args) {
    this.parameters.orderBy = args[0] instanceof Array ? args[0] : args;
    return this;
  }
  where(value: {}) {
    return this.query(Where.toQuerySyntax(value));
  }
  query(value: string) {
    this.parameters.where = value;
    return this;
  }
  appendQuery(value: string) {
    this.parameters.where = this.parameters.where?.length ? `${this.parameters.where} AND ${value}` : value;
    return this;
  }
  count(value: number) {
    this.parameters.count = value;
    return this;
  }
  page(value: number) {
    this._page = value;
    this.parameters.start = this.parameters.count * value;
    return this;
  }
  async nextpage() {
    return this.page(++this._page).run(true);
  }
  params(object) {
    this.parameters = { ...this.parameters, ...object };
    return this;
  }
  async get(add) {
    return this.run(add);
  }
  async run(add: boolean): Promise<BullhornListResponse<T>> {
    await this.initialized;
    const requestTimestamp = Date.now();
    const [response, metadata] = await Promise.all([this.httpGet(this.parameters), this.meta.getFull(this.parameters.fields, this.parameters.layout)]);
    const result = response.data;
    if (this.shouldPullMoreRecords(result)) {
      const recursiveData = await this.recursiveQueryPull(result);
      result.data = result.data.concat(recursiveData);
    }
    result.count = result.data.length;

    this._lastResponse = result;
    if (add) {
      this.records = this.records.concat(result.data);
    } else {
      this.records = result.data;
    }
    result.meta = metadata;
    result.timestamp = requestTimestamp;
    return result;
  }

  private async recursiveQueryPull({ count = 0, start = 0 }) {
    const [nextStart, nextCount] = this.getNext(start, count);
    const response = await this.httpGet({ ...this.parameters, ...{ start: nextStart, count: nextCount } });
    if (this.shouldPullMoreRecords(response.data)) {
      const nextData = await this.recursiveQueryPull(response.data);
      response.data.data = response.data.data.concat(nextData);
    }
    return response.data.data;
  }

  private shouldPullMoreRecords({ count = 0, start = 0, total = 0 }) {
    const [nextStart, nextCount] = this.getNext(start, count);
    if (!this.parameters.showTotalMatched) {
      return (count === 0) ? false : (nextCount > 0);
    }
    return (nextStart < total && count !== 0) ? nextCount : 0;
  }

  private getNext(start: number, count: number) {
    const nextStart = start + count;
    const alreadyFetched = nextStart - this.parameters.start;
    const nextCount = this.parameters.count - alreadyFetched;
    return [nextStart, nextCount];
  }

  private async httpGet(params) {
    return this.http.get(this.endpoint, { params });
  }

  async then(done, fail?) {
    return this.run(false).then(done, fail);
  }
}
