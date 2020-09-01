# Angular Caching

This article will take you through the way to efficiently handle the HTTP client request and cache them inside different browser storage.

For clarity about what I’m going to talk about, the full project is available to browse through [Github](https://github.com/ezzabuzaid/angular-caching).

So, Caching is a way to store data (response in our case) in storage to quickly access it later on.

There're many advantages of caching in general so I'll just point out some of what the Front End interested in

* Reduce the number of requests
* Improved responsiveness by retrieving the response immediately

### When to use

* Response that doesn't frequently change
* Request that the application addressing frequently
* Show some data while there's no internet connection to provide an offline experience

and there's a lot of other use cases and it all depends on your business case.

### Implementation

first of all, you need to run `npm install @ezzabuzaid/document-storage` , we will use this library to facilitate and unify different storage access, of course, you can use whatever you see suitable

declare an entry class that will represent the entry in the cache

``` typescript
/**
 * class Represent the entry within the cache
 */
export class HttpCacheEntry {
    constructor(
        /**
         * Request URL
         *
         * will be used as a key to associate it with the response
         */
        public url: string,
        /**
         * the incoming response
         *
         * the value will be saved as a string and before fetching the data we will map it out to HttpResponse again
         */
        public value: HttpResponse<any>,
        /**
         * Maximum time for the entry to stay in the cache
         */
        public ttl: number
    ) { }
}
```

create an injection token to deal with dependency injection.
for our case, we need to register it for application-wide so we provide it in the root.
I'm using IndexedDB here but it's your call to choose.

``` typescript
export const INDEXED_DATABASE = new InjectionToken<AsyncDatabase>(
    'INDEXED_DB_CACHE_DATABASE',
    {
        providedIn: 'root',
        factory: () => new AsyncDatabase(new IndexedDB('cache'))
    }
);
```

here is a list of available storages

1. LocalStorage
2. SessionStorage
3. IndexedDB
4. InMemory
5. WebSql
6. Cache API
7. Cookie

after setup the storage we need to implement the save and retrieve functionality

``` typescript

@Injectable({
    providedIn: 'root'
})
export class HttpCacheHelper {
    private collection: AsyncCollection<HttpCacheEntry> = null;

    constructor(
        @Inject(INDEXED_DATABASE) indexedDatabase: AsyncDatabase,
    ) {
        // collection is a method the came from `document-storage` library to originze /
        // the data in different namespaces, so here we defined 'CACHE' namespace to
        // save all cache related things to it
        // collection provide different method to store are retrive data
        this.collection = indexedDatabase.collection('CACHE');
    }

    /**
     *
     * @param url: request URL including the path params
     * @param value: the request-response
     * @param ttl: the maximum time for the entry to stay in the cache before invalidating it
     *
     * Save the response in the cache for a specified time
     *
     */
    public set(url: string, value: HttpResponse<any>, ttl: number) {
        return this.collection.set(new HttpCacheEntry(url, value, ttl));
    }

    /**
     *
     * @param url: request URL including the path params
     *
     * Retrieve the response from the cache database and map it to HttpResponse again.
     *
     * if TTL end, the response will be deleted and null will return
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
}
```

all that you need now is to inject the `HttpCacheHelper` and use the `set` and `get` functions

we will use set and get functions later on in the interceptor as another layer to make the code clear as possible.

### Cache Invalidation

Imagine that the data is saved in storage and everything works as expected, but the server database has been updated, and eventually, you want to update the data in the browser storage to match what you have in the server.
there are different approaches to achieve this, like open WebSocket/SSE connection to notify the browser for an update, set an expiry time for your data (TTL) or by versioning your cache so when you change the version the old data became invalid

* TTL

Time To Live is a way to set the limited lifetime for a record so we can know in further when it will become a stall

it's implemented in the above example where we check if the TTL is expired

* Version key

We can replace the TTL with version key so instead of checking if the date elapsed we can check if the version changed
I can see two approaches

1. Using the version that specified in package.json
2. Retrieve version from API

e.g: the current version will be stored with the cache entry and whenever you fetch the data again you check if the version of the cache entry equal to the application version then you can either return the entry or delete it

for more clarification about how to deal with package json version I would suggest to read this [article](https://medium.com/@tolvaly.zs/how-to-version-number-angular-6-applications-4436c03a3bd3#:~:text=Briefly%3A%20we%20will%20import%20the, should%20already%20have%20these%20prerequisites).

* WebSocket/SSE

* On-Demand

Make the user responsible for fetching the latest data from the server

* Meta-Request

you can use head request for example to 

### Usage

``` typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { HttpCacheHelper, HttpCacheEntry } from './cache/cache.helper';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class ExampleService {

    constructor(
        private httpClient: HttpClient,
        private httpCacheHelper: HttpCacheHelper
    ) { }

    getData() {
        const url = '/endpoint-url';
        // Check if there's data in the cache
        this.httpCacheHelper.get(url)
            .pipe(switchMap(response => {
                // return the cached data if available
                if (response) {
                    return of(response);
                }
                // fetch data from the server
                return this.httpClient.get<HttpResponse<any>>(url, { observe: 'response' })
                    .pipe(tap((response) => {
                        // save the response in order to use it in subsequent requests
                        this.httpCacheHelper.set(url, response, 60);
                    }))
            }));
    }

}
```

First, we check if the data is in the cache and return if available, if not, we do call the backend to fetch the data then we save it in the cache to make it available in the subsequent calls

### Caching Strategy

there's a different way to decide how and when to fetch the data from client cache or server, like the one we implemented is called **Cache First** strategy

1. cache first

Implies that the cache has a higher priority to fetch data from

2. network first

As opposite, fetch data from the network and if an error occurred or no internet connection use cache as a fallback

* Please note that the above strategies work with **read** request*

also, there are ways to cache the read requests
e.g: you have a dashboard that tracks user movements and you don't need to submit every move, therefore you can save all the movement in the cache and after a certain time you submit it

I'm not going to explain caching for a written request, just know that it's possible.

Summary

1. Each store has it's own characteristics.
2. Cache invalidation is a must and you should always guarantee that you have the latest data.

Database just fancy name.
