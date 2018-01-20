import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';
import { Operator } from 'rxjs/Operator';
import { Observer } from 'rxjs/Observer';
import { combineLatest } from 'rxjs/operator/combineLatest';
import { merge } from 'rxjs/operator/merge';
import { map } from 'rxjs/operator/map';
import { auditTime } from 'rxjs/operator/auditTime';
import { Primitive, getOrCreateObservable } from './EntityOptions';
import { is, can } from '../utils';

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
}

export interface EntityListOptions {
    [key: string]: any;
    fields?: string[] | Observable<string[]>;
    layout?: string | Observable<string>;
    meta?: string | Observable<string>;
    orderBy?: string | Observable<string>;
    startAt?: number | Observable<number>;
    limitTo?: number | Observable<number>;
    filter?: Object | Observable<Object>;
    params?: Object | Observable<Object>;
}

export function observeListOptions(options: EntityListOptions, audit: boolean = true): Observable<SerializedListOptions | null> {
    if (!is(options).defined) {
        return observableOf(null);
    }

    return Observable.create((observer: Observer<SerializedListOptions>) => {
        let combined = combineLatest.call(
            getOrCreateObservable('fields', options),
            getOrCreateObservable('layout', options),
            getOrCreateObservable('meta', options),
            getOrCreateObservable('orderBy', options),
            getOrCreateObservable('startAt', options),
            getOrCreateObservable('limitTo', options),
            getOrCreateObservable('filter', options),
            getOrCreateObservable('params', options)
        );
        if (audit) {
            combined = auditTime.call(combined, 0);
        }
        combined
            .subscribe(([fields, layout, meta, orderBy, startAt, limitTo, filter, params]: [string[], string, string, string, number, number, Object, Object]) => {

                let serializedOptions: SerializedListOptions = {};

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

                observer.next(serializedOptions);
            });
    });
}
