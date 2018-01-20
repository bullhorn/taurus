/**
* A utility class to manage Query String paramaters, handles encoding and arrays
* @class
* @param {string} url - url to append parameters to
* @param {Object} params - parameter to append to url
*/
export class QueryString {
    url: string;
    parts: Array<string> = [];

    constructor(url: string, params: Object = {}) {
        this.url = url;
        this.parts = QueryString.encodeParams(params);
    }

    static destruct(location: any): Object {
        let url = location.protocol + '//' + location.host + location.pathname,
            params = {};
        location.search.replace(new RegExp('([^?=&]+)(=([^&]*))?', 'g'), function ($0, $1, $2, $3) {
            params[decodeURIComponent($1)] = decodeURIComponent($3);
        });

        return { url, params };
    }

    static encodeParams(params) {
        let parts: string[] = [];
        if (params) {
            for (let key in params) {
                let value = params[key];
                if (Array.isArray(value)) {
                    parts.push(key + '=' + encodeURIComponent(value.join(',')));
                } else {
                    parts.push(key + '=' + encodeURIComponent(value));
                }
            }
        }
        return parts;
    }

    static stringify(params: any): string {
        let parts: string[] = this.encodeParams(params);
        return parts.join('&');
    }

    /**
    * Convert to string
    * @returns {string}
    */
    toString(): string {
        return this.url + ((this.url.indexOf('?') === -1) ? '?' : '&') + this.parts.join('&');
    }


}
