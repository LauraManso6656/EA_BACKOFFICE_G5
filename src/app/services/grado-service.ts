import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GradoService {
  private baseUrl = environment.apiUrl;
  private apiUrl = this.baseUrl + '/grados';

  constructor(private http: HttpClient) { }

  getGradosByUniversidad(universidadId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/universidad/${universidadId}`);
  }

  getGrado(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createGrado(grado: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, grado);
  }

  updateGrado(id: string, grado: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, grado);
  }

  deleteGrado(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAsignaturasByGrado(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/asignaturas`);
  }
}
