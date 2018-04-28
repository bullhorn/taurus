import { Memory } from './Memory';

let storageReference: Storage = new Memory();
try {
    if (window.localStorage) {
        storageReference = window.localStorage;
    }
} catch (err) {
    // Swallow
    console.warn('Unable to setup localstorage cache.', err.message);
}

/**
 * A Singleton Class that wraps localStorage calls to simply setting and
 * retrieving non-String values. All values stored will be Stringified and
 * all values returned will be parsed back with JSON.parse
 */
// tslint:disable-next-line:no-stateless-class
// tslint:disable-next-line:no-unnecessary-class
export class Cache {
    /**
     * Will change the the Storage type used by the Cache.  This can be any class
     * that implements the Storage iterface. ie. LocalStorage,SessionStorage,Storage
     */
    static set storage(value: Storage) {
        storageReference = value;
    }
    /**
     * Logs all values in storage
     */
    static list(): void {
        for (let i = 0; i < storageReference.length; i++) {
            const key = storageReference.key(i);
            if (console && key) {
                console.debug(`${storageReference.key(i)} --> ${storageReference.getItem(key)}`);
            }
        }
    }
    /**
     * Adds value to cache with the key as the identifier
     * @param key - The key used to store the cached value
     * @param value - The value to be cached
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
     * @param key - The key used to identify the cached value
     * @returns value - the value cached
     */
    static get(key: string) {
        const value = storageReference.getItem(key);
        if (value) {
            return JSON.parse(value);
        }

        return null;
    }
    /**
     * Checks if a key is in the cache
     * @param key - The key used to identify the cached value
     * @returns value - if the cache contains the key
     */
    static has(key: string) {
        try {
            const expiration = Date.now() - 86400000;
            const tmp = storageReference.getItem(key);
            if (tmp !== undefined && tmp && tmp !== '') {
                const val = JSON.parse(tmp);
                if (val.dateCached) {
                    return val.dateCached > expiration;
                }

                return true;
            }
            return false;
        } catch (err) {
            console.warn(`An error occurred while looking for ${key} in Cache`, err);
            return false;
        }
    }
    /**
     * Removes a key from the cache
     * @param key - The key used to identify the cached value
     */
    static remove(key: string) {
        storageReference.removeItem(key);
    }
}
