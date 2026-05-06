import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:1337/auth';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (isPlatformBrowser(this.platformId)) {
          if (res.accessToken) localStorage.setItem('token', res.accessToken);
          if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
        }
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<any>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(res => {
        if (res.accessToken && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', res.accessToken);
          if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
        }
      })
    );
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
