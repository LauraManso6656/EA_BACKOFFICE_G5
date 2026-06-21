import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AsignaturaService {
  private baseUrl = environment.apiUrl;
  private apiUrl = this.baseUrl + '/asignaturas';

  constructor(private http: HttpClient) { }

  getAsignaturas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getAsignatura(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createAsignatura(asignatura: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, asignatura);
  }

  updateAsignatura(id: string, asignatura: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, asignatura);
  }

  deleteAsignatura(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
