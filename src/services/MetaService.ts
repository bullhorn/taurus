import { AxiosInstance, AxiosResponse } from 'axios';
import { Cache } from '../utils';
import { BullhornMetaResponse, Field, Layout } from '../types';
import { Staffing } from './Staffing';

/**
 * A Class that defines the base Meta Model
 * @param endpoint - Base Url for all relative http calls eg. 'meta/JobOrder'
 * @param [parser] - Optional function to use to manipulate meta data returned
 */
export class MetaService {
    static BASIC: string = 'basic';
    static FULL: string = 'full';
    static TRACK: string = 'track';

    label: string;
    http: AxiosInstance;
    memory: any = {};
    fields: Field[] = [];
    layouts: Layout[] = [];
    parameters: any = {
        fields: '*',
        meta: 'full',
    };

    constructor(public entity: string) {
        this.http = Staffing.http();
        this.parse(Cache.get(this.endpoint) || { fields: [], layouts: [] });
    }

    get endpoint(): string {
        return `meta/${this.entity}`;
    }

    /**
     * Define how much meta data to return
     */
    style(value: string = 'full'): MetaService {
        this.parameters.meta = value;
        return this;
    }

    /**
     * Will merge object into the entity's parameter to be sent in any http request.
     * @param object - all additional parameters
     */
    params(object: any): MetaService {
        this.parameters = { ...this.parameters, ...object };
        return this;
    }

    /**
     * Make http request to get meta data. Response data will be parsed, then the Promise will be resolved.
     */
    async get(requested: string[], layout?: string): Promise<Field[]> {
        const missing = this.missing(requested);
        if (missing.length || layout) {
            // Console.log('Fields', requested);
            this.parameters.fields = missing.join(',');
            if (layout) {
                this.parameters.layout = layout;
            }
            const response: AxiosResponse = await this.http.get(this.endpoint, { params: this.parameters });
            const result: BullhornMetaResponse = response.data;
            this.parse(result);
            this.label = result.label;
            return this.extract([...result.fields.map((x: Field) => x.name)]);
        }
        return this.extract(requested);
    }

    async getAllLayouts(): Promise<any[]> {
        const response: AxiosResponse = await this.http.get(this.endpoint, { params: { meta: 'full', includeLayoutFields: true } });
        this.parse(response.data);
        return response.data.layouts;
    }

    async getFull(requested: string[], layout?: string): Promise<BullhornMetaResponse> {
        const fields: Field[] = await this.get(requested);
        const layoutFields: Field[] = layout ? await this.getByLayout(layout) : [];
        const full: BullhornMetaResponse = Cache.get(this.endpoint);
        full.fields = [...fields, ...layoutFields];
        return full;
    }

    async getByLayout(layout: string): Promise<Field[]> {
        const exists = this.layouts.find((l: any) => l.name === layout);
        if (!exists) {
            this.parameters.layout = layout;
            delete this.parameters.fields;
            const response: AxiosResponse = await this.http.get(this.endpoint, { params: this.parameters });
            const result: BullhornMetaResponse = response.data;
            this.label = result.label;
            this.layouts.push({
                name: layout,
                label: layout,
                enabled: true,
                fields: result.fields.map(f => f.name)
            });
            return Promise.resolve(result.fields);
        }
        return this.get(exists.fields);
    }

    parse(result: any): void {
        if (!result) {
            return;
        }
        if (result && result.fields) {
            for (const field of result.fields) {
                // Console.log('Parsing', field);
                if (!this.memory.hasOwnProperty(field.name)) {
                    Object.defineProperty(this, field.name, {
                        get() {
                            return this.memory[field.name];
                        },
                        set(value) {
                            this.memory[field.name] = value;
                        },
                        configurable: true,
                        enumerable: true,
                    });
                }
                // Let md:Field = field; // TODO: new MetaData(field);
                const exists = this.fields.find((f: any) => f.name === field.name);
                if (!exists) {
                    this.fields.push(field);
                }
                this.memory[field.name] = field;
            }
            this.fields.sort((a, b) => {
                const aa = a.sortOrder ? a.sortOrder : a.name;
                const bb = b.sortOrder ? b.sortOrder : b.name;
                if (aa > bb) {
                    return 1;
                }
                if (bb > aa) {
                    return -1;
                }
                return 0;
            });
        }
        if (result && result.layouts) {
            for (const layout of result.layouts) {
                const exists = this.layouts.find((l: any) => l.name === layout.name);
                if (!exists) {
                    this.layouts.push(layout);
                } else if (layout.fields) {
                    exists.fields = layout.fields;
                }
            }
        }
        result.fields = this.fields;
        result.layouts = this.layouts;
        Cache.put(this.endpoint, result);
    }

    missing(fields): string[] {
        if (!this.memory) {
            return fields;
        }
        const result: string[] = [];
        for (const field of fields) {
            const cleaned: string = this._clean(field);
            const meta: any = this.memory[cleaned];
            if (!meta) {
                result.push(cleaned);
            }
        }
        return result;
    }

    _clean(name): string {
        return name
            .split('.')[0]
            .split('[')[0]
            .split('(')[0];
    }

    /**
     * Get specific meta data properties
     */
    extract(fields: string[]): Field[] {
        if (!this.memory) {
            return [];
        }
        const result: Field[] = [];
        for (const field of fields) {
            const cleaned: string = this._clean(field);
            const meta: Field = this.memory[cleaned];
            if (meta && meta.name === 'id') {
                result.unshift(meta);
            } else {
                result.push(meta);
            }
        }
        return result;
    }

    static async validate(): Promise<boolean> {
        const response: AxiosResponse = await Staffing.http().get('/meta');
        const result: any[] = response.data;
        if (result) {
            for (const meta of result) {
                if (meta.dateLastModified) {
                    const item = Cache.get(`meta/${meta.entity}`);
                    if (item && item.dateLastModified !== meta.dateLastModified) {
                        Cache.remove(`meta/${meta.entity}`);
                    }
                    continue;
                }
                Cache.remove(`meta/${meta.entity}`);
            }
        }
        return true;
    }

    static async preload(entity: string) {
        const meta: MetaService = new MetaService(entity);
        return Promise.all([
            meta.get(['*']),
            meta.getAllLayouts()
        ]);
    }
}
