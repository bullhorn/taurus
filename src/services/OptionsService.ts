import { AxiosInstance } from 'axios';
import { BullhornListResponse, FieldMapOption } from '../types';
import { Staffing } from './Staffing';

/**
 * A base class for making Options calls via Rest
 */
export class OptionsService {
  public http: AxiosInstance;
  public records: any[] = [];
  public parameters: any = {
    filter: undefined,
    start: 0,
    count: 10,
  };
  protected _page: number = 0;
  protected _endpoint: string;
  protected _lastResponse: BullhornListResponse<FieldMapOption>;
  /**
   * constructor description
   * @param endpoint - Base Url for all relative http calls eg. 'options/JobOrder'
   */
  constructor(public optionType: string) {
    this.http = Staffing.http();
  }
  get endpoint(): string {
    return this._endpoint || `options/${this.optionType}`;
  }
  set endpoint(value: string) {
    this._endpoint = value;
  }

  get snapshot(): BullhornListResponse<FieldMapOption> {
    return this._lastResponse;
  }

  filter(value: string) {
    this.parameters.filter = value;
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
  async nextpage(): Promise<BullhornListResponse<FieldMapOption>> {
    return this.page(++this._page).run(true);
  }
  params(object) {
    this.parameters = { ...this.parameters, ...object };
    return this;
  }
  async get(add): Promise<BullhornListResponse<FieldMapOption>> {
    return this.run(add);
  }
  async run(add): Promise<BullhornListResponse<FieldMapOption>> {
    return this.http
      .get(this.endpoint, { params: this.parameters })
      .then((response) => response.data)
      .then((result: BullhornListResponse<FieldMapOption>) => {
        this._lastResponse = result;
        const records = result.data;
        if (add) {
          this.records = this.records.concat(records);
        } else {
          this.records = records;
        }
        return result;
      })
      .catch((message) => {
        return message;
      });
  }
  async then(done: any, fail?: any): Promise<any> {
    return this.run(false).then(done, fail);
  }
}
