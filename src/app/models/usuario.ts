import { Universidad } from "./universidad";

export interface Usuario {
    _id: string;
    nombre: string;
    email: string;
    password: string;
    rol: 'admin' | 'user';
    universidad?: Universidad;
    activo: boolean;
    privado: boolean;
    seguidores?: any[];
    seguidos?: any[];
}
