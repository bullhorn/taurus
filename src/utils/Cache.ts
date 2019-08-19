import { Memory } from './Memory';
import { Browser } from './Browser';
import localforage from 'localforage';

let storageReference: Storage = new Memory();
const browserReference: Browser = new Browser();
const STORAGE_RANKINGS_KEY: string = 'storageRankings';
const OBJECTSTORENAME: string = 'keyval';
const DBNAME: string = 'keyval-store';

// tslint:disable-next-line:no-floating-promises
try {
  overrideLocalForageSupport();
  localforage.config({
    driver: [localforage.INDEXEDDB,
            localforage.LOCALSTORAGE],
    name: DBNAME,
    storeName: OBJECTSTORENAME
  });
  if (window.localStorage) {
    storageReference = window.localStorage;
  }
} catch (err) {
  // Swallow
  console.warn('Unable to setup localforge cache.', err.message);
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
  static async list() {
    if (localforage !== undefined) {
      await localforage.ready();
      await localforage.iterate((value, key) => {
        console.debug(`${key} --> ${value}`);
      });
      return;
    }

    for (let i = 0; i < storageReference.length; i++) {
      const key = storageReference.key(i);
      if (console && key) {
        console.debug(`${storageReference.key(i)} --> ${storageReference.getItem(key)}`);
      }
    }
  }

  static exceedsStorageLimit(key: string, value: any): boolean {
    const totalPossible = browserReference.getStorageSize();
    const currentStorageSize = Cache.getLocalStorageSize();
    const keyLength: number = key ? key.length : 0;
    const valueLength: number = value ? value.length : 0;
    const newStorage = (keyLength + valueLength) * 2;
    return (currentStorageSize + newStorage >= totalPossible);
  }

  static getLocalStorageSize(): number {
    let _lsTotal = 0;
    let _xLen;
    for (const _x of Object.keys(storageReference)) {
      if (!storageReference.hasOwnProperty(_x)) {
        continue;
      }
      const itemLength: number = localStorage[_x].length;
      _xLen = ((itemLength + _x.length) * 2);
      _lsTotal += _xLen;
    }
    return _lsTotal;
  }

  /**
   * Adds value to cache with the key as the identifier
   * @param key - The key used to store the cached value
   * @param value - The value to be cached
   * @returns value - the value stored
   */
  static async put(key: string, value: any) {
    if (localforage !== undefined) {
      await localforage.ready();
      await localforage.setItem(key, value);
      return Promise.resolve(value);
    }

    if (!Cache.exceedsStorageLimit(key, value)) {
      if (value !== null && typeof value === 'object') {
        value.dateCached = new Date().getTime();
      }
      try {
        storageReference.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(error);
      }
    }
    return Promise.resolve(value);
  }
  /**
   * Retrieves value from the cache stored with the key
   * @param key - The key used to identify the cached value
   * @returns value - the value cached
   */
  static async get(key: string) {
    if (localforage !== undefined) {
      await localforage.ready();
      Cache.handleStorageRankingUpdate(key);
      return localforage.getItem(key);
    }

    const value = storageReference.getItem(key);
    if (value) {
      Cache.handleStorageRankingUpdate(key);
      return Promise.resolve(JSON.parse(value));
    }

    return null;
  }
  /**
   * Checks if a key is in the cache
   * @param key - The key used to identify the cached value
   * @returns value - if the cache contains the key
   */
  static async has(key: string) {
    try {
      const tmp = await Cache.get(key);
      const expiration = Date.now() - 86400000;
        if (tmp !== undefined && tmp && tmp !== '') {
          if (tmp.dateCached) {
            return tmp.dateCached > expiration;
          }
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
    } catch (err) {
      console.warn(`An error occurred while looking for ${key} in Cache`, err);
      return Promise.resolve(false);
    }
  }
  /**
   * Removes a key from the cache
   * @param key - The key used to identify the cached value
   */
  static async remove(key: string) {
    if (localforage !== undefined) {
      await localforage.ready();
      await localforage.removeItem(key);
      return;
    }

    storageReference.removeItem(key);
  }

  /**
   * Clears out the cache
   * @param key - The key used to identify the cached value
   */
  static async clear() {
    if (localforage !== undefined) {
      await localforage.ready();
      await localforage.clear();
      return;
    }

    storageReference.clear();
  }

  static getStorageRankings() {
    const value = storageReference.getItem(STORAGE_RANKINGS_KEY);
    if (value) {
      return JSON.parse(value);
    }
    return {};
  }

  static handleStorageRankingUpdate(key: string) {
    const value = Cache.getStorageRankings();
    value[key] = value[key] ? parseInt(value[key], 10) + 1 : 1;
    // tslint:disable-next-line:no-floating-promises
    Cache.put(STORAGE_RANKINGS_KEY, value);
  }
}

function overrideLocalForageSupport() {
  // This fixes an existing bug in localForage which checks for fetch to exist to check if Safari version is later than 10.1
  // Angular patches fetch in Safari and the test to check if fetch is native code returns false
  // Once LocalForage fixes this bug, we can remove this method
  // tslint:disable-next-line
  localforage['originalSupports'] = localforage.supports;
  localforage.supports = (driver: string) => {
    try {
      const isSafari = /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) &&
            !/Chrome/.test(navigator.userAgent) &&
            !/BlackBerry/.test(navigator.platform);
      if (isSafari) {
        const version = parseInt(navigator.userAgent.split('Version/')[1].split(' ')[0], 10);
        return version > 10.2;
      }
    } catch (e) {
      console.error(e);
    }
    // tslint:disable-next-line
    return localforage['originalSupports'](driver);
  };
}
