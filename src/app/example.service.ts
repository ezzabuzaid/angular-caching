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