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
     */
    complete() {
        // Do something?
    }

    /**
     * Override of error method that prevents stopping that Rx.Observer
     * @param error  - Error to be dispatched
     */
    error(error: any) {
        // Store error
        this.error = error;
        // Dispatch to all observers
        this.observers.forEach(os => {
            // Dispatch
            os.error(error);
            // Mark observer as not stopped
            os.closed = false;
            // Os.isStopped = false;
        });
    }
}

/**
 * Converts topic to search regex
 * @param  topic   Topic name
 * @return         Search regex
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
 * @param  topic         Topic name
 * @param  existingTopic Topic name to compare to
 * @return Whether topic is included in existingTopic
 * @example
 * should(compareTopics('test.one.two', 'test.#')).equal(true);
 */
export const compareTopics = (topic: string, existingTopic: string) => {
    // If no # or * found, do plain string matching
    if (existingTopic.indexOf('#') === -1 && existingTopic.indexOf('*') === -1) {
        return topic === existingTopic;
    }
    // Otherwise do regex matching
    const pattern = topicToRegex(existingTopic);
    const rgx = new RegExp(pattern);
    return rgx.test(topic);
};

/**
 * Find a specific subject by given name
 * @param  subjects    Array of subjects to search in
 * @param  name        Name to search for
 * @return Found subject or void
 */
export const findSubjectByName = (subjects: any[], name: string) => {
    const res = subjects.filter(s => s.name === name);
    if (!res || res.length < 1) {
        return;
    }

    return res[0];
};
