/**
 * Enumeration of different field types associated with Bullhorn Data.
 */
export interface FieldMapOption {
  value?: any;
  label?: string;
  readOnly?: boolean;
}

export interface FieldMap {
  name: string;
  type?: 'ID' | 'COMPOSITE' | 'TO_ONE' | 'TO_MANY' | 'SCALAR';
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
}

export interface FieldLayout {
  name: string;
  label: string;
  enabled: boolean;
  fields: string[];
}
