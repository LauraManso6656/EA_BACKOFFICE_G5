import { Usuario } from './usuario';

export type ReportType = 'user' | 'post' | 'comment';
export type ReportStatus = 'pendiente' | 'revisado' | 'resuelto';

export interface Report {
    _id: string;
    usuarioReporta: string | Usuario;
    tipo: ReportType;
    objetivoId: string;
    descripcion: string;
    estado: ReportStatus;
    createdAt?: string;
    updatedAt?: string;
}
