import { AxiosInstance, AxiosResponse } from 'axios';
import { Cache } from '../utils';
import { BullhornMetaResponse, Field } from '../types';
import { Staffing } from './Staffing';

/**
* A Class that defines the base Meta Model
* @class Meta
* @param {string} endpoint - Base Url for all relative http calls eg. 'meta/JobOrder'
* @param {function} [parser] - Optional function to use to manipulate meta data returned
*/

export class MetaService {
    static BASIC: string = 'basic';
    static FULL: string = 'full';
    static TRACK: string = 'track';

    label: string;
    http: AxiosInstance;
    memory: any = {};
    fields: Field[] = [];
    parameters: any = {
        fields: '*',
        meta: 'full'
    };

    constructor(public entity: string) {
        this.http = Staffing.http();
        this.parse(Cache.get(this.endpoint) || { fields: [] });
    }

    get endpoint(): string {
        return `meta/${this.entity}`;
    }

    /**
    * Define how much meta data to return
    * @name style
	* @memberOf MetaService#
	* @param {string} value - 'basic', 'full', or 'track'
    * @return {this}
    */
    style(value: string = 'full'): MetaService {
        this.parameters.meta = value;
        return this;
    }

    /**
    * Will merge object into the entity's parameter to be sent in any http request.
    * @name params
	* @memberOf MetaService#
	* @param {Object} object - all additional parameters
    * @return {this}
    */
    params(object: any): MetaService {
        this.parameters = Object.assign(this.parameters, object);
        return this;
    }

    /**
    * Make http request to get meta data. Response data will be parsed, then the Promise will be resolved.
    * @name get
	* @memberOf MetaService#
	* @return {Promise}
    */
    get(requested: string[], layout?: string): Promise<Field[]> {
        let missing = this.missing(requested);
        if (missing.length || layout) {
            // console.log('Fields', requested);
            this.parameters.fields = missing.join(',');
            if (layout) this.parameters.layout = layout;
            return this.http
                .get(this.endpoint, { params: this.parameters })
                .then((response: AxiosResponse) => response.data)
                .then((result: BullhornMetaResponse) => {
                    this.parse(result);
                    this.label = result.label;
                    requested = [...result.fields.map(x => x.name)];
                    return this.extract(requested);
                })
                .catch((message) => {
                    return Promise.reject(`Failed to get MetaData: ${message}`);
                });
        }
        return Promise.resolve(this.extract(requested));
    }

    getFull(requested: string[], layout?: string): Promise<BullhornMetaResponse> {
        return this.get(requested, layout).then((fields: Field[]) => {
            let full: BullhornMetaResponse = Cache.get(this.endpoint);
            full.fields = fields;
            return full;
        });
    }

    parse(result: any): void {
        if (result) {
            for (let field of result.fields) {
                // console.log('Parsing', field);
                if (!this.memory.hasOwnProperty(field.name)) {
                    Object.defineProperty(this, field.name, {
                        get: function getter() {
                            return this.memory[field.name];
                        },
                        set: function setter(value) {
                            this.memory[field.name] = value;
                        },
                        configurable: true,
                        enumerable: true
                    });
                }
                //let md:Field = field; // TODO: new MetaData(field);
                let exists = this.fields.find((f: any) => f.name === field.name);
                if (!exists) {
                    this.fields.push(field);
                }
                this.memory[field.name] = field;
            }
            this.fields.sort((a, b) => {
                let aa = a.sortOrder ? a.sortOrder : a.name;
                let bb = b.sortOrder ? b.sortOrder : b.name;
                if (aa > bb) return 1;
                if (bb > aa) return -1;
                return 0;
            });
            result.fields = this.fields;
            Cache.put(this.endpoint, result);
        }
    }

    missing(fields): string[] {
        if (!this.memory) return fields;
        let result: string[] = [];
        for (let field of fields) {
            let cleaned: string = this._clean(field);
            let meta: any = this.memory[cleaned];
            if (!meta) {
                result.push(cleaned);
            }
        }
        return result;
    }

    _clean(name): string {
        return name.split('.')[0].split('[')[0].split('(')[0];
    }

    /**
    * Get specific meta data properties
    * @name extract
	* @memberOf MetaService#
	* @return {Array}
    */
    extract(fields: string[]): Field[] {
        if (!this.memory) return [];
        let result: Field[] = [];
        for (let field of fields) {
            let cleaned: string = this._clean(field);
            let meta: Field = this.memory[cleaned];
            if (meta) {
                if (meta.name === 'id') {
                    result.unshift(meta);
                } else {
                    result.push(meta);
                }
            }
        }
        return result;
    }

    static validate(): Promise<boolean> {
        return Staffing.http().get('/meta')
            .then((response: AxiosResponse) => response.data)
            .then((result: any[]) => {
                if (result && result) {
                    for (let meta of result) {
                        if (meta.dateLastModified) {
                            let item = Cache.get(`meta/${meta.entity}`);
                            if (item && item.dateLastModified !== meta.dateLastModified) {
                                Cache.remove(`meta/${meta.entity}`);
                            }
                        } else {
                            Cache.remove(`meta/${meta.entity}`);
                        }
                    }
                }
                return true;
            });
    }
}
