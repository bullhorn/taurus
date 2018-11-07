import { Memory } from './Memory';
import { is } from './Is';

export enum PersistType {
  MEMORY = 1,
  SESSION,
  STORAGE
}

export enum PersistReturnType {
  STATIC = 1,
  PROMISE
}

export interface PersistOptions {
  key?: string;
  type?: PersistType;
  ttl?: number;
}

export interface StorageObject {
  items: { [args: string]: any };
  ttl: { [args: string]: number };
  returnType?: PersistReturnType;
}

export function validatePersistType(type: PersistType = PersistType.MEMORY) {
  switch (type) {
    case PersistType.SESSION:
      if (window && window.sessionStorage) {
        return type;
      }
      break;
    case PersistType.STORAGE:
      if (window && window.localStorage) {
        return type;
      }
      break;
    case PersistType.MEMORY:
    default:
      return PersistType.Memory;
  }
  return PersistType.Memory;
}

export function normalizePersistOptions(options: PersistOptions, key: string = 'persist-key') {
  options.type = validatePersistType(options.type);
  options.key = options.key || key;
  options.ttl = options.ttl || 0;
  return options;
}

export function getMethodPersistProvider(type: PersistType): Storage {
  switch (type) {
    case PersistType.SESSION:
      return sessionStorage;
    case PersistType.STORAGE:
      return localStorage;
    case PersistType.MEMORY:
    default:
      return new Memory();
  }
}

export function getPersisted(memory: StorageObject, key: string): any {
  let item = null;
  if (memory.items.hasOwnProperty(key)) {
    item = memory.items[key];
  }
  return (memory.returnType === PersistReturnType.PROMISE) ? Promise.resolve(item) : item;
}

export function hasPersist(memory: StorageObject, key: string): boolean {
  return (memory.items.hasOwnProperty(key));
}

export function isExpired(memory: StorageObject, key: string): boolean {
  if (!memory.ttl.hasOwnProperty(key)) {
    return false;
  }
  return memory.ttl[key] < Date.now();
}

export function parseSafe(t: any): any {
  try {
    return JSON.parse(t);
  // tslint:disable-next-line:no-unused
  } catch (err) {
    return {
      items: {},
      ttl: {}
    };
  }
}

export function createPersistDecorator(options: PersistOptions, _target: Object, method: Function): () => any {
  const provider: Storage = getMethodPersistProvider(options.type);
  return async function (this: Function, ...args: any[]): Promise<any> {
    const argsString: string = JSON.stringify(args);
    const cacheObject: StorageObject = parseSafe(provider.getItem(options.key));
    if (!hasPersist(cacheObject, argsString) || isExpired(cacheObject, argsString)) {
      const result = method.call(this, ...args);
      const returnType = is(result).a(Promise) ? PersistReturnType.PROMISE : PersistReturnType.STATIC;
      const toBeStored: StorageObject = {
        items: {
          ...cacheObject.items,
          [argsString]: result
        },
        ttl: {
          ...cacheObject.ttl,
          [argsString]: Date.now() + options.ttl,
        },
        returnType
      };
      provider.setItem(options.key, JSON.stringify(toBeStored));
      return result;
    }
    return getPersisted(cacheObject, argsString);
  };
}

export function Persist(_options: PersistOptions = { type: PersistType.MEMORY }): MethodDecorator {
  return (target: object, method: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const options = normalizePersistOptions(_options, method);
    if (descriptor.hasOwnProperty('get') && descriptor.get) {
      descriptor.get = createPersistDecorator(options, target, descriptor.get);
    } else if (!descriptor.hasOwnProperty('set') && descriptor.value) {
      descriptor.value = createPersistDecorator(options, target, descriptor.value);
    } else {
      throw new Error('Can\'t set cache decorator on a setter');
    }

    return descriptor;
  };
}
