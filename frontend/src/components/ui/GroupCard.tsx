import React from 'react';
import type { Group } from '../../types';

interface GroupCardProps {
  group: Group;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onClick, onEdit, onDelete }) => {
  const isEstatusAbierto = group.estatus === 'ABIERTO';
  
  // Calculate capacity percentage safely
  const capacityPercent = group.cupoMaximo 
    ? Math.min(100, Math.round(((group.cupoActual || 0) / group.cupoMaximo) * 100))
    : 0;

  return (
    <div
      onClick={onClick}
      className={`bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 relative overflow-hidden flex flex-col justify-between group h-full ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Decorative gradient header */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />

      {/* Admin Actions */}
      {(onEdit || onDelete) && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-surface/80 backdrop-blur-md rounded-lg p-1 border border-outline-variant/20 shadow-sm" onClick={e => e.stopPropagation()}>
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors" title="Editar">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
      )}

      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-secondary font-bold text-[10px] sm:text-xs uppercase tracking-widest font-label bg-secondary-container/20 px-2 py-0.5 rounded-md">
              {group.codigo || group.nombre}
            </span>
            <span className="text-primary font-bold text-[10px] sm:text-xs uppercase tracking-widest font-label bg-primary-container/20 px-2 py-0.5 rounded-md">
              {group.periodo}
            </span>
            {group.estatus && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                  isEstatusAbierto
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                {group.estatus}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold font-headline leading-tight text-on-surface mb-1 line-clamp-1">
          {group.subject?.nombre || 'Materia No Asignada'}
        </h3>
        
        <p className="text-sm text-on-surface-variant font-medium flex items-center gap-1.5 mb-4">
          <span className="material-symbols-outlined text-[16px]">person</span>
          {group.teacher 
            ? `${group.teacher.nombre} ${group.teacher.apellidoPaterno}`
            : 'Sin profesor asignado'}
        </p>

        {group.horario && (
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4 bg-surface rounded-lg px-2.5 py-1.5 border border-outline-variant/20 w-fit">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>{group.horario}</span>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5 mt-2">
          <span className="text-on-surface-variant">Ocupación</span>
          <span className="text-primary">{group.cupoActual || 0} / {group.cupoMaximo || 0}</span>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-1.5 rounded-full ${
              capacityPercent >= 100 
                ? 'bg-red-500' 
                : capacityPercent >= 80 
                  ? 'bg-orange-500' 
                  : 'bg-primary'
            }`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
