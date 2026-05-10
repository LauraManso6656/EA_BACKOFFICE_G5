import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private baseUrl = environment.apiUrl;
  private apiUrl = this.baseUrl +'/usuarios';

  constructor(private http: HttpClient) { }

  getUsuarios(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<any>(url);
  }

  getUsuario(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  createUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  updateUsuario(id: string, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  // Soft Delete: Marca como inactivo (normalmente se usa PATCH o un endpoint específico)
  softDeleteUsuario(id: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}/soft-delete`, {});
  }

  // Hard Delete: Elimina definitivamente de la BD (normalmente se usa DELETE)
  hardDeleteUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Recovery: Recupera un usuario inactivo
  recoveryUsuario(id: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}/recovery`, {});
  }
}
