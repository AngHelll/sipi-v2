export interface CareerResponseDto {
  id: string;
  codigo: string;
  nombre: string;
  nombreCorto?: string | null;
  area?: string | null;
  duracionSemestres: number;
  estatus: string;
}

export interface CareersListResponseDto {
  careers: CareerResponseDto[];
}

export interface CareerQueryDto {
  estatus?: string;
  area?: string;
}
