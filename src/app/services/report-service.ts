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

  getReports(
    page: number = 1, 
    limit: number = 10,
    search: string = '',
    tipo: string = 'all',
    activeOnly: boolean = false,
    startDate: string = '',
    endDate: string = '',
    estado: string = 'all'
  ): Observable<any> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tipo !== 'all') url += `&tipo=${tipo}`;
    if (activeOnly) url += `&activeOnly=true`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (estado !== 'all') url += `&estado=${estado}`;
    
    return this.http.get<any>(url);
  }

  getReportsForUser(userId: string, page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}?page=${page}&limit=${limit}`);
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
