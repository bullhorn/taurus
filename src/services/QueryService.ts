import { AxiosInstance, AxiosResponse } from 'axios';
import { BullhornListResponse, BullhornMetaResponse } from '../types';
import { Staffing } from './Staffing';
import { Where } from './Where';
import { MetaService } from './MetaService';

/**
 * A base class for making Query calls via Rest
 */
export class QueryService<T> {
  public http: AxiosInstance;
  public meta: MetaService;
  public records: any[] = [];
  public parameters: any = {
    fields: ['id'],
    orderBy: ['-dateAdded'],
    start: 0,
    count: 10,
  };
  protected _page: number = 0;
  protected _endpoint: string;
  protected _lastResponse: BullhornListResponse<T>;
  private readonly initialized: Promise<unknown>;

  /**
   * constructor description
   * @param endpoint - Base Url for all relative http calls eg. 'query/JobOrder'
   */
  constructor(public entity: string) {
    this.initialized = this.initialize();
    this.meta = new MetaService(entity);
  }

  async initialize() {
    this.http = await Staffing.http();
  }

  get endpoint(): string {
    return this._endpoint || `query/${this.entity}`;
  }
  set endpoint(value: string) {
    this._endpoint = value;
  }

  // tslint:disable-next-line:promise-function-async
  get total(): Promise<number> {
    return this.initialized.then(() => {
      if (this._lastResponse && this._lastResponse.total) {
        return Promise.resolve(this._lastResponse.total);
      }
      return this.http
        .get(this.endpoint, { params: { fields: 'id', count: 0, ...this.parameters } })
        .then((response: AxiosResponse) => response.data)
        .then((result: BullhornListResponse<T>) => {
          return result.total || 0;
        });
    });
  }

  get snapshot(): BullhornListResponse<T> {
    return this._lastResponse;
  }

  fields(...args) {
    this.parameters.fields = args[0] instanceof Array ? args[0] : args;
    return this;
  }
  sort(...args) {
    this.parameters.orderBy = args[0] instanceof Array ? args[0] : args;
    return this;
  }
  where(value: any) {
    return this.query(Where.toQuerySyntax(value));
  }
  query(value: any) {
    this.parameters.where = value;
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
  async nextpage(): Promise<BullhornListResponse<T>> {
    return this.page(++this._page).run(true);
  }
  params(object) {
    this.parameters = { ...this.parameters, ...object };
    return this;
  }
  async get(add): Promise<BullhornListResponse<T>> {
    return this.run(add);
  }
  async run(add): Promise<BullhornListResponse<T>> {
    await this.initialized;
    return Promise.all([this.http.get(this.endpoint, { params: this.parameters }), this.meta.getFull(this.parameters.fields, this.parameters.layout)])
      .then(([response, metadata]) => [response.data, metadata])
      .then(([result, metadata]: [BullhornListResponse<T>, BullhornMetaResponse]) => {
        this._lastResponse = result;
        const records = result.data;
        if (add) {
          this.records = this.records.concat(records);
        } else {
          this.records = records;
        }
        result.meta = metadata;
        return result;
      });
  }
  async then(done: any, fail?: any): Promise<any> {
    return this.run(false).then(done, fail);
  }
}
