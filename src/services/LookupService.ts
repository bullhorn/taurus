import { AxiosInstance } from 'axios';
import { BullhornLookupItem } from '../types';
import { Staffing } from './Staffing';

export interface LookupOptions {
  entity?: string[];
  filter?: string;
  count?: number;
  isCountPerEntity?: boolean;
}

/**
 * A base class for making Options calls via Rest
 */
export class LookupService {
  public http: AxiosInstance;
  public records: BullhornLookupItem[] = [];
  public parameters: any = {
    entity: [],
    filter: undefined,
    count: 10,
    isCountPerEntity: true,
  };
  protected _endpoint: string;
  private readonly initialized: Promise<unknown>;
  /**
   * constructor description
   * @param endpoint - Base Url for all relative http calls eg. 'options/JobOrder'
   */
  constructor(public types: string[], private readonly options: LookupOptions = {}) {
    this.initialized = this.initialize();
    this.params({ entity: this.types, ...this.options });
  }

  async initialize() {
    this.http = await Staffing.http();
  }

  get endpoint(): string {
    return this._endpoint || 'lookup/expanded';
  }
  set endpoint(value: string) {
    this._endpoint = value;
  }
  filter(value: string) {
    this.parameters.filter = value;
    return this;
  }
  count(value: number) {
    this.parameters.count = value;
    return this;
  }
  params(object: LookupOptions) {
    this.parameters = { ...this.parameters, ...object };
    return this;
  }
  async get(): Promise<BullhornLookupItem[]> {
    return this.run();
  }
  async run(): Promise<BullhornLookupItem[]> {
    await this.initialized;
    return this.http
      .get(this.endpoint, { params: this.parameters })
      .then((response) => response.data)
      .then((result: BullhornLookupItem[]) => {
        this.records = result;
        return result;
      })
      .catch((message) => {
        return message;
      });
  }
  async then(done: any, fail?: any): Promise<any> {
    return this.run().then(done, fail);
  }
}
