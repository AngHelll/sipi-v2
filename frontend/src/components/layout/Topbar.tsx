// TopAppBar component with inline navigation, user info, and avatar
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearch } from '../ui/GlobalSearch';
import { AvatarDropdown } from '../ui/Avatar';
import { UserRole } from '../../types';
import { navItems } from '../../lib/navigation';

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

  // Render navigation links based on user role and visibility (isMain)
  const renderNavLinks = () => {
    const mainItems = navItems.filter(
      (item) => item.roles.includes(user.role as UserRole) && item.isMain
    );
    const hasSubItems = navItems.filter(
      (item) => item.roles.includes(user.role as UserRole) && !item.isMain
    ).length > 0;

    return (
      <nav className="hidden md:flex gap-8 items-center h-full">
        {mainItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`font-label tracking-tight text-lg transition-all px-2 rounded-lg py-1 ${
                isActive
                  ? 'text-primary dark:text-[#f2f2f2] font-bold'
                  : 'text-primary-container/60 dark:text-[#f2f2f2]/60 hover:bg-surface-container-low dark:hover:bg-[#1a1a1a]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        {/* Draw a menu button if user has extra options (e.g. Admin) */}
        {hasSubItems && (
          <button
            onClick={onMenuClick}
            className="flex items-center gap-1 font-label tracking-tight text-lg text-primary-container/60 dark:text-[#f2f2f2]/60 hover:bg-surface-container-low dark:hover:bg-[#1a1a1a] transition-all px-2 rounded-lg py-1"
          >
            Administración <span className="material-symbols-outlined text-[20px]">arrow_drop_down</span>
          </button>
        )}
      </nav>
    );
  };

  return (
    <header className="flex justify-between items-center w-full px-6 py-4 bg-surface/80 dark:bg-[#121212]/80 backdrop-blur-xl fixed top-0 z-30 transition-colors duration-300 border-b border-outline-variant/20">
      {/* Left section: Logo */}
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger explicitly placed here for accessibility or if preferred, though it's inside BottomNav too */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1 rounded-lg text-primary hover:bg-surface-container-low transition-colors"
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <Link to="/dashboard" className="flex items-center gap-4 text-primary dark:text-[#f2f2f2]">
          <span className="material-symbols-outlined text-3xl">account_balance</span>
          <h1 className="text-2xl font-black tracking-[-0.02em] font-headline">SIPI</h1>
        </Link>
      </div>

      {/* Center/Right section: Search & Navigation */}
      <div className="flex items-center gap-6">
        {/* Only Admins/Teachers get global search visible on desktop to save space */}
        <div className="hidden lg:flex w-64 mr-4">
          <GlobalSearch />
        </div>

        {/* Dynamic Nav Links */}
        {renderNavLinks()}

        {/* User profile actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <AvatarDropdown name={user.username} role={roleLabels[user.role]}>
            <button
              onClick={logout}
              className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container transition-colors font-sans flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Cerrar Sesión
            </button>
          </AvatarDropdown>
        </div>
      </div>
    </header>
  );
};
