import { FieldMap, FieldLayout } from './FieldMap';

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

export interface BullhornLayout {
  enabled: boolean;
  fields: string[];
  label: string;
  name: string;
}

export interface BullhornSectionHeader {
  label: string;
  name: string;
  sortOrder: number;
  enabled: boolean;
}
export interface BullhornTrack {
  name: string;
  values: string[];
}

export interface BullhornLookupItem {
  searchEntity: string;
  [key: string]: any;
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
  fields: FieldMap[];
  layouts: FieldLayout[];
  trackTrigger: string;
  tracks: BullhornTrack[];
  sectionHeaders: BullhornSectionHeader[];
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

export interface BullhornSubscriptionEvent{
    eventId: string;
    eventType: 'ENTITY' | 'FIELDMAPCHANGE' | 'JOBMATCHSEARCH';
    entityName: string;
    eventMetadata: any;
    updatedProperties: string[];
    entityEventType: 'INSERTED' | 'UPDATED' | 'DELETED';
    eventTimestamp: number;
    entityId: number;
}

export interface BullhornSubscriptionResponse {
    result?: any;
    requestId?: number;
    lastRequestId?: number;
    subscriptionId?: string;
    createdOn?: number;
    events?: BullhornSubscriptionEvent[];
    jmsSelector?: string;
}
