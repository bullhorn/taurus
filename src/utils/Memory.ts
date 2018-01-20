/**
* A Class that implements the basic storage interface, used as an alternative to localStorage.
* @class
*/
export class Memory implements Storage {
    private dataStore: any = {};
    [key: string]: any;
    [index: number]: string;

    /**
    * Will store the item in memory
    * @param {string} key - The key used to identify the stored value
    * @param {string} value - The value to be stored
    */
    setItem(key: string, value: any): void {
        this.dataStore[key] = value || '';
    }
    /**
    * Will retrieve the value from storage and return it.
    * @param {string} key - The key for the value to be returned
    * @returns value - The value associated with the key
    */
    getItem(key: string): string | null {
        return this.dataStore[key];
    }
    /**
    * Will remove the item from storage
    * @param {string} key - The key for the value to be removed
    */
    removeItem(key: string): void {
        delete this.dataStore[key];
    }
    /**
    * Will remove the all items from storage
    */
    clear(): void {
        this.dataStore = {};
    }
    /**
    * The size of the storage object
    */
    get length(): number {
        return Object.keys(this.dataStore).length;
    }

    key(index: number): string | null {
        let keys = Object.keys(this.dataStore);
        return keys[index] || null;
    }
}
