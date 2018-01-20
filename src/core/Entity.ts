import { AxiosInstance, AxiosResponse } from 'axios';
// RXJS
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { StatefulSubject } from './StatefulSubject';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/take';
// Lib
import { BullhornEntityResponse, BullhornMetaResponse, BullhornSavedEntityResponse } from '../types';
import { EntityService } from '../services';
import { EntityMessageBroker } from '../broker';
import { EntityOptions, observeOptions } from './EntityOptions'

export interface Identity {
    id?: number;
}

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
export class Entity<T extends Identity> extends StatefulSubject<T> {
    // Fields associated with this Entity
    protected _fields: Array<string> = [];
    // Entities will create proxy properties that return Observables to that property
    [propName: string]: any;
    // Name of Entity
    public type: string;
    // Meta of Entity
    public descriptor: any;
    // EntityService
    protected $entity: EntityService<T>;
    protected broker: EntityMessageBroker = EntityMessageBroker.getInstance()

    /**
     * constructor
     * @param  {Object} state data to inflate object with
     * @return {[type]}       [description]
     */
    constructor(type: string, options: EntityOptions = {}, state?: T) {
        super(state);
        this.type = type;
        this.$entity = new EntityService<T>(this.type);
        observeOptions(options).subscribe((params) => {
            if (params) {
                for (let key of Object.keys(params)) {
                    switch (key) {
                        case 'fields':
                            this.fields(params.fields);
                            break;
                        case 'layout':
                            this.$entity.params({ layout: params.layout });
                            break;
                        case 'meta':
                            this.$entity.meta.style(params.meta);
                            break;
                        case 'showEditable':
                            this.$entity.params({ showEditable: params.showEditable });
                            break;
                        case 'showReadOnly':
                            this.$entity.params({ showReadOnly: params.showReadOnly });
                            break;
                        case 'executeFormTriggers':
                            this.$entity.params({ executeFormTriggers: params.executeFormTriggers });
                            break;
                        case 'params':
                            this.$entity.params(params.params);
                            break;
                    }
                }
                if (params.id) {
                    this.get(params.id);
                }
            }
        });
        if (this.hasValue()) {
            this.fields(Object.keys(this.value));
            this._setUpObservable(this.value);
        }
    }

    /**
    * Define the fields to set or retrieve for the given entity. Getter and Setter methods will automagically
	* be set up on the entity once the fields are defined.
    * @name fields
	* @memberOf Entity#
	* @param {args} args - fields can either be sent as a list of arguments or as an Array
    * @return {this}
    */
    fields(...args) {
        let requested = Array.isArray(args[0]) ? args[0] : args;
        for (let field of requested) {
            if (!this._fields.includes(field)) {
                this._proxy(field);
                this._fields.push(field);
            }
        }
        this.$entity.fields(...args);
        return this;
    }

    private _proxy(field) {
        let subject = new StatefulSubject(this.value && this.value[field]);
        Object.defineProperty(this, field, {
            get: function () {
                return subject;
            },
            set: function (value) {
                this.patch({ [field]: value });
                subject.next(value);
            },
            configurable: true,
            enumerable: true
        });
    }

    /**
    * Will merge object into the entity's parameter to be sent in any http request.
    * @name params
	* @memberOf Entity#
	* @param {Object} object - all additional parameters
    * @return {this}
    */
    params(object) {
        if (object.hasOwnProperty('fields')) {
            this.fields(object.fields);
            delete object.fields;
        }
        this.$entity.params(object);
        return this;
    }
    /**
    * Used to replace the current entitys source data
    * @name set
	* @memberOf Entity#
	* @param {any} data - packet of data to replace object with
    * @return {Promise}
    */
    set(value: any): Entity<T> {
        //this.value = Object.assign({ id: this.value.id }, data);
        //let current = this.getValue();
        this.next(value);
        this.fields(Object.keys(value));
        this.broker.emit(`${this.type}:${value.id}:value`, value);
        return this;
    }
    /**
    * Used to update only properties sent in the packet
    * @name patch
	* @memberOf Entity#
	* @param {any} data - packet of data to update object with
    * @return {Promise}
    */
    patch(data: any, ignoreEvent: boolean = false): Entity<T> {
        let current = this.value || {};
        let value = Object.assign(current, data);
        this.next(value);
        this.fields(Object.keys(value));
        if (!ignoreEvent) {
            this.broker.emit(`${this.type}:${value.id}:value`, value);
        }
        return this;
    }
    /**
    * Make http request to get entity. Objects 'data' property will be set to response, then promise will be resolved.
    * @name get
	* @memberOf Entity#
	* @param {Number} id - Id of the Model to retrieve
    * @return {Promise}
    */
    get(id: number): Entity<T> {
        this.$entity.get(id).then((result: BullhornEntityResponse<T>) => {
            this.descriptor = result.meta;
            this.patch(result.data);
            this._setUpObservable(this.getValue());
            return result;
        });
        return this;
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
    save(): Promise<AxiosResponse> {
        return this.$entity.save(this.value).then((response: AxiosResponse) => {
            let content: BullhornSavedEntityResponse<T> = response.data as BullhornSavedEntityResponse<T>;
            this.patch({ id: content.changedEntityId });
            this._setUpObservable(this.getValue());
            return response;
        });
    }

    /**
    * Sends a request to delete the entity
    * @name remove
	* @memberOf Entity#
	* @return {Promise}
    */
    remove(): Promise<AxiosResponse> {
        return this.$entity.delete(this.value.id);
    }

    private _setUpObservable(state: { id?: number }) {
        if (state.id) {
            this.broker.on(`${this.type}:${state.id}:value`).subscribe((value) => {
                this.patch(value, true);
            });
        }
    }
}
