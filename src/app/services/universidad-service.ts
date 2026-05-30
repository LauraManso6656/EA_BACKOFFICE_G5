import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Universidad } from '../models/universidad';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UniversidadService {
  private baseUrl = environment.apiUrl;
  private apiUrl = this.baseUrl + '/universidades';

  constructor(private http: HttpClient) {}

  getUniversidades(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<any>(url);
  }

  getUniversidad(id: string): Observable<Universidad> {
    return this.http.get<Universidad>(`${this.apiUrl}/${id}`);
  }

  createUniversidad(universidad: Universidad): Observable<Universidad> {
    return this.http.post<Universidad>(this.apiUrl, universidad);
  }

  updateUniversidad(id: string, universidad: Universidad): Observable<Universidad> {
    return this.http.patch<Universidad>(`${this.apiUrl}/${id}`, universidad);
  }

  deleteUniversidad(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
