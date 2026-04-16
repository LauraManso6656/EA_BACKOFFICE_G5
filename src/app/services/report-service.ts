import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Report } from '../models/report';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:1337/reports';

  constructor(private http: HttpClient) {}

  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.apiUrl);
  }

  getReport(id: string): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}`);
  }

  updateReportStatus(id: string, estado: string): Observable<Report> {
    return this.http.patch<Report>(`${this.apiUrl}/${id}/status`, { estado });
  }

  deleteReport(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
