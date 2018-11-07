import { Persist } from '../src/index';
import delay from 'delay';

describe('Persist cache decorator is properly set', () => {
  class TestCache {
    public called: number = 0;
    public ttlcalled: number = 0;

    @Persist()
    public testMethod(): number {
      return ++this.called;
    }

    @Persist({ ttl: 500 })
    public ttlMethod(): number {
      return ++this.ttlcalled;
    }
  }

  let testCache: TestCache;
  beforeEach(() => {
    testCache = new TestCache();
  });

  it('should only call the test method once', () => {
    const result1: number = testCache.testMethod();
    const result2: number = testCache.testMethod();
    expect(testCache.called).toEqual(1);
    expect(result1).toEqual(result2);
  });

  it('should only call the test method once every 500 ms', async () => {
    testCache.ttlMethod();
    testCache.ttlMethod();
    expect(testCache.ttlcalled).toEqual(1);
    await delay(501);
    testCache.ttlMethod();
    testCache.ttlMethod();
    expect(testCache.ttlcalled).toEqual(2);
  });

});
