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
        const response: AxiosResponse = await this.http.get(`settings/${settings.join()}`);
        return response.data;
    }

    async getEntitlements(entity: string): Promise<string[]> {
        const response: AxiosResponse = await this.http.get(`entitlements/${entity}`);
        return response.data;
    }

    async getAllSettingsAndEntitlements(): Promise<BullhornAllSettingsAndEntitlementsResponse> {
        const response: AxiosResponse = await this.http.get('services/Settings/allEntitlementsAndSettings');
        const result: BullhornAllSettingsAndEntitlementsResponse = response.data;
        if (result && result.dashboardEntitlements && result.entitlements) {
            result.entitlements.Dashboard = result.dashboardEntitlements;
        }
        return result;
    }
}
