import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AsyncCollection, AsyncDatabase } from '@ezzabuzaid/document-storage';
import { INDEXED_DATABASE, HttpCacheEntry, HttpCacheHelper } from './cache.helper';


describe('HttpCacheHelper', () => {
  let service: HttpCacheHelper = null;
  let storage: AsyncDatabase = null;
  const COLLECTION_NAME = 'TEST';
  const ENTRY_NAME = 'endpoint';
  const mockCollection = jasmine.createSpyObj<AsyncCollection<any>>('AsyncCollection', ['clear', 'set', 'get']);

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        {
          provide: INDEXED_DATABASE,
          useValue:
          {
            collection: jasmine.createSpy().and.returnValue(mockCollection)
          }
        }
      ]
    });
    service = TestBed.inject(HttpCacheHelper);
    storage = TestBed.inject(INDEXED_DATABASE);
  });

  afterEach(() => {
    mockCollection.set.calls.reset();
  });

  it('should create ...', () => {
    expect(service).toBeDefined();
  });

  it('[populate] should get the specifed cache collection', () => {
    // Arrange
    service.populate(COLLECTION_NAME);

    // Act
    expect(storage.collection).toHaveBeenCalledTimes(1);
    expect(storage.collection).toHaveBeenCalledWith(COLLECTION_NAME);
  });

  it('[set] should save the cache entry', () => {
    // Arrange
    service.populate(COLLECTION_NAME);
    const entry = new HttpResponse();
    const ttl = Date.now();

    // Act
    service.set(ENTRY_NAME, entry, ttl);

    // Assert
    expect(mockCollection.set).toHaveBeenCalledTimes(1);
    expect(mockCollection.set).toHaveBeenCalledWith(new HttpCacheEntry(ENTRY_NAME, entry, ttl));
  });

  it('[get] should get the entry from the cache', async () => {
    // Arrange
    service.populate(COLLECTION_NAME);
    const valueToCache = new HttpResponse();
    const entry = new HttpCacheEntry(ENTRY_NAME, valueToCache, Date.now());
    mockCollection.get.and.returnValue(Promise.resolve(entry));

    // Act
    const cachedValue = await service.get(null).toPromise();

    // Assert
    expect(cachedValue instanceof HttpResponse).toBeTruthy();
  });

  it('[clear] should clear out the cache collection', () => {
    service.populate(COLLECTION_NAME);
    service.clear();

    expect(mockCollection.clear).toHaveBeenCalledTimes(1);
  });

});

