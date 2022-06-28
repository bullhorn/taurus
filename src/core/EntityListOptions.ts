import { combineLatest, Observable, Observer, of } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { is } from '../utils';
import { getOrCreateObservable } from './EntityOptions';

export interface SerializedListOptions {
  [key: string]: any;
  fields?: string[];
  layout?: string;
  meta?: string;
  orderBy?: string;
  startAt?: number;
  limitTo?: number;
  filter?: Object;
  params?: Object;
  where?: { query: string; form: any };
}

export interface EntityListOptions {
  [key: string]: any;
  fields?: string[] | Observable<string[]>;
  layout?: string | Observable<string>;
  meta?: string | Observable<string>;
  orderBy?: string | Observable<string> | any;
  startAt?: number | Observable<number>;
  limitTo?: number | Observable<number>;
  filter?: Object | Observable<Object>;
  params?: Object | Observable<Object>;
  where?: { query: string; form: any } | Observable<{ query: string; form: any }>;
}

// tslint:disable-next-line:only-arrow-functions
export function observeListOptions(options: EntityListOptions, audit: boolean = true): Observable<SerializedListOptions | null> {
  if (!is(options).defined) {
    return of(null);
  }

  return new Observable((observer: Observer<SerializedListOptions>) => {
    let combined = combineLatest([
      getOrCreateObservable('fields', options),
      getOrCreateObservable('layout', options),
      getOrCreateObservable('meta', options),
      getOrCreateObservable('orderBy', options),
      getOrCreateObservable('startAt', options),
      getOrCreateObservable('limitTo', options),
      getOrCreateObservable('filter', options),
      getOrCreateObservable('params', options),
      getOrCreateObservable('where', options),
    ]);
    if (audit) {
      combined = combined.pipe(auditTime(0));
    }
    combined.subscribe(([fields, layout, meta, orderBy, startAt, limitTo, filter, params, where]: [string[], string, string, string, number, number, Object, Object, { query: string; form: any }]) => {
      const serializedOptions: SerializedListOptions = {};

      if (fields !== undefined) {
        serializedOptions.fields = fields;
      }

      if (layout !== undefined) {
        serializedOptions.layout = layout;
      }

      if (meta !== undefined) {
        serializedOptions.meta = meta;
      }

      if (orderBy !== undefined) {
        serializedOptions.orderBy = orderBy;
      }

      if (startAt !== undefined) {
        serializedOptions.startAt = startAt;
      }

      if (limitTo !== undefined) {
        serializedOptions.limitTo = limitTo;
      }

      if (filter !== undefined) {
        serializedOptions.filter = filter;
      }

      if (params !== undefined) {
        serializedOptions.params = params;
      }

      if (where !== undefined) {
        serializedOptions.where = where;
      }

      observer.next(serializedOptions);
    });
  });
}
