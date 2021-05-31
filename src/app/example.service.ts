import { HttpClient, HttpContext, HttpContextToken, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CACHE_STORAGE } from './cache/context_options';
import { INDEXEDDB_CACHE, LOCAL_STORAGE_CACHE, MEMORY_CACHE, SESSION_STORAGE_CACHE, WEBSQL_CACHE } from './cache/storage';


@Injectable({
    providedIn: 'root'
})
export class ExampleService {

    constructor(
        private httpClient: HttpClient,
    ) { }

    getData() {
        return this.httpClient.get<Record<string, any>>('https://jsonplaceholder.typicode.com/todos/1', {
            context: new HttpContext().set(CACHE_STORAGE, MEMORY_CACHE)
        })
    }

}