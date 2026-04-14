import { Usuario } from './usuario';

export interface Universidad {
    _id: string;
    nombre: string;
    ubicacion: string;
    usuarios: Usuario[]; // Solo para el detalle
    numIntegrantes?: number; // Para el listado
}
