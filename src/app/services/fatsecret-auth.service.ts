import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface FatSecretTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

@Injectable({ providedIn: 'root' })
export class FatSecretAuthService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.tokenExpiry && now < this.tokenExpiry) {
      return this.token;
    }
    await this.fetchAccessToken();
    if (!this.token) throw new Error('Unable to obtain FatSecret access token');
    return this.token;
  }

  /**
   * Fetch a new access token from FatSecret
   */
  private async fetchAccessToken(): Promise<void> {
    const url = 'https://oauth.fatsecret.com/connect/token';
    const body = new HttpParams()
      .set('grant_type', 'client_credentials')
      .set('scope', 'basic');
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        btoa(
          `${environment.nutritionApi.clientId}:${environment.nutritionApi.clientSecret}`
        ),
    });
    const response = await this.http
      .post<FatSecretTokenResponse>(url, body, { headers })
      .toPromise();
    if (response && response.access_token) {
      this.token = response.access_token;
      this.tokenExpiry = Date.now() + (response.expires_in - 60) * 1000; // 60s buffer
    } else {
      this.token = null;
      this.tokenExpiry = null;
    }
  }
}
