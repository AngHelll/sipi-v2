// Sidebar component for navigation
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Icon } from '../ui/Icon';

interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN] },
  { label: 'Mis Grupos', path: '/admin/groups', roles: [UserRole.STUDENT, UserRole.TEACHER] },
  { label: 'Calificaciones', path: '/student/enrollments', roles: [UserRole.STUDENT] },
  { label: 'Estudiantes', path: '/admin/students', roles: [UserRole.ADMIN] },
  { label: 'Maestros', path: '/admin/teachers', roles: [UserRole.ADMIN] },
  { label: 'Materias', path: '/admin/subjects', roles: [UserRole.ADMIN] },
  { label: 'Grupos', path: '/admin/groups', roles: [UserRole.ADMIN] },
  { label: 'Inscripciones', path: '/admin/enrollments', roles: [UserRole.ADMIN] },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role as UserRole)
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-gray-800 text-white min-h-screen flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold">SIPI Modern</h2>
            <p className="text-sm text-gray-400 mt-1">Sistema de Registro Estudiantil</p>
          </div>
          <nav className="mt-6 flex-1">
            <ul className="space-y-2 px-4">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`block px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-bold">SIPI Modern</h2>
              <p className="text-sm text-gray-400 mt-1">Sistema de Registro Estudiantil</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              aria-label="Cerrar menú"
            >
              <Icon name="close" size={24} />
            </button>
          </div>
          <nav className="mt-6 flex-1 overflow-y-auto">
            <ul className="space-y-2 px-4">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`block px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};
