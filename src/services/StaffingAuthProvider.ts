import axios, { AxiosInstance, AxiosResponse } from 'axios';
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
    constructor(private username: string, private password: string) { }
    credential(config: StaffingConfiguration): Promise<RestCredentials> {
        return axios.get(`${config.login_url}?version=*&username=${this.username}&password=${this.password}&clientId=${config.client_id}`)
            .then((response) => response.data);
    }
}

export class StaffingOAuthPopupProvider implements StaffingAuthProvider {
    config: StaffingConfiguration;
    credential(config): Promise<RestCredentials> {
        this.config = config;
        let params: string = 'location=0,status=0,width=800,height=600';
        let url = `${config.authorization_url}?response_type=code&clientId=${config.client_id}&redirect_uri=${config.redirect_url}`
        let auth_window = window.open(url, 'bhAuthWindow', params);

        return this.getAuthCode(auth_window)
            .then(this.validateCode)
            .then(this.restLogin);
    }

    private getAuthCode(auth_window) {
        return new Promise((resolve, reject) => {
            let interval = window.setInterval(() => {
                try {
                    if (auth_window.document.URL.indexOf(this.config.redirect_url) !== -1) {
                        window.clearInterval(interval);
                        let qs: any = QueryString.destruct(auth_window.document.URL);
                        let auth_code = qs.params.auth_code;
                        auth_window.close();
                        return qs.params.access_token;
                    }
                } catch (e) {
                    // Do Something Maybe?
                }
            }, 1000);
        });
    }
    private validateCode(auth_code) {
        return axios.post(`${this.config.token_url}?grant_type=authorization_code&code=${auth_code}&client_id=${this.config.client_id}&client_secret=${this.config.client_secret}`)
            .then((response: AxiosResponse) => {
                return response.data;
            });
    }
    private restLogin(access_token): Promise<RestCredentials> {
        return axios.post(`${this.config.login_url}?version=*&access_token=${access_token}`)
            .then((response: AxiosResponse) => {
                return response.data;
            });
    }
}
