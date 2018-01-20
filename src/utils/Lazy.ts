export interface LazyPromise<T> extends Promise<T> {
    __then(onfulfilled?: ((value: T) => T | PromiseLike<T>) | undefined | null, onrejected?: ((reason: any) => T | PromiseLike<T>) | undefined | null): Promise<T>;
    __then<TResult>(onfulfilled: ((value: T) => T | PromiseLike<T>) | undefined | null, onrejected: (reason: any) => TResult | PromiseLike<TResult>): Promise<T | TResult>;
    __then<TResult>(onfulfilled: (value: T) => TResult | PromiseLike<TResult>, onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<TResult>;
    __then<TResult1, TResult2>(onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2>;
}

export class Lazy {
    static from(fn): LazyPromise<any> {
        let resolver;
        let rejecter;
        const promise: any = new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        });
        promise.__then = promise.then;
        promise.then = function factory(success: Function, failure: Function) {
            setImmediate(() => {
                fn(resolver, rejecter);
            });
            this.__then(success, failure);
        };

        return promise;
    }
    
    static series(promises: Array < Promise < any >>, threads: number = 1): Promise < any > {
        let results: Array<any>;
        promises = promises.slice();
        return new Promise((resolve, reject) => {
            /**
             * [next description]
             * @param  {[type]}   result [description]
             * @return {Function}        [description]
             */
            function next(result?: any) {
                if (!results) {
                    results = [];
                } else {
                    results = results.concat(result);
                }

                if (promises.length) {
                    let concurrent = promises.splice(0, threads);
                    Promise
                        .all(concurrent)
                        .then(next)
                        .catch(reject);
                } else {
                    resolve(results);
                }
            }

            next();
        });
    }
}


   