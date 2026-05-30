import { Usuario } from './usuario';

export interface Comment {
  _id: string;
  usuario: Usuario;
  texto: string;
  createdAt?: string;
}

export interface Post {
  _id: string;
  usuario: string | Usuario;
  imageUrl?: string;
  caption?: string;
  likes: string[];
  comments: string[] | Comment[];
  createdAt?: string;
  updatedAt?: string;
}
