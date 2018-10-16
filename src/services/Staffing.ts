import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios';
import { Subject } from 'rxjs';
import { RestCredentials, StaffingAuthProvider } from './StaffingAuthProvider';
import { StaffingConfiguration } from '../types';
import { Cache, QueryString } from '../utils';

const getCookie = (cname: string) => {
  // tslint:disable-next-line:no-typeof-undefined
  if (typeof document !== 'undefined') {
    const name = `${cname}=`;
    const ca = document.cookie.split(';');
    for (let c of ca) {
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  }
  return false;
};

/**
 * Used to authenticate with Bullhorn OAuth Service and track session.
 * @param config - object used to configure you bullhorn service
 * @param [config.authUrl] URL to be used for Authentication
 * @param [config.callbackUrl] URL to return to after authentication defaults to window.location
 * @param [config.clientId] Bullhorn Client ID provided by the developer center.
 * @param [config.clientSecret] Bullhorn Client Secret provided by the developer center.
 * @param [config.apiVersion] API Version to target, defaults '*' (latest)
 * @example
 * ```
 * let conn = new Staffing({
 *      BhRestToken: '~BULLHORN_REST_TOKEN~',
 *      restUrl: '~BULLHORN_REST_ENDPOING~',
 * });
 *
 * // Tracking request timings
 * Staffing.timingCallback = (url: string, time: number) {
 *   // do some tracking
 * }
 * ```
 */
export class Staffing {
  public static unauthorized: Subject<any> = new Subject();
  private static readonly _http: AxiosInstance = axios.create({
    paramsSerializer: (params: any) => {
      return QueryString.stringify(params);
    },
  });
  public useCookies: boolean = false;
  public accessToken: string;
  public static httpInitialized: boolean = false;
  // Setup tracking by providing this callback, example above
  public static trackingCallback: Function;

  public config: StaffingConfiguration = {
    client_id: 'UNDEFINED',
    client_secret: 'UNDEFINED',
    authorization_url: 'https://auth.bullhornstaffing.com/oauth/authorize',
    token_url: 'https://auth.bullhornstaffing.com/oauth/token',
    login_url: 'https://rest.bullhornstaffing.com/rest-services/login',
    redirect_url: 'https://localhost:3000',
    apiVersion: '*',
    useCookies: false,
  };

  constructor(private readonly options: StaffingConfiguration = {}) {
    this.config = { ...this.config, ...this.options };
    this.useCookies = options.useCookies || false;
    if (this.options.BhRestToken) {
      Cache.put('BhRestToken', this.config.BhRestToken);
    } else {
      this.useCookies = true;
    }
    if (this.options.restUrl) {
      Cache.put('restUrl', this.config.restUrl);
    }
  }

  async login(provider: StaffingAuthProvider): Promise<RestCredentials> {
    return provider.credential(this.config).then((credentials: RestCredentials) => {
      Cache.put('BhRestToken', credentials.BhRestToken);
      Cache.put('restUrl', credentials.restUrl);
      return credentials;
    });
  }

  async isLoggedIn(): Promise<AxiosResponse> {
    return this.ping();
  }
  /**
   * Retrieves the HttpService created to connect to the Bullhorn RestApi
   */
  static http(): AxiosInstance {
    const cookie = getCookie('UlEncodedIdentity');
    if (cookie && cookie.length) {
      const identity = JSON.parse(decodeURIComponent(cookie));
      const endpoints = identity.sessions.reduce((obj, session) => {
        obj[session.name] = session.value.endpoint;
        return obj;
      }, {});
      Staffing._http.defaults.baseURL = endpoints.rest;
      Staffing._http.defaults.withCredentials = true;
    } else {
      // tslint:disable-next-line:variable-name
      const BhRestToken = Cache.get('BhRestToken');
      const endpoint = Cache.get('restUrl');
      if (BhRestToken && endpoint) {
        Staffing._http.defaults.baseURL = endpoint;
        Staffing._http.defaults.params = { BhRestToken };
        Staffing._http.defaults.withCredentials = false;
      }
    }

    if (!Staffing.httpInitialized) {
      Staffing.httpInitialized = true;
      // Add a response interceptor
      Staffing._http.interceptors.response.use(
        (response: AxiosResponse) => {
          // Tracking
          const timing: { start: number; url: string } = (response.config as any)._timing || undefined;
          if (Staffing.trackingCallback && timing) {
            Staffing.trackingCallback(timing.url, new Date().getTime() - timing.start);
          }
          return response;
        },
        async (error: AxiosError) => {
          // Tracking
          const errorResponse: AxiosResponse = error.response;
          const timing: { start: number; url: string } = (errorResponse.config as any)._timing || {};
          if (Staffing.trackingCallback && timing) {
            Staffing.trackingCallback(timing.url, new Date().getTime() - timing.start);
          }
          // Check if Unauthorized Error
          if (error.response.status === 401) {
            Staffing.unauthorized.next(error);
          }
          return Promise.reject(error);
        },
      );
      // Add a request interceptor
      Staffing._http.interceptors.request.use((config: AxiosRequestConfig) => {
        // Set a timing config so that we can track request times
        (config as any)._timing = {
          start: new Date().getTime(),
          url: (config.url || '').replace(config.baseURL || '', '').split('?')[0],
        };
        return config;
      });
    }

    return Staffing._http;
  }

  async ping(): Promise<AxiosResponse> {
    const http = Staffing.http();
    return http.get('ping');
  }
}
