// Topbar component with user info, avatar dropdown, and improved design
import { useAuth } from '../../context/AuthContext';
import { GlobalSearch } from '../ui/GlobalSearch';
import { AvatarDropdown } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { UserRole } from '../../types';

const roleLabels: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Estudiante',
  [UserRole.TEACHER]: 'Maestro',
  [UserRole.ADMIN]: 'Administrador',
};

export const Topbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Breadcrumbs based on current path
  const getBreadcrumbs = () => {
    if (!user) return [];
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    
    if (parts.length === 0 || parts[0] === 'dashboard') {
      return [{ label: 'Dashboard', path: '/dashboard' }];
    }

    const breadcrumbs = [{ label: 'Dashboard', path: '/dashboard' }];
    
    if (parts[0] === 'admin') {
      breadcrumbs.push({ label: 'Administración', path: '/admin' });
      if (parts[1] === 'students') {
        breadcrumbs.push({ label: 'Estudiantes', path: '/admin/students' });
        if (parts[2] === 'new') breadcrumbs.push({ label: 'Nuevo', path: '' });
        if (parts[2] && parts[2] !== 'new' && parts[3] === 'edit') {
          breadcrumbs.push({ label: 'Editar', path: '' });
        }
      } else if (parts[1] === 'teachers') {
        breadcrumbs.push({ label: 'Maestros', path: '/admin/teachers' });
        if (parts[2] === 'new') breadcrumbs.push({ label: 'Nuevo', path: '' });
        if (parts[2] && parts[2] !== 'new' && parts[3] === 'edit') {
          breadcrumbs.push({ label: 'Editar', path: '' });
        }
      } else if (parts[1] === 'subjects') {
        breadcrumbs.push({ label: 'Materias', path: '/admin/subjects' });
        if (parts[2] === 'new') breadcrumbs.push({ label: 'Nuevo', path: '' });
        if (parts[2] && parts[2] !== 'new' && parts[3] === 'edit') {
          breadcrumbs.push({ label: 'Editar', path: '' });
        }
      } else if (parts[1] === 'groups') {
        breadcrumbs.push({ label: 'Grupos', path: '/admin/groups' });
        if (parts[2] === 'new') breadcrumbs.push({ label: 'Nuevo', path: '' });
        if (parts[2] && parts[2] !== 'new' && parts[3] === 'edit') {
          breadcrumbs.push({ label: 'Editar', path: '' });
        }
      } else if (parts[1] === 'enrollments') {
        breadcrumbs.push({ label: 'Inscripciones', path: '/admin/enrollments' });
        if (parts[2] === 'new') breadcrumbs.push({ label: 'Nueva', path: '' });
      }
    } else if (parts[0] === 'student') {
      if (parts[1] === 'enrollments') {
        breadcrumbs.push({ label: 'Mis Calificaciones', path: '/student/enrollments' });
      }
    } else if (parts[0] === 'teacher') {
      if (parts[1] === 'grades') {
        breadcrumbs.push({ label: 'Gestión de Calificaciones', path: '/teacher/grades' });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-600 shrink-0">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <Icon name="chevron-right" size={16} className="text-gray-400" />
              )}
              {crumb.path ? (
                <a
                  href={crumb.path}
                  className="hover:text-gray-900 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          {user && <GlobalSearch />}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <AvatarDropdown name={user.username} role={roleLabels[user.role]}>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
              >
                <Icon name="logout" size={16} />
                Cerrar Sesión
              </button>
            </AvatarDropdown>
          )}
        </div>
      </div>
    </header>
  );
};
