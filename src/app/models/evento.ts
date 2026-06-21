export interface Evento {
  _id: string;
  titulo: string;
  descripcion: string;
  fecha: Date | string;
  fechaLimite?: Date | string | null;
  ubicacionNombre: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  creador: any;
  asistentes: any[];
  maxAsistentes?: number | null;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
