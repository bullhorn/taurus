export interface LazyPromise<T> extends Promise<T> {
  __then(onfulfilled?: ((value: T) => T | PromiseLike<T>) | undefined | null, onrejected?: ((reason: any) => T | PromiseLike<T>) | undefined | null): Promise<T>;
  __then<TResult>(onfulfilled: ((value: T) => T | PromiseLike<T>) | undefined | null, onrejected: (reason: any) => TResult | PromiseLike<TResult>): Promise<T | TResult>;
  __then<TResult>(onfulfilled: (value: T) => TResult | PromiseLike<TResult>, onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<TResult>;
  __then<TResult1, TResult2>(onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2>;
}

// tslint:disable-next-line:no-stateless-class
// tslint:disable-next-line:no-unnecessary-class
export class Lazy {
  static from(fn): LazyPromise<any> {
    let resolver;
    let rejecter;
    // tslint:disable-next-line:promise-must-complete
    const promise: any = new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
    promise.__then = promise.then;
    promise.then = function(success: Function, failure: Function) {
      setImmediate(() => {
        fn(resolver, rejecter);
      });
      this.__then(success, failure);
    };

    return promise;
  }

  static async series(promises: Promise<any>[], threads: number = 1): Promise<any> {
    let results: any[];
    const copy: Promise<any>[] = promises.slice();

    // tslint:disable-next-line:promise-must-complete
    return new Promise((resolve, reject) => {
      /**
       * [next description]
       * @param result [description]
       * @return       [description]
       */
      const next = (result?: any) => {
        if (!results) {
          results = [];
        } else {
          results = results.concat(result);
        }

        if (!copy.length) {
          return resolve(results);
        }
        const concurrent = copy.splice(0, threads);
        Promise.all(concurrent)
          .then(next)
          .catch(reject);
      };

      next();
    });
  }
}
