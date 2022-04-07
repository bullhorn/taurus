/**
 * Enumeration of different field types associated with Bullhorn Data.
 */

export enum FieldType {
  ID = 'ID',
  COMPOSITE = 'COMPOSITE',
  TO_ONE = 'TO_ONE',
  TO_MANY = 'TO_MANY',
  SCALAR = 'SCALAR',
}

export interface FieldMapOption {
  value?: any;
  label?: string;
  readOnly?: boolean;
}

export interface FieldMap {
  name: string;
  type?: FieldType | string;
  dataType?: string;
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
  options?: FieldMapOption[];
  hideFromSearch?: boolean;
  sortOrder?: number;
  hint?: string;
  description?: string;
  associatedEntity?: any;
  value?: any;
  interactions?: any[];
  defaultValue?: any;
  systemRequired?: boolean;
  disabled?: boolean;
}

export interface FieldLayout {
  name: string;
  label: string;
  enabled: boolean;
  fields: string[];
}
