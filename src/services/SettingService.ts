import { AxiosInstance, AxiosResponse } from 'axios';
import { BullhornAllSettingsAndEntitlementsResponse } from '../types';
import { Staffing } from './Staffing';

/**
 * A Class that defines a service to grab settings from Bullhorn
 */
export class SettingService {
  http: AxiosInstance;

  constructor() {
    this.http = Staffing.http();
  }

  async getSettings(settings: string[]): Promise<{ [key: string]: any }> {
    let response: AxiosResponse = await this.http.get(`settings/${settings.join()}`);
    let result: { [key: string]: any } = response.data;
    return result;
  }

  async getEntitlements(entity: string): Promise<string[]> {
    let response: AxiosResponse = await this.http.get(`entitlements/${entity}`);
    let entitlements: string[] = response.data;
    return entitlements;
  }

  async getAllSettingsAndEntitlements(): Promise<BullhornAllSettingsAndEntitlementsResponse> {
    let response: AxiosResponse = await this.http.get('services/Settings/allEntitlementsAndSettings');
    let result: BullhornAllSettingsAndEntitlementsResponse = response.data;
    if (result && result.dashboardEntitlements && result.entitlements) {
      result.entitlements.DASHBOARD = result.dashboardEntitlements;
    }
    return result;
  }
}
