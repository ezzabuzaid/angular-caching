import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing"
import { HttpCacheHelper, } from "./cache";
import { CacheInterceptor } from "./cache/cache.interceptor";
import { ExampleService } from "./example.service";

describe('ExampleService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: CacheInterceptor,
                    multi: true,
                }
            ]
        })
    });

    xit('should create', () => {
        expect(TestBed.inject(ExampleService)).toBeDefined();
    });

    it('should call the server', (done) => {
        const responseDate = {
            todo: 'Test',
            id: 1
        }

        TestBed.inject(ExampleService).getData()
            .subscribe((result) => {
                expect(result).toEqual(responseDate);
                done();
            })

        const outGoingRequest = TestBed.inject(HttpTestingController).expectOne('https://jsonplaceholder.typicode.com/todos/1');
        outGoingRequest.flush(responseDate);
    });

    afterAll(() => {
        TestBed.inject(HttpCacheHelper).clear();
        TestBed.inject(HttpTestingController).verify();
    });

})