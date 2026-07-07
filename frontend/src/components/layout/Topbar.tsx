// Top bar — sticky dentro del área principal; logo solo en móvil
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearch } from '../ui/GlobalSearch';
import { AvatarDropdown } from '../ui/Avatar';
import { UserRole } from '../../types';
import { navItems } from '../../lib/navigation';
import { ds } from '../../lib/designSystem';

const roleLabels: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Estudiante',
  [UserRole.TEACHER]: 'Maestro',
  [UserRole.ADMIN]: 'Administrador',
};

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const mainItems = navItems.filter(
    (item) => item.roles.includes(user.role as UserRole) && item.isMain
  );
  const hasSubItems = navItems.some(
    (item) => item.roles.includes(user.role as UserRole) && !item.isMain
  );

  return (
    <header
      className={`sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 ${ds.layout.contentShell} py-4 flex items-center gap-4`}
    >
      {/* Móvil: menú + marca */}
      <div className="flex items-center gap-3 lg:hidden shrink-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <Link to="/dashboard" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-2xl">account_balance</span>
          <span className="font-headline text-headline-md font-bold tracking-tight">SIPI</span>
        </Link>
      </div>

      {user.role === UserRole.ADMIN && (
        <div className="hidden lg:block w-full max-w-sm shrink-0">
          <GlobalSearch />
        </div>
      )}

      <nav className="hidden md:flex items-center gap-6 flex-1 justify-center min-w-0">
        {mainItems.map((item) => {
          const isActive =
            item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`text-body-md transition-colors pb-0.5 border-b-2 ${
                isActive
                  ? 'text-primary font-bold border-primary'
                  : 'text-on-surface-variant border-transparent hover:text-primary'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        {hasSubItems && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex items-center gap-1 text-body-md text-on-surface-variant hover:text-primary transition-colors lg:hidden"
          >
            Más
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        )}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
        {user.role === UserRole.ADMIN && (
          <button
            type="button"
            className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
            aria-label="Buscar"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
        )}
        <AvatarDropdown name={user.username} role={roleLabels[user.role]}>
          <button
            type="button"
            onClick={logout}
            className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container transition-colors font-sans flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar sesión
          </button>
        </AvatarDropdown>
      </div>
    </header>
  );
};
