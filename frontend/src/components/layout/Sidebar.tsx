// Sidebar component morphed into an Off-Canvas Drawer for all screen sizes
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { navItems } from '../../lib/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Render all allowed items in the Drawer
  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role as UserRole)
  );

  // Items sin sección forman el bloque superior; el resto se agrupa por sección
  // (en orden de primera aparición) con su encabezado.
  const topItems = filteredNavItems.filter((item) => !item.section);
  const sectionOrder: string[] = [];
  for (const item of filteredNavItems) {
    if (item.section && !sectionOrder.includes(item.section)) {
      sectionOrder.push(item.section);
    }
  }

  const isItemActive = (path: string) => {
    const isActive = location.pathname.startsWith(path) && path !== '/dashboard';
    const isDashboardActive = location.pathname === '/dashboard' && path === '/dashboard';
    return isActive || isDashboardActive;
  };

  const renderItem = (item: (typeof navItems)[number]) => {
    const isCurrentlyActive = isItemActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sans font-medium ${
          isCurrentlyActive
            ? 'bg-primary-container/10 text-primary font-bold'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
        }`}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: isCurrentlyActive ? "'FILL' 1" : "'FILL' 0" }}
        >
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface text-on-surface transform transition-transform duration-300 ease-in-out shadow-strong border-r border-outline-variant/30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
            <div>
              <h2 className="text-xl font-bold font-headline tracking-tight text-primary">SIPI</h2>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Gestión Académica</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            aria-label="Cerrar menú"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="mt-4 flex-1 overflow-y-auto px-4 pb-6 space-y-1">
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-3 mt-4 ml-2">Menú Principal</div>
          {topItems.map(renderItem)}

          {sectionOrder.map((section) => (
            <div key={section}>
              <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-3 mt-6 ml-2">
                {section}
              </div>
              {filteredNavItems.filter((item) => item.section === section).map(renderItem)}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};
