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

  // Calculate items to show: up to 3 main items + 1 menu button
  const mainItems = navItems.filter((item) => 
    item.roles.includes(user.role as UserRole) && item.isMain
  ).slice(0, 3); // Max 3 items on bottom nav (+1 menu)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-2 h-16 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md border-t-[0.5px] border-primary/5 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {mainItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-150 ${
              isActive 
                ? 'text-secondary font-bold' 
                : 'text-primary-container/50 hover:text-secondary'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
              {item.icon}
            </span>
            <span className="font-label text-[11px] font-medium tracking-wide uppercase mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Static Menu Option */}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center justify-center text-primary-container/50 hover:text-secondary transition-colors active:scale-90 duration-150"
      >
        <span className="material-symbols-outlined">menu</span>
        <span className="font-label text-[11px] font-medium tracking-wide uppercase mt-1">Menú</span>
      </button>
    </nav>
  );
};
