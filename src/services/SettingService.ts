import { AxiosInstance, AxiosResponse } from 'axios';
import { BullhornAllSettingsAndEntitlementsResponse } from '../types';
import { Staffing } from './Staffing';
import { Cache } from '../utils';

/**
 * A Class that defines a service to grab settings from Bullhorn
 */
export class SettingService {
  http: AxiosInstance;
  private readonly initialized: Promise<unknown>;
  private readonly allSettingsAndEntitlementsEndpoint: string = 'services/Settings/allEntitlementsAndSettings';

  constructor() {
    this.initialized = this.initialize();
  }

  async initialize() {
    this.http = await Staffing.http();
  }

  async getSettings(settings: string[]): Promise<{ [key: string]: any }> {
    await this.initialized;
    const response: AxiosResponse = await this.http.get(`settings/${settings.join()}`);
    return response.data;
  }

  async getEntitlements(entity: string): Promise<string[]> {
    await this.initialized;
    const response: AxiosResponse = await this.http.get(`entitlements/${entity}`);
    return response.data;
  }

  async getAllSettingsAndEntitlements(cached: boolean = false): Promise<BullhornAllSettingsAndEntitlementsResponse> {
    await this.initialized;
    let result: BullhornAllSettingsAndEntitlementsResponse;

    if (cached && await Cache.has(this.allSettingsAndEntitlementsEndpoint)) {
      result = await Cache.get(this.allSettingsAndEntitlementsEndpoint);
    } else {
      const response: AxiosResponse = await this.http.get(this.allSettingsAndEntitlementsEndpoint);
      result = response.data;
      if (cached) {
        // tslint:disable-next-line:no-floating-promises
        Cache.put(this.allSettingsAndEntitlementsEndpoint, result);
      }
    }

    if (result && result.dashboardEntitlements && result.entitlements) {
      result.entitlements.Dashboard = result.dashboardEntitlements;
    }
    return result;
  }
}
