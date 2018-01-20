export class Can {
    constructor(private readonly obj: any) { }

    have(key: string) {
        const properties = key.split('.');
        let item = this.obj;
        for (const property of properties) {
            item = item[property];
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

// tslint:disable-next-line:only-arrow-functions
export function can(obj: any) {
    return new Can(obj);
}
