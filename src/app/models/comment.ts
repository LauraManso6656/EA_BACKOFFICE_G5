import { Usuario } from './usuario';
import { Post } from './post';

export interface Comment {
    _id: string;
    usuario: string | Usuario;
    post: string | Post;
    texto: string;
    createdAt?: string;
    updatedAt?: string;
}
