import React from 'react';
import type { Student } from '../../types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, onClick, onEdit, onDelete }) => {
  const fullName = `${student.nombre} ${student.apellidoPaterno} ${student.apellidoMaterno || ''}`.trim();

  // Avatar string fallback (initials)
  const initials = `${student.nombre.charAt(0)}${student.apellidoPaterno.charAt(0)}`.toUpperCase();

  const getEstatusVariant = (estatus: string): "success" | "warning" | "danger" | "default" => {
    switch(estatus.toUpperCase()) {
      case 'ACTIVO': return 'success';
      case 'INACTIVO': return 'danger';
      case 'EGRESADO': return 'default';
      case 'BAJA': return 'danger';
      case 'SUSPENDIDO': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-soft hover:shadow-medium transition-all duration-300 relative group flex items-start gap-4 ${
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

      {/* Profile Section */}
      <div className="flex-shrink-0 mt-1">
        <Avatar name={initials} size="lg" className="bg-primary-container text-primary font-bold shadow-sm" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-base font-bold font-headline leading-tight text-on-surface truncate pr-8">
            {fullName}
          </h3>
        </div>
        
        <div className="text-xs font-label text-primary font-bold tracking-wider uppercase mb-2">
          {student.matricula}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant={getEstatusVariant(student.estatus || 'DESCONOCIDO')}>
            {student.estatus || 'DESCONOCIDO'}
          </Badge>
          <Badge variant="info">
            SEM {student.semestre}
          </Badge>
        </div>

        <p className="text-sm text-on-surface-variant font-medium truncate mb-2">
          {student.carrera || 'Carrera No Asignada'}
        </p>

        {(student.email || student.telefono) && (
          <div className="flex flex-col gap-1 text-xs text-on-surface-variant/80 mt-3 pt-3 border-t border-outline-variant/20">
            {student.email && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[14px]">mail</span>
                <span className="truncate">{student.email}</span>
              </div>
            )}
            {student.telefono && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[14px]">phone</span>
                <span>{student.telefono}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
