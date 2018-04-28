import { AxiosResponse } from 'axios';
// RXJS
import { StatefulSubject } from './StatefulSubject';
// Lib
import { BullhornEntityResponse, BullhornSavedEntityResponse } from '../types';
import { EntityService } from '../services';
import { EntityMessageBroker } from '../broker';
import { EntityOptions, observeOptions } from './EntityOptions';

export interface Identity {
    id?: number;
}

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
export class Entity<T extends Identity> extends StatefulSubject<T> {
    // Fields associated with this Entity
    protected _fields: string[] = [];
    // Entities will create proxy properties that return Observables to that property
    [propName: string]: any;
    // Name of Entity
    public type: string;
    // Meta of Entity
    public descriptor: any;
    // EntityService
    protected $entity: EntityService<T>;
    protected broker: EntityMessageBroker = EntityMessageBroker.getInstance();

    /**
     * constructor
     * @param  state data to inflate object with
     */
    constructor(type: string, options: EntityOptions = {}, state?: T) {
        super(state);
        this.type = type;
        this.$entity = new EntityService<T>(this.type);
        observeOptions(options).subscribe(params => {
            if (!params) {
                return;
            }
            for (const key of Object.keys(params)) {
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
                    default:
                        console.warn(`Unknown key in params: ${key}`);
                }
            }
            if (params.id) {
                this.get(params.id);
            }

        });
        if (this.hasValue()) {
            this.fields(Object.keys(this.value));
            this._setUpObservable(this.value);
        }
    }

    /**
     * Define the fields to set or retrieve for the given entity. Getter and Setter methods will automagically be set up on the entity once the fields are defined.
     * @param args - Fields can either be sent as a list of arguments or as an Array.
     */
    public fields(...args) {
        const requested = Array.isArray(args[0]) ? args[0] : args;
        for (const field of requested) {
            if (!this._fields.includes(field)) {
                this._proxy(field);
                this._fields.push(field);
            }
        }
        this.$entity.fields(...args);
        return this;
    }

    private _proxy(field) {
        const subject = new StatefulSubject(this.value && this.value[field]);
        Object.defineProperty(this, field, {
            get() {
                return subject;
            },
            set(value) {
                this.patch({ [field]: value });
                subject.next(value);
            },
            configurable: true,
            enumerable: true
        });
    }

    /**
     * Will merge object into the entity's parameter to be sent in any http request.
     * @param object - all additional parameters
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
     * @param data - packet of data to replace object with
     */
    set(value: any): Entity<T> {
        // This.value = Object.assign({ id: this.value.id }, data);
        // Let current = this.getValue();
        this.next(value);
        this.fields(Object.keys(value));
        this.broker.emit(`${this.type}:${value.id}:value`, value);
        return this;
    }
    /**
     * Used to update only properties sent in the packet
     * @param data - packet of data to update object with
     */
    patch(data: any, ignoreEvent: boolean = false): Entity<T> {
        const current: Object = this.value || {};
        const value = { ...current, ...data };
        this.next(value);
        this.fields(Object.keys(value));
        if (!ignoreEvent) {
            this.broker.emit(`${this.type}:${value.id}:value`, value);
        }
        return this;
    }
    /**
     * Make http request to get entity. Objects 'data' property will be set to response, then promise will be resolved.
     * @param id - Id of the Model to retrieve
     */
    get(id: number): Entity<T> {
        // tslint:disable-next-line:no-floating-promises
        this.$entity.get(id).then((result: BullhornEntityResponse<T>) => {
            this.descriptor = result.meta;
            this.patch(result.data);
            this._setUpObservable(this.getValue());
            return result;
        });
        return this;
    }
    // /**
    // * Make http request to get entity. Objects 'data' property will be set to response, then promise will be resolved.
    // * @param property - The TO_MANY Association field
    // * @param fields - Additional fields to retrieve on the TO_MANY field
    // */
    // Many(property: string, fields: Array<string>): Promise<AxiosResponse> {
    //     Return this.http.get(`${this.endpoint}${this.value.id}/${property}`, {
    //         Params: {
    //             Fields: fields,
    //             ShowTotalMatched: true
    //         }
    //     }).then((response: AxiosResponse) => {
    //         If (!this.value.hasOwnProperty(property)) {
    //             Object.defineProperty(this, property, {
    //                 Get: function getter() {
    //                     Return this.value[property];
    //                 },
    //                 Set: function setter(value) {
    //                     This.value[property] = value;
    //                 },
    //                 Configurable: true,
    //                 Enumerable: true
    //             });
    //         }
    //         This.value[property] = response.data;
    //         Return response;
    //     });
    // }

    /**
     * Create or Updates the entity based on the presence of an 'id' property
     */
    async save(): Promise<AxiosResponse> {
        return this.$entity.save(this.value).then((response: AxiosResponse) => {
            const content: BullhornSavedEntityResponse<T> = response.data as BullhornSavedEntityResponse<T>;
            this.patch({ id: content.changedEntityId });
            this._setUpObservable(this.getValue());
            return response;
        });
    }

    /**
     * Sends a request to delete the entity
     */
    async remove(): Promise<AxiosResponse> {
        return this.$entity.delete(this.value.id);
    }

    private _setUpObservable(state: { id?: number }) {
        if (!state || !state.id) {
            return;
        }
        this.broker.on(`${this.type}:${state.id}:value`).subscribe(value => {
            this.patch(value, true);
        });
    }
}
