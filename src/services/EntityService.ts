import { AxiosInstance, AxiosResponse } from 'axios';
import { BullhornEntityResponse, BullhornListResponse } from '../types';
import { Staffing } from './Staffing';
import { MetaService } from './MetaService';

/**
 * A Class that defines the base Entity Model
 * @example
 * ```
 * //Most methods on the entity are fluent (chainable)
 * var job = new Entity('JobOrder').fields('title');
 * //the 'fields' function created a getter and setter for 'title'
 * job.title = 'My New Job';
 * job.save();
 * ```
 */
export class EntityService<T> {
  // The relative url where this entity lives
  protected endpoint: string;
  protected http: AxiosInstance;
  protected parameters: any;
  // Fields associated with this Entity
  protected _fields: string[] = [];
  // Name of Entity
  public type: string;
  // The MetaService associated
  public meta: MetaService;
  private readonly initialized: Promise<unknown>;

  /**
   * constructor
   * @param  state data to inflate object with
   */
  constructor(type: string, callingIdentifier: string = '') {
    this.type = type;
    this.endpoint = `entity/${this.type}`;
    this.meta = new MetaService(this.type, callingIdentifier);
    this.parameters = {
      fields: this._fields || ['id'],
    };
    this.initialized = this.initialize(callingIdentifier);
  }

  async initialize(callingIdentifier: string = '') {
    this.http = await Staffing.http(callingIdentifier);
  }

  /**
   * Define the fields to set or retrieve for the given entity. Getter and Setter methods will automagically be set up on the entity once the fields are defined.
   * @param args - fields can either be sent as a list of arguments or as an Array
   */
  fields(...args: any[]) {
    const requested = Array.isArray(args[0]) ? args[0] : args;
    for (const field of requested) {
      if (!this._fields.includes(field)) {
        this._fields.push(field);
      }
    }
    if (!this.parameters) {
      this.parameters = {};
    }
    this.parameters.fields = this._fields;
    return this;
  }

  /**
   * Will merge object into the entity's parameter to be sent in any http request.
   * @param object - all additional parameters
   */
  params(object: any) {
    this.parameters = { ...this.parameters, ...object };
    return this;
  }

  /**
   * Make http request to get entity. Objects 'data' property will be set to response, then promise will be resolved.
   * @param id - Id of the Model to retrieve
   */
  async get(id: number): Promise<BullhornEntityResponse<T>> {
    await this.initialized;
    const [response, meta] = await Promise.all([this.http.get(`${this.endpoint}/${id}`, { params: this.parameters }), this.meta.getFull(this.parameters.fields, this.parameters.layout)]);
    const result: BullhornEntityResponse<T> = response.data;
    result.meta = meta;
    return result;
  }

  /**
   * Make http request to get entity with recordedit layout. Objects 'data' property will be set to response, then promise will be resolved.
   * @param id - Id of the Model to retrieve
   */
  async edit(id: number): Promise<BullhornEntityResponse<T>> {
    await this.initialized;
    const layout = 'RecordEdit';
    const params = { ...this.parameters, layout };
    delete params.fields;
    const [response, meta] = await Promise.all([this.http.get(`${this.endpoint}/${id}`, { params }), this.meta.getFull(this.parameters.fields, layout)]);
    const result: BullhornEntityResponse<T> = response.data;
    result.meta = meta;
    return result;
  }

  /**
   * Make http request to get entity's full toMany relationship for a property.
   * @param property - The TO_MANY Association field
   * @param fields - Additional fields to retrieve on the TO_MANY field
   */
  async many(property: string, fields: string[], value: any, params: any = {}): Promise<BullhornListResponse<any>> {
    await this.initialized;
    const toManyData = await this.http.get(`${this.endpoint}/${value.id}/${property}`, {
      params: {
        fields,
        showTotalMatched: true,
        ...params,
      },
    });
    return toManyData.data;
  }

  /**
   * Create or Updates the entity based on the presence of an 'id' property
   */
  async save(value: any): Promise<AxiosResponse> {
    // Update
    await this.initialized;
    if (value && value.id) {
      return this.http.post(`${this.endpoint}/${value.id}`, value);
    }
    // Create
    return this.http.put(this.endpoint, value);
  }
  /**
   * Sends a request to delete the entity
   */
  async delete(id?: number): Promise<AxiosResponse> {
    await this.initialized;
    return this.http.delete(`${this.endpoint}/${id}`);
  }
}
