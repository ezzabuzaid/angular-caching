
import { HttpResponse } from '@angular/common/http';
import { Inject, Injectable, InjectionToken, Injector } from '@angular/core';
import { defer, from, Observable, of } from 'rxjs';
import { map, mapTo, switchMap, tap } from 'rxjs/operators';
import { AsyncStorage } from './storage';

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

export class HttpCacheHelper {

    constructor(private storage: AsyncStorage) { }

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
        return defer(() => this.storage.setItem(url, JSON.stringify(value)))
        // return defer(() => this.collection.set(new HttpCacheEntry(url, value, this.timeToLive(ttl))));
    }

    /**
     * 
     * @param url request url including the path params
     * 
     * Retrive the response from cache database and map it to HttpResponse again.
     * 
     * if ttl end, the response will be deleted and null will return
     */
    public get(url: string): Observable<HttpResponse<any>> {
        return defer(() => this.storage.getItem<string>(url))
            .pipe(map(response => response && new HttpResponse(JSON.parse(response))))
        // return defer(() => this.collection.get((entry) => entry.url === url))
        //     .pipe(
        //         // switchMap((entry) => {
        //         //     if (entry && this.dateElapsed(entry.ttl ?? 0)) {
        //         //         return this.invalidateCache(entry);
        //         //     }
        //         //     return of(entry);
        //         // }),
        //         tap(console.warn),
        //     );
    }

    /**
     * Clear out the entire cache database
     */
    public clear() {
        this.storage.clear();
    }

    private invalidateCache(entry: HttpCacheEntry) {
        return this.storage.removeItem(entry.url).then(_ => null);
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