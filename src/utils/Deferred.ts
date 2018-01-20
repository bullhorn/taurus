/**
 * A Promise that uses the deferred antipattern
 * @class
 * @memberof Utils
 */
export function Deferred() {
    let temp: any = {};
    let promise: any = new Promise((resolve, reject) => {
        temp.resolve = resolve;
        temp.reject = reject;
    });
    promise.resolve = temp.resolve;
    promise.reject = temp.reject;
    return promise;
}
