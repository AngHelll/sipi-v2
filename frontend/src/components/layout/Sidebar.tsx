// Sidebar — fijo en desktop (Stitch W4), drawer en móvil
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { navItems, type NavItem } from '../../lib/navigation';
import { ds } from '../../lib/designSystem';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const isPathActive = (pathname: string, path: string) => {
  if (path === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(path);
};

function SidebarBrand() {
  return (
    <div className="mb-8 px-2 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-tertiary text-2xl">account_balance</span>
      </div>
      <div>
        <h1 className="font-headline text-headline-md leading-tight text-on-primary">SIPI</h1>
        <p className="text-xs text-on-primary/70">Gestión Académica</p>
      </div>
    </div>
  );
}

function SidebarNav({
  onNavigate,
  showClose,
  onClose,
}: {
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role as UserRole)
  );
  const topItems = filteredNavItems.filter((item) => !item.section);
  const sectionOrder: string[] = [];
  for (const item of filteredNavItems) {
    if (item.section && !sectionOrder.includes(item.section)) {
      sectionOrder.push(item.section);
    }
  }

  const renderItem = (item: NavItem) => {
    const active = isPathActive(location.pathname, item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-4 py-3 font-label-md transition-all duration-200 ${
          active
            ? 'bg-on-primary/10 text-on-primary border-l-4 border-tertiary-fixed rounded-r-lg'
            : 'text-on-primary/70 hover:bg-on-primary/5 hover:text-on-primary rounded-lg'
        }`}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
        >
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  const renderSectionLabel = (label: string) => (
    <div className="text-label-sm font-semibold text-on-primary/50 uppercase tracking-widest mb-2 mt-6 ml-2 first:mt-0">
      {label}
    </div>
  );

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <SidebarBrand />
        {showClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-on-primary/70 hover:bg-on-primary/10 transition-colors shrink-0"
            aria-label="Cerrar menú"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
        {renderSectionLabel('Menú principal')}
        {topItems.map(renderItem)}
        {sectionOrder.map((section) => (
          <div key={section}>
            {renderSectionLabel(section)}
            {filteredNavItems.filter((item) => item.section === section).map(renderItem)}
          </div>
        ))}
      </nav>
    </>
  );
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  if (!user) return null;

  const shellClass = `fixed inset-y-0 left-0 z-50 ${ds.layout.sidebarWidth} bg-primary text-on-primary flex flex-col py-8 px-4`;

  return (
    <>
      {/* Desktop — sidebar fijo */}
      <aside className={`${shellClass} hidden lg:flex`}>
        <SidebarNav />
      </aside>

      {/* Móvil — drawer */}
      <aside
        className={`${shellClass} lg:hidden transform transition-transform duration-300 ease-in-out shadow-strong ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarNav showClose onClose={onClose} onNavigate={onClose} />
      </aside>
    </>
  );
};
