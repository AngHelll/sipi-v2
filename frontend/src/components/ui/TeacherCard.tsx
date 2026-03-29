import React from 'react';
import type { Teacher } from '../../types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';

interface TeacherCardProps {
  teacher: Teacher;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, onClick, onEdit, onDelete }) => {
  const fullName = `${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno || ''}`.trim();

  // Avatar string fallback (initials)
  const initials = `${teacher.nombre.charAt(0)}${teacher.apellidoPaterno.charAt(0)}`.toUpperCase();

  const getEstatusVariant = (estatus: string): "success" | "warning" | "danger" | "default" | "info" => {
    switch(estatus.toUpperCase()) {
      case 'ACTIVO': return 'success';
      case 'INACTIVO': return 'danger';
      case 'JUBILADO': return 'default';
      case 'LICENCIA': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-soft hover:shadow-medium transition-all duration-300 relative group flex flex-col justify-between ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Admin Actions */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-surface/80 backdrop-blur-md rounded-lg p-1 border border-outline-variant/20 shadow-sm" onClick={e => e.stopPropagation()}>
          {onEdit && (
            <button onClick={onEdit} className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors" title="Editar">
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={initials} size="md" className="bg-secondary-container text-secondary font-bold shadow-sm" />
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-base font-bold font-headline leading-tight text-on-surface truncate">
              {fullName}
            </h3>
            <p className="text-sm font-medium text-on-surface-variant truncate">
              {teacher.departamento || 'Sin departamento'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={getEstatusVariant(teacher.estatus || 'DESCONOCIDO')}>
            {teacher.estatus || 'DESCONOCIDO'}
          </Badge>
          <Badge variant="info">
            {teacher.gruposAsignados || 0} Grupos
          </Badge>
        </div>
      </div>

      {(teacher.email || teacher.telefono) && (
        <div className="flex flex-col gap-1 text-xs text-on-surface-variant/80 mt-1 pt-3 border-t border-outline-variant/20">
          {teacher.email && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-[14px]">mail</span>
              <span className="truncate">{teacher.email}</span>
            </div>
          )}
          {teacher.telefono && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-[14px]">phone</span>
              <span>{teacher.telefono}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
