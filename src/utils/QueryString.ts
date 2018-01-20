/**
 * A utility class to manage Query String paramaters, handles encoding and arrays
 * @param url - url to append parameters to
 * @param params - parameter to append to url
 */
export class QueryString {
    url: string;
    parts: string[] = [];

    constructor(url: string, params: Object = {}) {
        this.url = url;
        this.parts = QueryString.encodeParams(params);
    }

    static destruct(location: any): Object {
        const url = `${location.protocol }//${location.host}${location.pathname}`;
        const params = {};
        // tslint:disable-next-line:no-unused
        location.search.replace(new RegExp('([^?=&]+)(=([^&]*))?', 'g'), ($0, $1, $2, $3) => {
            params[decodeURIComponent($1)] = decodeURIComponent($3);
        });

        return { url, params };
    }

    static encodeParams(params) {
        const parts: string[] = [];
        if (params) {
            for (const key of Object.keys(params)) {
                const value = params[key];
                if (Array.isArray(value)) {
                    parts.push(`${key}=${encodeURIComponent(value.join(','))}`);
                } else {
                    parts.push(`${key}=${encodeURIComponent(value)}`);
                }
            }
        }

        return parts;
    }

    static stringify(params: any): string {
        const parts: string[] = QueryString.encodeParams(params);

        return parts.join('&');
    }

    /**
     * Convert to string
     */
    toString(): string {
        return this.url + ((this.url.indexOf('?') === -1) ? '?' : '&') + this.parts.join('&');
    }

}
