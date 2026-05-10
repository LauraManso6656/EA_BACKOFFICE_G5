import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GlobalStats {
  users: number;
  universities: number;
  posts: number;
  comments: number;
  reports: number;
  dbStatus?: 'online' | 'offline';
}

export interface ReportStats {
  total: number;
  user: number;
  post: number;
  comment: number;
  chat: number;
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private apiUrl = 'http://localhost:1337/stats';

  constructor(private http: HttpClient) { }

  getGlobalStats(): Observable<GlobalStats> {
    return this.http.get<GlobalStats>(`${this.apiUrl}/all`);
  }

  getUserCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/users`);
  }

  getUniversityCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/universities`);
  }

  getPostCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/posts`);
  }

  getCommentCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/comments`);
  }

  getReportStats(): Observable<ReportStats> {
    return this.http.get<ReportStats>(`${this.apiUrl}/reports`);
  }
}
