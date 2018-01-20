import { Memory } from './Memory';
let storageReference: Storage = new Memory();
try {
    if (window.localStorage) {
        storageReference = window.localStorage;
    }
} catch (err) { }

/**
* A Singleton Class that wraps localStorage calls to simply setting and 
* retrieving non-String values. All values stored will be Stringified and
* all values returned will be parsed back with JSON.parse
* @class
*/
export class Cache {
    /**
    * Will change the the Storage type used by the Cache.  This can be any class
    * that implements the Storage iterface. ie. LocalStorage,SessionStorage,Storage
    * @static
    */
    static set storage(value: Storage) {
        storageReference = value;
    }
    /**
    * Logs all values in storage
    * @static
    */
    static list(): void {
        for (let i = 0; i < storageReference.length; i++) {
            let key = storageReference.key(i);
            if (console && key) {
                console.debug(storageReference.key(i) + ' --> ' + storageReference.getItem(key));
            }
        }
    }
    /**
     * Adds value to cache with the key as the identifier
     * @static
     * @param {string} key - The key used to store the cached value
     * @param {string} value - The value to be cached
     * @returns value - the value stored
     */
    static put(key: string, value: any) {
        if (value !== null && typeof value === 'object') {
            value.dateCached = new Date().getTime();
        }
        storageReference.setItem(key, JSON.stringify(value));
        return value;
    }
    /**
     * Retrieves value from the cache stored with the key
     * @static
     * @param {string} key - The key used to identify the cached value
     * @returns value - the value cached
     */
    static get(key: string) {
        let value = storageReference.getItem(key);
        if (value) {
            return JSON.parse(value);
        }
        return null;
    }
    /**
     * Checks if a key is in the cache
     * @static
     * @param {string} key - The key used to identify the cached value
     * @returns {Boolean} value - if the cache contains the key
     */
    static has(key: string) {
        let expiration = Date.now() - 86400000;
        let tmp = storageReference.getItem(key);
        if (typeof (tmp) !== 'undefined' && tmp && tmp !== {} && tmp !== '') {
            let val = JSON.parse(tmp);
            if (val.dateCached) {
                return val.dateCached > expiration;
            }
            return true;
        }
        return false;
    }
    /**
     * Removes a key from the cache
     * @static
     * @param {string} key - The key used to identify the cached value
     */
    static remove(key: string) {
        storageReference.removeItem(key);
    }
}
