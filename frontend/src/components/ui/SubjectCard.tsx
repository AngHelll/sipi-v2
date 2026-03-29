import React from 'react';
import type { Subject } from '../../types';

interface SubjectCardProps {
  subject: Subject;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, onEdit, onDelete }) => {
  const isEstatusActiva = subject.estatus === 'ACTIVA';

  return (
    <div
      onClick={onClick}
      className={`bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 relative overflow-hidden group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/20 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>

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

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined rounded-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              menu_book
            </span>
          </div>
          <div>
            <span className="text-xs font-bold font-label tracking-widest text-secondary uppercase block mb-0.5">
              {subject.clave}
            </span>
            <div className="flex gap-2 items-center">
              {subject.estatus && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isEstatusActiva
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-surface-variant text-on-surface-variant'
                  }`}
                >
                  {subject.estatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-lg font-bold font-headline leading-tight text-on-surface mb-2 line-clamp-2">
          {subject.nombre}
        </h3>
        
        <div className="mt-4 flex items-center gap-4 text-sm text-on-surface-variant font-sans">
          <div className="flex items-center gap-1.5" title="Créditos">
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            <span className="font-medium">{subject.creditos} Cr.</span>
          </div>
          <div className="flex items-center gap-1.5" title="Grupos Activos">
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span className="font-medium">{subject.gruposActivos || 0} Grupos</span>
          </div>
        </div>
      </div>
    </div>
  );
};
