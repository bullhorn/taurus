/**
 * Enumeration of different field types associated with Bullhorn Data.
 */
export enum FieldType {
    ID,
    COMPOSITE,
    TO_ONE,
    TO_MANY,
    SCALAR
}

export interface FieldOptions {
    value?: any;
    label?: string;
}

export interface Field {
    name: string;
    type?: string;
    dataType?: FieldType;
    dataSpecialization?: string;
    maxLength?: number;
    confidential?: string;
    optional?: boolean;
    label?: string;
    required?: boolean;
    readOnly?: boolean;
    multiValue?: boolean;
    inputType?: string;
    optionsType?: string;
    optionsUrl?: string;
    options?: FieldOptions[];
    hideFromSearch?: boolean;
    sortOrder?: number;
    hint?: string;
    description?: string;
    associatedEntity?: any;
    value?: any;
    interactions?: any[];
}
