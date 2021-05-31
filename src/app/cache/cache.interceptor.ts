
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable, Injector } from "@angular/core";
import { Observable, of } from "rxjs";
import { mapTo, switchMap } from "rxjs/operators";
import { HttpCacheHelper } from "./cache.helper";
import { CACHE_STORAGE } from "./context_options";

@Injectable()
export class CacheInterceptor implements HttpInterceptor {

    constructor(
        private injector: Injector
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!req.context.get(CACHE_STORAGE)) {
            console.warn('SLIM: is disabled for ' + req.urlWithParams);
            return next.handle(req);
        }
        const httpCacheHelper = new HttpCacheHelper(this.injector.get(req.context.get(CACHE_STORAGE)));
        const proccess = () => next.handle(req)
            .pipe(switchMap((event) => {
                if (event instanceof HttpResponse) {
                    console.log('SLIM: put in cache');
                    return httpCacheHelper.set(req.urlWithParams, event.clone(), 1)
                        .pipe(mapTo(event))
                }
                return of(event);
            }));
        console.warn('SLIM: is enabled for ' + req.urlWithParams);
        return httpCacheHelper.get(req.urlWithParams)
            .pipe(
                switchMap((data) => {
                    if (data) {
                        console.log('SLIM: Fetch from cache');
                        return of(data);
                    }
                    console.log('SLIM: Forward request to server');
                    return proccess();
                }),
            );
    }

}