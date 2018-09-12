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

export class StaffingCredentialsAuthProvider implements StaffingAuthProvider {
  constructor(private readonly username: string, private readonly password: string) {}
  async credential(config: StaffingConfiguration): Promise<RestCredentials> {
    return axios.get(`${config.login_url}?version=*&username=${this.username}&password=${this.password}&clientId=${config.client_id}`).then((response) => response.data);
  }
}

export class StaffingOAuthPopupProvider implements StaffingAuthProvider {
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
  private async validateCode(authCode): Promise<any> {
    return axios
      .post(`${this.config.token_url}?grant_type=authorization_code&code=${authCode}&client_id=${this.config.client_id}&client_secret=${this.config.client_secret}`)
      .then((response: AxiosResponse) => {
        return response.data;
      });
  }
  private async restLogin(accessToken): Promise<RestCredentials> {
    return axios.post(`${this.config.login_url}?version=*&access_token=${accessToken}`).then((response: AxiosResponse) => {
      return response.data;
    });
  }
}
