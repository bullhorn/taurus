export class Is {
    private reference: any = {};

    constructor(ref: any) {
        //init
        this.reference = ref;
    }

    //#region Properties

    get aBoolean() {
        return this.a(Boolean);
    }

    get aDate() {
        return this.a(Date);
    }

    get aDocument() {
        return this.a(HTMLDocument);
    }

    get aFunction() {
        return this.a(Function);
    }

    get anArray() {
        return this.a(Array);
    }

    get anElement() {
        return this.a(HTMLElement);
    }

    get anError() {
        return this.a(Error);
    }

    get anObject() {
        return this.a(Object);
    }

    get aNodeList() {
        return this.a(NodeList);
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

    get aWindow() {
        return this.a(Window);
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
        const TRefName = this.reference.constructor.name;

        switch (T) {
            case undefined:
                result = TRefName === 'Undefined';
                break;

            case null:
                result = TRefName === 'Null';
                break;

            case Array:
                result = TRefName === 'Array';
                break;

            case Boolean:
                result = TRefName === 'Boolean';
                break;

            case Date:
                result = TRefName === 'Date';
                break;

            case Error:
                result = TRefName === 'Error';
                break;

            case HTMLDocument:
                result = TRefName === 'HTMLDocument' || TRefName === 'Document';
                break;

            case HTMLElement:
                const windowedHTMLElement = (((this.reference || {}).ownerDocument || {}).defaultView || {}).HTMLElement;
                result = !!windowedHTMLElement && this.reference instanceof windowedHTMLElement;
                break;

            case Function:
                result = TRefName === 'Function';
                break;

            case NodeList:
                result = TRefName === 'NodeList';
                break;

            case Number:
                result = TRefName === 'Number' && !isNaN(this.reference);
                break;

            case RegExp:
                result = TRefName === 'RegExp';
                break;

            case String:
                result = TRefName === 'String';
                break;

            case Window:
                result = TRefName === 'Window' || TRefName === 'global';
                break;

            case Object:
                result = TRefName === 'Object' || TRefName === 'Arguments';
                break;

            default:
                const TName = T.constructor.name;

                if (TName === 'Number' && isNaN(T))
                    result = TRefName === 'Number' && isNaN(this.reference);
                else
                    result = this.reference instanceof T;

                break;
        }

        return result;
    }

    aTypeOf(T) {
        let result = false;

        if (typeof T === 'function' && !(result = (T === this.reference)) && !(result = T.isPrototypeOf(this.reference))) {
            let proto = this.reference;

            while (typeof proto === 'function') {
                if ((result = proto === T) || proto === Object)
                    break;

                if (typeof proto.prototype === 'object' && Object.getPrototypeOf(proto).constructor === Function)
                    proto = (Object.getPrototypeOf(proto.prototype) || {}).constructor;
                else
                    proto = Object.getPrototypeOf(proto);
            }
        }

        return result;
    }

    //#endregion

}

export function is(ref) {
    return new Is(ref);
}
