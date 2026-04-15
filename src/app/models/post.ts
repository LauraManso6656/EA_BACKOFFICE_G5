import { Usuario } from './usuario';

export interface Post {
    _id: string;
    usuario: string | Usuario;
    imageUrl?: string;
    caption?: string;
    likes: string[];
    comments: string[];
    createdAt?: string;
    updatedAt?: string;
}
