import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { navItems } from '../../lib/navigation';

interface BottomNavProps {
  onMenuClick: () => void;
}

export const BottomNav = ({ onMenuClick }: BottomNavProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const mainItems = navItems
    .filter((item) => item.roles.includes(user.role as UserRole) && item.isMain)
    .slice(0, 3);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-2 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(4,47,44,0.05)]">
      {mainItems.map((item) => {
        const isActive =
          item.path === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center transition-colors active:scale-95 duration-150 ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className="text-label-sm mt-0.5 truncate max-w-[72px]">{item.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onMenuClick}
        className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-95 duration-150"
      >
        <span className="material-symbols-outlined text-[22px]">menu</span>
        <span className="text-label-sm mt-0.5">Menú</span>
      </button>
    </nav>
  );
};
