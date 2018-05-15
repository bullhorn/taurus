import { Field } from './Field';

export interface BullhornAllSettingsAndEntitlementsResponse {
  settings: { [key: string]: any };
  dashboardEntitlements: string[];
  entitlements: { [key: string]: string[] };
  userData: {
    id: number;
    masterUserID: number;
    userType: {
      id: number;
      name: string;
    };
    firstName: string;
    lastName: string;
    phone: string;
    mobile: string;
    useDefaultMailClient: boolean;
    email: string;
    address: {
      address1: string;
      address2: string;
      city: string;
      state: string;
      zip: string;
      countryID: string;
      countryName: string;
      countryCode: string;
    };
    departments: {
      total: number;
      data: { id: number; name: string }[];
    };
    srelease: boolean;
  };
}

export interface BullhornMessage {
  detailMessage: string;
  severity: string;
  type: string;
}

export interface BullhornErrorMessage {
  errorMessage: string;
  errorMessageKey: string;
  errorCode: number;
}

export interface BullhornMetaResponse {
  entity: string;
  entityMetaUrl: string;
  label: string;
  dateLastModified: number;
  fields: Field[];
}

export interface BullhornListResponse<T> {
  total?: number;
  start: string;
  count: string;
  data: T[];
  messages?: BullhornMessage[];
  meta?: BullhornMetaResponse;
}

export interface BullhornEntityResponse<T> {
  data: T[];
  messages?: BullhornMessage[];
  meta?: BullhornMetaResponse;
}

export interface BullhornSavedEntityResponse<T> {
  changedEntityType: string;
  changedEntityId: number;
  changeType: 'INSERT' | 'UPDATE';
  messages: string[];
  data: T;
}
