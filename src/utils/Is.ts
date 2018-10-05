export class Is {
    private readonly reference: any = {};

    constructor(ref: any) {
        this.reference = ref;
    }

    //#region Properties

    get aBoolean() {
        return this.a(Boolean);
    }

    get aDate() {
        return this.a(Date);
    }

    get aFunction() {
        return this.a(Function);
    }

    get anArray() {
        return this.a(Array);
    }

    get anError() {
        return this.a(Error);
    }

    get anObject() {
        return this.a(Object);
    }

    get aNonEmptyArray() {
        return this.anArray && !!this.reference.length;
    }

    get aNonEmptyString() {
        return this.aString && !!this.reference.trim();
    }

    get aNumber() {
        return this.a(Number);
    }

    get aRegExp() {
        return this.a(RegExp);
    }

    get aString() {
        return this.a(String);
    }

    get defined() {
        return !this.undefined && !this.null && !this.nan;
    }

    get nan() {
        return this.a(NaN);
    }

    get null() {
        return this.a(null);
    }

    get undefined() {
        return this.a(undefined);
    }

    //#endregion

    //#region Methods

    a(T) {
        let result = false;
        const className = this.reference.constructor.name;

        switch (T) {
            case undefined:
                result = className === 'Undefined';
                break;

            case null:
                result = className === 'Null';
                break;

            case Array:
                result = className === 'Array';
                break;

            case Boolean:
                result = className === 'Boolean';
                break;

            case Date:
                result = className === 'Date';
                break;

            case Error:
                result = className === 'Error';
                break;

            case Function:
                result = className === 'Function';
                break;

            case Number:
                result = className === 'Number' && !isNaN(this.reference);
                break;

            case RegExp:
                result = className === 'RegExp';
                break;

            case String:
                result = className === 'String';
                break;

            case Object:
                result = className === 'Object' || className === 'Arguments';
                break;

            default:
                const templateClassName = T.constructor.name;

                if (templateClassName === 'Number' && isNaN(T)) {
                    result = className === 'Number' && isNaN(this.reference);
                } else {
                    result = this.reference instanceof T;
                }
        }

        return result;
    }

    aTypeOf(type) {
        let result = false;

        // tslint:disable-next-line:no-conditional-assignment
        if (typeof type === 'function' && !(result = (type === this.reference)) && !(result = type.isPrototypeOf(this.reference))) {
            let proto = this.reference;

            while (typeof proto === 'function') {
                // tslint:disable-next-line:no-conditional-assignment
                if ((result = proto === type) || proto === Object) {
                    break;
                }

                if (typeof proto.prototype === 'object' && Object.getPrototypeOf(proto).constructor === Function) {
                    proto = (Object.getPrototypeOf(proto.prototype) || {}).constructor;
                } else {
                    proto = Object.getPrototypeOf(proto);
                }
            }
        }

        return result;
    }

    //#endregion

}

// tslint:disable-next-line:only-arrow-functions
export function is(ref) {
    return new Is(ref);
}
