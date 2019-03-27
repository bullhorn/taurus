import { AxiosInstance, AxiosResponse } from 'axios';
import { Cache } from '../utils';
import { BullhornMetaResponse, FieldMap, FieldLayout, BullhornTrack, BullhornSectionHeader } from '../types';
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
  fields: FieldMap[] = [];
  layouts: FieldLayout[] = [];
  tracks: BullhornTrack[] = [];
  sectionHeaders: BullhornSectionHeader[] = [];
  trackTrigger: string;
  allFieldsLoaded: boolean = false;
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

  private setFieldsOnLayout(meta: BullhornMetaResponse, targetLayout: string): number {
    if (meta && meta.layouts) {
      const foundLayoutIndex: number = meta.layouts.findIndex((layout: FieldLayout) => layout.name === targetLayout);
      if (foundLayoutIndex > -1) {
        meta.layouts[foundLayoutIndex].fields = meta.fields.map((field: FieldLayout) => field.name);
      }
      return foundLayoutIndex;
    }
    return -1;
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
  async get(requested: string[], layout?: string): Promise<FieldMap[]> {
    const missing = this.missing(requested);

    if (missing.length || layout) {
      this.parameters.fields = missing.join(',');
      if (layout) {
        this.parameters.layout = layout;
      }
      const response: AxiosResponse = await this.http.get(this.endpoint, { params: this.parameters });
      const result: BullhornMetaResponse = response.data;
      this.allFieldsLoaded = requested[0] === '*';
      this.parse(result);
      this.label = result.label;
      return this.extract(requested);
    }
    return this.extract(requested);
  }

  async getAllLayouts(): Promise<any[]> {
    if (this.allFieldsLoaded) {
      return this.layouts;
    }
    const response: AxiosResponse = await this.http.get(this.endpoint, { params: { meta: 'full', includeLayoutFields: true } });
    this.parse(response.data);
    return response.data.layouts;
  }

  async getFull(requested: string[], layout?: string): Promise<BullhornMetaResponse> {
    const fields: FieldMap[] = await this.get(requested);
    const layoutFields: FieldMap[] = layout ? await this.getByLayout(layout) : [];
    const full: BullhornMetaResponse = Cache.get(this.endpoint);
    full.fields = [...fields, ...layoutFields];
    return full;
  }

  async getByLayout(layout: string, keepFieldsFromLayout: boolean = true): Promise<FieldMap[]> {
    const exists = this.layouts.find((l: any) => l.name === layout);
    if (!exists || !exists.hasOwnProperty('fields')) {
      this.parameters.layout = layout;
      delete this.parameters.fields;
      const response: AxiosResponse = await this.http.get(this.endpoint, { params: this.parameters });
      const result: BullhornMetaResponse = response.data;
      const foundLayoutIndex: number = this.setFieldsOnLayout(result, layout);
      this.label = result.label;
      this.parse(result, keepFieldsFromLayout);
      if (foundLayoutIndex > -1) {
        this.layouts.splice(foundLayoutIndex, 1, {
          name: layout,
          label: layout,
          enabled: true,
          fields: result.layouts[foundLayoutIndex].fields,
        });
      } else {
        this.layouts.push({
          name: layout,
          label: layout,
          enabled: true,
          fields: result.fields.map((field: FieldLayout) => field.name),
        });
      }
      return Promise.resolve(result.fields);
    }
    return this.get(exists.fields);
  }

  parse(result: any, keepFieldsFromLayout: boolean = false): void {
    if (!result) {
      return;
    }
    if (result && result.fields) {
      for (const field of result.fields) {
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
    if (result && result.trackTrigger) {
      this.trackTrigger = result.trackTrigger;
      this.tracks = result.tracks;
    }
    if (result && result.sectionHeaders) {
      this.sectionHeaders = result.sectionHeaders;
    }
    result.fields = keepFieldsFromLayout ? result.fields : this.fields;
    result.layouts = this.layouts;
    result.trackTrigger = this.trackTrigger;
    result.tracks = this.tracks;
    result.sectionHeaders = this.sectionHeaders;

    result.allFieldsLoaded = result.allFieldsLoaded || this.allFieldsLoaded;
    this.allFieldsLoaded = result.allFieldsLoaded;
    Cache.put(this.endpoint, result);
  }

  missing(fields): string[] {
    if (!this.memory) {
      return fields;
    }
    if (fields && fields[0] === '*' && this.allFieldsLoaded) {
      return [];
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
  extract(fields: string[]): FieldMap[] {
    if (!this.memory) {
      return [];
    }
    if (fields && fields[0] === '*') {
      return Object.values(this.memory);
    }
    const result: FieldMap[] = [];
    for (const field of fields) {
      const cleaned: string = this._clean(field);
      const meta: FieldMap = this.memory[cleaned];
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
    return Promise.all([meta.get(['*']), meta.getAllLayouts()]);
  }
}
