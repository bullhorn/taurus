import axios, { AxiosResponse } from 'axios';
import { QueryString } from '../utils';
import { StaffingConfiguration } from '../types';

export interface RestCredentials {
  BhRestToken: string;
  restUrl: string;
}

export interface StaffingAuthProvider {
  credential(config: StaffingConfiguration): Promise<RestCredentials>;
}

export class StaffingOAuthBaseProvider {
    config: StaffingConfiguration;
    protected async validateCode(authCode): Promise<any> {
        return axios.post(`${this.config.token_url}?grant_type=authorization_code&code=${authCode}&client_id=${this.config.client_id}&client_secret=${this.config.client_secret}`)
            .then((response: AxiosResponse) => {
                return response.data;
            });
    }
    protected async restLogin(accessToken): Promise<RestCredentials> {
        const ttl = this.config.ttl ? `&ttl=${this.config.ttl}` : '';
        return axios.post(`${this.config.login_url}?version=*&access_token=${accessToken}${ttl}`)
            .then((response: AxiosResponse) => {
                return response.data;
            });
    }
}

export class StaffingCredentialsAuthProvider implements StaffingAuthProvider {
  constructor(private readonly username: string, private readonly password: string) {}
  async credential(config: StaffingConfiguration): Promise<RestCredentials> {
    return axios.get(`${config.login_url}?version=*&username=${this.username}&password=${this.password}&clientId=${config.client_id}`).then(response => response.data);
  }
}

export class StaffingOAuthProvider extends StaffingOAuthBaseProvider implements StaffingAuthProvider {
  async credential(config): Promise<RestCredentials> {
    this.config = config;
    const authCode = await this.getAuthCode();
    const tokens = await this.validateCode(authCode);
    return this.restLogin(tokens.access_token);
  }

  private async getAuthCode(): Promise<string> {
    try {
      const response = await axios.get(`${this.config.authorization_url}`, {
        params: {
          client_id: this.config.client_id,
          response_type: 'code',
          action: 'Login',
          // TODO: is there any way how could we get AuthCode without username and password?
          username: this.config.username,
          password: this.config.password,
        },
      });
      // TODO: is there a better way how to get AuthCode from url?
      return response.request.path
        .split('?code=')
        .pop()
        .split('&')
        .shift();
    } catch (error) {
      console.warn('Error retrieving AuthCode', error.message);
      throw error;
    }
  }
}

export class StaffingOAuthPopupProvider extends StaffingOAuthBaseProvider implements StaffingAuthProvider {
  config: StaffingConfiguration;
  async credential(config): Promise<RestCredentials> {
    this.config = config;
    const params: string = 'location=0,status=0,width=800,height=600';
    const url = `${config.authorization_url}?response_type=code&clientId=${config.client_id}&redirect_uri=${config.redirect_url}`;
    const authWindow = window.open(url, 'bhAuthWindow', params);

    return this.getAuthCode(authWindow)
      .then(this.validateCode)
      .then(this.restLogin);
  }

  private async getAuthCode(authWindow) {
    return Promise.resolve().then(() => {
      const interval = window.setInterval(() => {
        try {
          if (authWindow.document.URL.indexOf(this.config.redirect_url) !== -1) {
            window.clearInterval(interval);
            const qs: any = QueryString.destruct(authWindow.document.URL);
            // Const authCode = qs.params.auth_code;
            authWindow.close();
            return qs.params.access_token;
          }
        } catch (err) {
          // Do Something Maybe?
          console.warn('Error retrieving AuthCode', err.message);
        }
      }, 1000);
    });
  }
}
