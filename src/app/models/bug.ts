import { Usuario } from './usuario';

export type BugStatus = 'pendiente' | 'en_progreso' | 'resuelto' | 'rechazado';
export type BugPlatform = 'web' | 'app' | 'otro';

export interface BugReport {
  _id: string;
  usuarioReporta: string | Usuario;
  titulo: string;
  descripcion: string;
  comoReplicarlo: string;
  imageUrls: string[];
  estado: BugStatus;
  plataforma: BugPlatform;
  createdAt?: string;
  updatedAt?: string;
}
