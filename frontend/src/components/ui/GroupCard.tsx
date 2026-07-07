import React, { useState } from 'react';
import type { Group } from '../../types';

interface GroupCardProps {
  group: Group;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  /** Duplica el grupo para un nuevo periodo (pre-llena el alta). */
  onDuplicate?: (e: React.MouseEvent) => void;
  /** Cierra el curso (estatus → FINALIZADO). */
  onClose?: (e: React.MouseEvent) => void;
  /** Restaura un grupo dado de baja (historial). */
  onRestore?: (e: React.MouseEvent) => void;
  /** Nº de alumnos sin calificar (contexto maestro); si > 0 muestra un badge. */
  pendingGrades?: number;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onClick, onEdit, onDelete, onDuplicate, onClose, onRestore, pendingGrades }) => {
  const [menuOpen, setMenuOpen] = useState(false);
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

      {/* Admin Actions — menú compacto (kebab) para no saturar la tarjeta */}
      {(onEdit || onDelete || onDuplicate || onClose || onRestore) && (
        <div className="absolute top-4 right-4 z-30" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors bg-surface/80 backdrop-blur-md border border-outline-variant/20 shadow-sm"
            title="Acciones"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop para cerrar al hacer clic fuera */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 mt-1 w-48 z-20 bg-surface-container-lowest rounded-xl shadow-medium border border-outline-variant/20 py-1 overflow-hidden"
              >
                {onEdit && (
                  <button
                    role="menuitem"
                    onClick={(e) => { setMenuOpen(false); onEdit(e); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
                    Editar
                  </button>
                )}
                {onDuplicate && (
                  <button
                    role="menuitem"
                    onClick={(e) => { setMenuOpen(false); onDuplicate(e); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">content_copy</span>
                    Duplicar
                  </button>
                )}
                {onClose && (
                  <button
                    role="menuitem"
                    onClick={(e) => { setMenuOpen(false); onClose(e); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-secondary-fixed-variant">lock</span>
                    Cerrar curso
                  </button>
                )}
                {onRestore && (
                  <button
                    role="menuitem"
                    onClick={(e) => { setMenuOpen(false); onRestore(e); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">restore</span>
                    Restaurar
                  </button>
                )}
                {onDelete && (
                  <button
                    role="menuitem"
                    onClick={(e) => { setMenuOpen(false); onDelete(e); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error-container transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Eliminar
                  </button>
                )}
              </div>
            </>
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
                    ? 'bg-primary-fixed text-on-primary-fixed-variant'
                    : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                {group.estatus}
              </span>
            )}
            {group.esCursoIngles && (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-tertiary-container/20 text-tertiary inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">translate</span>
                Inglés{group.nivelIngles ? ` · N${group.nivelIngles}` : ''}
              </span>
            )}
            {pendingGrades !== undefined && pendingGrades > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-secondary-fixed text-on-secondary-fixed-variant inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">pending_actions</span>
                {pendingGrades} sin calificar
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
                ? 'bg-error' 
                : capacityPercent >= 80 
                  ? 'bg-secondary' 
                  : 'bg-primary'
            }`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
