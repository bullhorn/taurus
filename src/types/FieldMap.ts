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

export enum DataType {
  Boolean = 'Boolean',
  String = 'String',
  Integer = 'Integer',
  Address = 'Address',
  Date = 'Date',
  AddressWithStateID = 'AddressWithStateID',
  Timestamp = 'Timestamp',
  Double = 'Double',
  BigDecimal = 'BigDecimal',
}

export enum DataSpecialization {
  SYSTEM = "SYSTEM",
  ADDRESS_BLOCK = "ADDRESS_BLOCK",
  DATE = "DATE",
  DATETIME = "DATETIME",
  FLOAT = "FLOAT",
  HTML = "HTML",
  INTEGER = "INTEGER",
  MONEY = "MONEY",
  STATE_ID = "STATE_ID"
}

export interface FieldMapOption {
  value?: any;
  label?: string;
  readOnly?: boolean;
}

export interface FieldMap {
  name: string;
  type?: FieldType | string;
  dataType?: DataType | string;
  dataSpecialization?: DataSpecialization | string;
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
  fields?: FieldMap[];
  shouldAddCustomEntityLabel?: boolean;
}

export interface FieldLayout {
  name: string;
  label: string;
  enabled: boolean;
  fields: string[];
}
