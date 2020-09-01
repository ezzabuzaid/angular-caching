
import { HttpResponse } from '@angular/common/http';
import { Inject, Injectable, InjectionToken } from '@angular/core';
import { AsyncCollection, AsyncDatabase, IndexedDB, SyncDatabase, SessionStorage, LocalStorage, Entity } from '@ezzabuzaid/document-storage';
import { from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export const INDEXED_DATABASE = new InjectionToken<AsyncDatabase>(
    'INDEXED_DB_CACHE_DATABASE',
    {
        providedIn: 'root',
        factory: () => new AsyncDatabase(new IndexedDB('cache'))
    }
);

export const MEMORY_CACHE_DATABASE = new InjectionToken<SyncDatabase>('LOCAL_CACHE_DATABASE', {
    providedIn: 'root',
    factory: () => new SyncDatabase(new LocalStorage('cache'))
});

/**
 * class Represent the entry within the cache
 */
export class HttpCacheEntry {
    constructor(
        /**
         * Request url
         * 
         * will be used as key to associate it with the response
         */
        public url: string,
        /**
         * the incoming response
         * 
         * the value will be saved as string and before fetching the data we will map it out to HttpResponse again
         */
        public value: HttpResponse<any>,
        /**
         * Maximum time for the entry to stay in the cache
         */
        public ttl: number
    ) { }
}

@Injectable({
    providedIn: 'root'
})
export class HttpCacheHelper {
    private collection: AsyncCollection<HttpCacheEntry> = null;

    constructor(
        @Inject(INDEXED_DATABASE) indexedDatabase: AsyncDatabase,
    ) {
        this.collection = indexedDatabase.collection('CACHE');
    }

    /**
     * 
     * @param url request url including the path params
     * @param value the request response
     * @param ttl the maximum time for the entry to stay in cache before invalidate it
     * 
     * Save the resposne in the cache for a specified time
     *
     */
    public set(url: string, value: HttpResponse<any>, ttl: number) {
        return this.collection.set(new HttpCacheEntry(url, value, this.timeToLive(ttl)));
    }

    /**
     * 
     * @param url request url including the path params
     * 
     * Retrive the response from cache database and map it to HttpResponse again.
     * 
     * if ttl end, the response will be deleted and null will return
     */
    public get(url: string) {
        return from(this.collection.get((entry) => entry.url === url))
            .pipe(
                switchMap((entry) => {
                    if (entry && this.dateElapsed(entry.ttl ?? 0)) {
                        return this.invalidateCache(entry);
                    }
                    return of(entry);
                }),
                map(response => response && new HttpResponse(response.value)),
            );
    }

    /**
     * Clear out the entire cache database
     */
    public clear() {
        return this.collection.clear();
    }

    private invalidateCache(entry: Entity<HttpCacheEntry>) {
        return this.collection.delete(entry.id).then(_ => null);
    }

    private dateElapsed(date: number) {
        return date < Date.now();
    }

    timeToLive(minutes: number) {
        const date = new Date();
        date.setMinutes(date.getMinutes() + minutes);
        return date.getTime();
    }

}