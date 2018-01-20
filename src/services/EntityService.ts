import { AxiosInstance, AxiosResponse } from 'axios';
import { BullhornEntityResponse, BullhornMetaResponse, BullhornSavedEntityResponse, Field } from '../types';
import { Staffing } from './Staffing';
import { MetaService } from './MetaService';

/**
 * A Class that defines the base Entity Model
 * @class Entity
 * @extends Model
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
    protected _fields: Array<string> = [];
    // Name of Entity
    public type: string;
    // The MetaService associated
    public meta: MetaService;

    /**
     * constructor
     * @param  {Object} state data to inflate object with
     * @return {[type]}       [description]
     */
    constructor(type: string) {
        this.type = type;
        this.endpoint = `entity/${this.type}/`;
        this.http = Staffing.http();
        this.meta = new MetaService(this.type);
        this.parameters = {
            fields: this._fields || ['id']
        };
    }

    /**
    * Define the fields to set or retrieve for the given entity. Getter and Setter methods will automagically
	* be set up on the entity once the fields are defined.
    * @name fields
	* @memberOf Entity#
	* @param {args} args - fields can either be sent as a list of arguments or as an Array
    * @return {this}
    */
    fields(...args: any[]) {
        let requested = Array.isArray(args[0]) ? args[0] : args;
        for (let field of requested) {
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
    * @name params
	* @memberOf Entity#
	* @param {Object} object - all additional parameters
    * @return {this}
    */
    params(object: any) {
        this.parameters = Object.assign(this.parameters, object);
        return this;
    }
    /**
    * Make http request to get entity. Objects 'data' property will be set to response, then promise will be resolved.
    * @name get
	* @memberOf Entity#
	* @param {Number} id - Id of the Model to retrieve
    * @return {Promise}
    */
    async get(id: number): Promise<BullhornEntityResponse<T>> {
        return Promise.all([
            this.http.get(this.endpoint + id, { params: this.parameters }),
            this.meta.getFull(this.parameters.fields, this.parameters.layout)
        ])
            .then(([response, meta]) => [response.data, meta])
            .then(([result, meta]: [BullhornEntityResponse<T>, BullhornMetaResponse]) => {
                result.meta = meta;
                return result;
            });
    }

    /**
    * Make http request to get entity. Objects 'data' property will be set to response, then promise will be resolved.
    * @name many
	* @memberOf Entity#
	* @param {string} property - The TO_MANY Association field
    * @param {Array} fields - Additional fields to retrieve on the TO_MANY field
    * @return {Promise}
    */
    // many(property: string, fields: Array<string>): Promise<AxiosResponse> {
    //     return this.http.get(`${this.endpoint}${this.value.id}/${property}`, {
    //         params: {
    //             fields: fields,
    //             showTotalMatched: true
    //         }
    //     }).then((response: AxiosResponse) => {
    //         if (!this.value.hasOwnProperty(property)) {
    //             Object.defineProperty(this, property, {
    //                 get: function getter() {
    //                     return this.value[property];
    //                 },
    //                 set: function setter(value) {
    //                     this.value[property] = value;
    //                 },
    //                 configurable: true,
    //                 enumerable: true
    //             });
    //         }

    //         this.value[property] = response.data;
    //         return response;
    //     });
    // }
    /**
    * Create or Updates the entity based on the presence of an 'id' property
    * @name save
	* @memberOf Entity#
	* @return {Promise}
    */
    save(value: any): Promise<AxiosResponse> {
        // Update
        if (value && value.id) {
            return this.http.post(this.endpoint + value.id, value);
        }
        // Create
        return this.http.put(this.endpoint, value);
    }
    /**
    * Sends a request to delete the entity
    * @name remove
	* @memberOf Entity#
	* @return {Promise}
    */
    async delete(id?: number): Promise<AxiosResponse> {
        return this.http.delete(this.endpoint + id);
    }
}
