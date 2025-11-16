// Sidebar component for navigation
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN] },
  { label: 'Mis Grupos', path: '/admin/groups', roles: [UserRole.STUDENT, UserRole.TEACHER] },
  { label: 'Calificaciones', path: '/student/enrollments', roles: [UserRole.STUDENT] },
  { label: 'Estudiantes', path: '/admin/students', roles: [UserRole.ADMIN] },
  { label: 'Maestros', path: '/admin/teachers', roles: [UserRole.ADMIN] },
  { label: 'Materias', path: '/admin/subjects', roles: [UserRole.ADMIN] },
  { label: 'Grupos', path: '/admin/groups', roles: [UserRole.ADMIN] },
];

export const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role as UserRole)
  );

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold">SIPI Modern</h2>
        <p className="text-sm text-gray-400 mt-1">Sistema de Registro</p>
      </div>
      <nav className="mt-6">
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
    </aside>
  );
};
