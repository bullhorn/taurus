import { Observable, Observer, of, combineLatest } from 'rxjs';
import { isObservable } from 'rxjs/internal/util/isObservable';
import { auditTime } from 'rxjs/operators';
import { is, can } from '../utils';

export type Primitive = number | string | boolean | string[] | Object;

export interface SerializedOptions {
  [key: string]: any;
  id?: number;
  fields?: string[];
  layout?: string;
  meta?: string;
  showEditable?: boolean;
  showReadOnly?: boolean;
  executeFormTriggers?: boolean;
  params?: Object;
}

export interface EntityOptions {
  [key: string]: any;
  id?: number | Observable<number>;
  fields?: string[] | Observable<string[]>;
  layout?: string | Observable<string>;
  meta?: string | Observable<string>;
  showEditable?: boolean | Observable<boolean>;
  showReadOnly?: boolean | Observable<boolean>;
  executeFormTriggers?: boolean | Observable<boolean>;
  params?: Object | Observable<Object>;
}

// tslint:disable-next-line:only-arrow-functions
export function observeOptions(options: EntityOptions, audit: boolean = true): Observable<SerializedOptions | null> {
  if (!is(options).defined) {
    return of(null);
  }

  return new Observable((observer: Observer<SerializedOptions>) => {
    let combined = combineLatest([
      getOrCreateObservable('id', options),
      getOrCreateObservable('fields', options),
      getOrCreateObservable('layout', options),
      getOrCreateObservable('meta', options),
      getOrCreateObservable('showEditable', options),
      getOrCreateObservable('showReadOnly', options),
      getOrCreateObservable('executeFormTriggers', options),
      getOrCreateObservable('params', options),
    ]);
    if (audit) {
      combined = combined.pipe(auditTime(0));
    }
    combined.subscribe(([id, fields, layout, meta, editable, readOnly, triggers, params]: [number, string[], string, string, boolean, boolean, boolean, Object]) => {
      const serializedOptions: SerializedOptions = {};

      if (id !== undefined) {
        serializedOptions.id = id;
      }

      if (fields !== undefined) {
        serializedOptions.fields = fields;
      }

      if (layout !== undefined) {
        serializedOptions.layout = layout;
      }

      if (meta !== undefined) {
        serializedOptions.meta = meta;
      }

      if (editable !== undefined) {
        serializedOptions.showEditable = editable;
      }

      if (readOnly !== undefined) {
        serializedOptions.showReadOnly = readOnly;
      }

      if (triggers !== undefined) {
        serializedOptions.executeFormTriggers = triggers;
      }

      if (params !== undefined) {
        serializedOptions.params = params;
      }

      observer.next(serializedOptions);
    });
  });
}

export function getOrCreateObservable(key: string, options: EntityOptions): Observable<Primitive> {
  if (isObservable(options[key])) {
    return options[key];
  }
  if (can(options).have(key)) {
    return new Observable<Primitive>((subscriber) => {
      subscriber.next(options[key]);
    });
  }
  return new Observable<Primitive>((subscriber) => {
    subscriber.next(undefined);
  });
}
