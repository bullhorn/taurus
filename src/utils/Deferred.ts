/**
 * A Promise that uses the deferred antipattern
 */
// tslint:disable-next-line:only-arrow-functions
export function Deferred() {
  const temp: any = {};
  // tslint:disable-next-line:promise-must-complete
  const promise: any = new Promise((resolve, reject) => {
    temp.resolve = resolve;
    temp.reject = reject;
  });
  promise.resolve = temp.resolve;
  promise.reject = temp.reject;

  return promise;
}
