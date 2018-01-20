import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { ObjectUnsubscribedError } from 'rxjs/util/ObjectUnsubscribedError';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/take';

export const EMPTY: Symbol = Symbol('EMPTY');

/**
 * @class StatefulSubject<T>
 */
export class StatefulSubject<T> extends Subject<T> {
    constructor(private _value: T | Symbol = EMPTY) {
        super();
    }
    get snapshot():T {
        return this.getValue();
    }
    get value():T {
        return this.getValue();
    }
    _subscribe(subscriber) {
        const subscription = super._subscribe(subscriber);
        // BehaviorSubject would call next to dispatch initial state of subject
        if (subscription && !subscription.closed && this.hasValue()) {
            subscriber.next(this._value as T);
        }
        return subscription;
    }
    getValue():T {
        if (this.hasError) {
            throw this.thrownError;
        }
        else if (this.closed) {
            throw new ObjectUnsubscribedError();
        }
        else {
            return this._value as T;
        }
    }
    hasValue():boolean {
        if (this.hasError) {
            return false;
        } else if (this.closed) {
            return false;
        }
        return (this._value !== EMPTY);
    }
    next(value:T) {
        super.next(this._value = value);
    }
    once() {
        return this.take(1);
    }
}