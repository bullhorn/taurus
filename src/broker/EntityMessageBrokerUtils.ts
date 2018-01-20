import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';

/**
 * EndlessReplaySubject extension of Rx.ReplaySubject.
 * This is pretty hacky, but so far I'd found no better way of having
 * Subjects that do no close on multicasted stream completion and on multiple errors.
 * For documentation refer to
 * [ReplaySubject docs](@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/replaysubject.md).
 * The only difference is that EndlessReplaySubject never triggers '.complete()' and
 * does not closes observers on errors (thus allowing to continuously dispatch them).
 */
export class EndlessReplaySubject<T> extends ReplaySubject<T> {
    /**
     * Dummy method override to prevent execution and Rx.Observable completion
     * @return {void}
     */
    complete() {}

    /**
     * Override of error method that prevents stopping that Rx.Observer
     * @param  {Error} error  - Error to be dispatched
     * @return {void}
     */
    error(error: any) {
        // store error
        this.error = error;
        // dispatch to all observers
        this.observers.forEach(os => {
            // dispatch
            os.error(error);
            // mark observer as not stopped
            os.closed = false;
            //os.isStopped = false;
        });
    }
}

/**
 * Converts topic to search regex
 * @param  {String} topic   Topic name
 * @return {Regex}          Search regex
 * @private
 */
export const topicToRegex = (topic: string) => `^${topic.split('.')
.reduce((result, segment, index, arr) => {
    let res = '';
    if (arr[index - 1]) {
        res = arr[index - 1] !== '#' ? '\\.\\b' : '\\b';
    }
    if (segment === '#') {
        res += '[\\s\\S]*';
    } else if (segment === '*') {
        res += '[^.]+';
    } else {
        res += segment;
    }
    return result + res;
}, '')}`;

/**
 * Compares given topic with existing topic
 * @param  {String}  topic         Topic name
 * @param  {String}  existingTopic Topic name to compare to
 * @return {Boolean}               Whether topic is included in existingTopic
 * @example
 * should(compareTopics('test.one.two', 'test.#')).equal(true);
 * @private
 */
export const compareTopics = (topic: string, existingTopic: string) => {
    // if no # or * found, do plain string matching
    if (existingTopic.indexOf('#') === -1 && existingTopic.indexOf('*') === -1) {
        return topic === existingTopic;
    }
    // otherwise do regex matching
    const pattern = topicToRegex(existingTopic);
    const rgx = new RegExp(pattern);
    const result = rgx.test(topic);
    return result;
};


/**
 * Find a specific subject by given name
 * @param  {Array}                  subjects    Array of subjects to search in
 * @param  {String}                 name        Name to search for
 * @return {(EndlessSubject|void)}              Found subject or void
 */
export const findSubjectByName = (subjects: any[], name: string) => {
    const res = subjects.filter(s => s.name === name);
    if (!res || res.length < 1) {
        return undefined;
    }

    return res[0];
};