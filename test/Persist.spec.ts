import { Persist } from '../src/index';
import delay from 'delay';

describe('Persist cache decorator is properly set', () => {
  class TestCache {
    public called: number = 0;
    public ttlcalled: number = 0;
    public argsCalled: number = 0;
    public asyncCalled: number = 0;

    @Persist()
    public testMethod(): number {
      return ++this.called;
    }

    @Persist({ ttl: 500 })
    public ttlMethod(): number {
      return ++this.ttlcalled;
    }

    @Persist()
    public methodWithArgs(a: number, b: number): number {
      this.argsCalled++;
      return a + b;
    }

    @Persist()
    public async asyncMethod(a: number, b: number): Promise<number> {
      this.asyncCalled++;
      return Promise.resolve(a + b);
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

  it('should only call the args method once per unique args', () => {
    const result1: number = testCache.methodWithArgs(1, 1);
    const result2: number = testCache.methodWithArgs(1, 1);
    expect(testCache.argsCalled).toEqual(1);
    expect(result1).toEqual(result2);
    const result3: number = testCache.methodWithArgs(2, 2);
    const result4: number = testCache.methodWithArgs(2, 2);
    expect(testCache.argsCalled).toEqual(2);
    expect(result3).toEqual(result4);
  });

  it('should only call the async method once', async () => {
    const result1: number = await testCache.asyncMethod(2, 2);
    const result2: number = await testCache.asyncMethod(2, 2);
    expect(testCache.asyncCalled).toEqual(1);
    expect(result1).toEqual(result2);
  });

});
