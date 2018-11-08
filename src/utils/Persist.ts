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
      return PersistType.MEMORY;
  }
  return PersistType.MEMORY;
}

export function validatePersistKey(keyOpt: string | Function, target: Object, method: string): string {
  if (is(keyOpt).a(Function)) {
    return (keyOpt as Function)(target);
  }
  if (is(keyOpt).a(String)) {
    return keyOpt as string;
  }
  return `persist-key-${method}`;
}

export function normalizePersistOptions(options: PersistOptions, target: Object, method: string) {
  options.type = validatePersistType(options.type);
  options.key = validatePersistKey(options.key, target, method);
  options.ttl = options.ttl || 0;
  return options;
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

export class StorageProvider {
  private storage: Storage;
  private memory: StorageObject;

  constructor(private _options: PersistOptions) {
    this.storage = this._getMethodPersistProvider(_options.type);
    this.memory = parseSafe(this.storage.getItem(_options.key));
  }

  public getPersisted(key: string): any {
    let item = null;
    if (this.memory.items.hasOwnProperty(key)) {
      item = this.memory.items[key];
    }
    return (this.memory.returnType === PersistReturnType.PROMISE) ? Promise.resolve(item) : item;
  }

  public async setPersisted(key: string, value: any): Promise<void> {
    const isPromise = is(value).a(Promise);
    this.memory.returnType = isPromise ? PersistReturnType.PROMISE : PersistReturnType.STATIC;
    if (isPromise) {
      this.memory.items = { ...this.memory.items, [key]: await Promise.resolve(value) };
    } else {
      this.memory.items = { ...this.memory.items, [key]: value };
    }
    if (this._options.ttl) {
      this.memory.ttl = { ...this.memory.ttl, [key]: Date.now() + this._options.ttl };
    }
    this.storage.setItem(this._options.key, JSON.stringify(this.memory));
  }

  public hasPersist(key: string): boolean {
    return (this.memory.items.hasOwnProperty(key));
  }

  public isExpired(key: string): boolean {
    if (!this.memory.ttl.hasOwnProperty(key)) {
      return false;
    }
    return this.memory.ttl[key] < Date.now();
  }

  private _getMethodPersistProvider(type: PersistType): Storage {
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
}

export function createPersistDecorator(options: PersistOptions, _target: Object, method: Function): () => any {
  const provider: StorageProvider = new StorageProvider(options);
  return function (this: Function, ...args: any[]): any {
    const argsString: string = JSON.stringify(args);
    if (!provider.hasPersist(argsString) || provider.isExpired(argsString)) {
      const result = method.call(this, ...args);
      provider.setPersisted(argsString, result);
      return result;
    }
    return provider.getPersisted(argsString);
  };
}

export function Persist(_options: PersistOptions = { type: PersistType.MEMORY }): MethodDecorator {
  return (target: object, method: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const options = normalizePersistOptions(_options, target, method);
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
