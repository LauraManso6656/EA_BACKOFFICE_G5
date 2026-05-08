import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BugReport } from '../models/bug';

@Injectable({
  providedIn: 'root'
})
export class BugService {
  private apiUrl = 'http://localhost:1337/bugs';

  constructor(private http: HttpClient) {}

  getBugs(
    page: number = 1, 
    limit: number = 10,
    estado: string = 'all',
    plataforma: string = 'all',
    activeOnly: boolean = false
  ): Observable<any> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (estado !== 'all') url += `&estado=${estado}`;
    if (plataforma !== 'all') url += `&plataforma=${plataforma}`;
    if (activeOnly) url += `&activeOnly=true`;
    return this.http.get<any>(url);
  }

  getBug(id: string): Observable<BugReport> {
    return this.http.get<BugReport>(`${this.apiUrl}/${id}`);
  }

  updateBugStatus(id: string, estado: string): Observable<BugReport> {
    return this.http.patch<BugReport>(`${this.apiUrl}/${id}/status`, { estado });
  }

  deleteBug(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
