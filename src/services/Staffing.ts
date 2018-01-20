import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Subject } from 'rxjs/Subject';
/* jslint camelcase: false */
import { RestCredentials, StaffingAuthProvider, StaffingCredentialsAuthProvider } from './StaffingAuthProvider';
import { StaffingConfiguration } from '../types';
import { Cache, QueryString } from '../utils';

/**
 * Used to authenticate with Bullhorn OAuth Service and track session.
 * @class Staffing
 * @param {Object} config - object used to configure you bullhorn service
 * @param {string} [config.authUrl] URL to be used for Authentication
 * @param {string} [config.callbackUrl] URL to return to after authentication defaults to window.location
 * @param {string} [config.clientId] Bullhorn Client ID provided by the developer center.
 * @param {string} [config.clientSecret] Bullhorn Client Secret provided by the developer center.
 * @param {string} [config.apiVersion] API Version to target, defaults '*' (latest)
 * @example
 * ```
 * let conn = new Staffing({
 *      BhRestToken: '~BULLHORN_REST_TOKEN~',
 *      restUrl: '~BULLHORN_REST_ENDPOING~',
 * });
 * ```
 */
export class Staffing {
    public static unauthorized: Subject<any> = new Subject();
    private static _httpErrorSubscription: number;
    private static _http: AxiosInstance = axios.create({
        paramsSerializer: function (params) {
            return QueryString.stringify(params);
        }
    });
    public useCookies: boolean = false;
    public accessToken: string;

    public config: StaffingConfiguration = {
        client_id: 'UNDEFINED',
        client_secret: 'UNDEFINED',
        authorization_url: 'https://auth.bullhornstaffing.com/oauth/authorize',
        token_url: 'https://auth.bullhornstaffing.com/oauth/token',
        login_url: 'https://rest.bullhornstaffing.com/rest-services/login',
        redirect_url: 'http://localhost:3000',
        apiVersion: '*',
        useCookies: false
    };

    constructor(private options: StaffingConfiguration = {}) {
        this.config = Object.assign(this.config, options);
        this.useCookies = options.useCookies || false;
        if (options.BhRestToken) {
            Cache.put('BhRestToken', this.config.BhRestToken);
        } else {
            this.useCookies = true;
        }
        if (options.restUrl) {
            Cache.put('restUrl', this.config.restUrl);
        }
    }

    login(provider: StaffingAuthProvider): Promise<RestCredentials> {
        return provider.credential(this.config).then((credentials: RestCredentials) => {
            Cache.put('BhRestToken', credentials.BhRestToken);
            Cache.put('restUrl', credentials.restUrl);
            return credentials;
        });
    }

    isLoggedIn() {
        return this.ping();
    }
    /**
     * Retrieves the HttpService created to connect to the Bullhorn RestApi
     * @name http
     * @memberof Application#
     * @static
     * @return {HttpService}
     */
    static http(): AxiosInstance {
        let cookie = getCookie('UL_identity');
        if (cookie && cookie.length) {
            let identity = JSON.parse(JSON.parse(cookie));
            let endpoints = identity.sessions.reduce((obj, session) => {
                obj[session.name] = session.value.endpoint;
                return obj;
            }, {});
            this._http.defaults.baseURL = endpoints.rest;
            this._http.defaults.withCredentials = true;
        } else {
            let BhRestToken = Cache.get('BhRestToken');
            let endpoint = Cache.get('restUrl');
            if (BhRestToken && endpoint) {
                this._http.defaults.baseURL = endpoint;
                this._http.defaults.params = { BhRestToken };
                this._http.defaults.withCredentials = false;
            }
        }
        // Add a response interceptor
        this._httpErrorSubscription = this._http.interceptors.response.use((response: AxiosResponse<any>) => response, (error: any) => {
            // Check if Unauthorized Error
            if (error.response.status === 401) {
                Staffing.unauthorized.next(error);
            }
            return Promise.reject(error);
        });

        return this._http;
    }

    ping(): Promise<AxiosResponse> {
        let http = Staffing.http();
        return http.get('ping');
    }
}

function getCookie(cname) {
    if (document) {
        let name = `${cname}=`;
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
    }
    return false;
}
