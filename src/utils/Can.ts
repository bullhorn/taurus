/**
* Spec...
* Can(item).have('data.properties.value');  //return undefined or value;
**/

export class Can {
    constructor(private obj: any) { }

    have(key: string) {
        let props = key.split('.');
        let item = this.obj;
        for (let i = 0; i < props.length; i++) {
            item = item[props[i]];
            if (this.check(item) === false) {
                return item;
            }
        }
        return item;
    }

    check(thing: any) {
        return thing !== void 0;
    }
}

export function can(obj: any) {
    return new Can(obj);
}
