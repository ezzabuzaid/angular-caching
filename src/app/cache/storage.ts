
import * as sessionStorageDriver from 'localforage-sessionstoragewrapper';
import * as localforage from 'localforage';
import * as memoryStorageDriver from 'localforage-memoryStorageDriver';
import { InjectionToken } from '@angular/core';

export interface AsyncStorage {
    /**
     * Empties the list associated with the object of all key/value pairs, if there are any.
     */
    clear(): Promise<void>;
    /**
     * Returns the current value associated with the given key, or null if the given key does not exist in the list associated with the object.
     */
    getItem<T>(key: string): Promise<T | null>;
    /**
     * Returns the name of the nth key in the list, or null if n is greater than or equal to the number of key/value pairs in the object.
     */
    key(index: number): Promise<string | null>;
    /**
     * Removes the key/value pair with the given key from the list associated with the object, if a key/value pair with the given key exists.
     */
    removeItem(key: string): Promise<void>;
    /**
     * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
     */
    setItem<T>(key: string, value: T): Promise<T>;
}

localforage.defineDriver(memoryStorageDriver);
localforage.defineDriver(sessionStorageDriver);


export const INDEXEDDB_CACHE = new InjectionToken<AsyncStorage>('INDEXEDDB_CACHE', {
    providedIn: 'root',
    factory: () => {
        console.log('INDEXEDDB_CACHE');
        const store = localforage.createInstance({
            driver: localforage.INDEXEDDB,
            version: 1.0,
            storeName: 'cache',
        });
        return store;
    }
});

export const MEMORY_CACHE = new InjectionToken<AsyncStorage>('MEMORY_CACHE', {
    providedIn: 'root',
    factory: () => {
        const store = localforage.createInstance({
            driver: memoryStorageDriver._driver,
            version: 1.0,
            storeName: 'cache',
        })
        return store;
    }
});

export const SESSION_STORAGE_CACHE = new InjectionToken<AsyncStorage>('SESSION_STORAGE_CACHE', {
    providedIn: 'root',
    factory: () => {
        const store = localforage.createInstance({
            driver: sessionStorageDriver._driver,
            version: 1.0,
            storeName: 'cache',
        })
        return store;
    }
});

export const LOCAL_STORAGE_CACHE = new InjectionToken<AsyncStorage>('LOCAL_STORAGE_CACHE', {
    providedIn: 'root',
    factory: () => {
        const store = localforage.createInstance({
            driver: localforage.LOCALSTORAGE,
            version: 1.0,
            storeName: 'cache',
        });
        return store;
    }
});

export const WEBSQL_CACHE = new InjectionToken<AsyncStorage>('WEBSQL_CACHE', {
    providedIn: 'root',
    factory: () => {
        const store = localforage.createInstance({
            driver: localforage.WEBSQL,
            version: 1.0,
            storeName: 'cache',
        });
        return store;
    }
});