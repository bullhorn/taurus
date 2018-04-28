import { Observable, Subject, Subscription, ObjectUnsubscribedError } from 'rxjs';
import { take } from 'rxjs/operators';

export const EMPTY: Symbol = Symbol('EMPTY');

/**
 * Observable subject that may have an initial value
 */
export class StatefulSubject<T> extends Subject<T> {
    constructor(private _value: T | Symbol = EMPTY) {
        super();
    }
    get snapshot(): T {
        return this.getValue();
    }
    get value(): T {
        return this.getValue();
    }
    _subscribe(subscriber) {
        // tslint:disable-next-line
        const subscription: Subscription = super._subscribe(subscriber);
        // BehaviorSubject would call next to dispatch initial state of subject
        if (subscription && !subscription.closed && this.hasValue()) {
            subscriber.next(this._value as T);
        }
        return subscription;
    }
    getValue(): T {
        if (this.hasError) {
            throw this.thrownError;
        }
        if (this.closed) {
            throw new ObjectUnsubscribedError();
        }
        return this._value as T;
    }
    hasValue(): boolean {
        if (this.hasError) {
            return false;
        }
        if (this.closed) {
            return false;
        }
        return (this._value !== EMPTY);
    }
    next(value: T) {
        super.next(this._value = value);
    }
    once(): Observable<T> {
        return this.pipe(take(1));
    }
}
