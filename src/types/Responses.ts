import { Field } from './Field';
import { Option } from './Option';

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
    start?: string;
    count?: string;
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
