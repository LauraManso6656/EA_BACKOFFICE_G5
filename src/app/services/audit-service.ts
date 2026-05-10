import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminLog {
  _id: string;
  admin: {
    _id: string;
    nombre: string;
    email: string;
    avatarUrl?: string;
  };
  accion: string;
  tipoObjetivo: string;
  objetivoId: string;
  detalles: string;
  metadata?: any;
  ip?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:1337/audit/logs';

  getLogs(page: number = 1, limit: number = 20, filters: any = {}): Observable<any> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        url += `&${key}=${filters[key]}`;
      }
    });

    return this.http.get<any>(url);
  }
}
