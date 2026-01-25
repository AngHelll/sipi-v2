// Main App component with routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { InactivityTimeoutHandler } from './components/InactivityTimeoutHandler';
import { PageLoader } from './components/ui';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/errors/NotFoundPage';

// Lazy load dashboard components (code splitting)
// These components are loaded on-demand, reducing initial bundle size by ~30-50%
const DashboardStudent = lazy(() => import('./pages/dashboards/DashboardStudent').then(module => ({ default: module.DashboardStudent })));
const DashboardTeacher = lazy(() => import('./pages/dashboards/DashboardTeacher').then(module => ({ default: module.DashboardTeacher })));
const DashboardAdmin = lazy(() => import('./pages/dashboards/DashboardAdmin').then(module => ({ default: module.DashboardAdmin })));
// Lazy load admin pages (code splitting for better performance)
const StudentsListPage = lazy(() => import('./pages/admin/StudentsListPage').then(module => ({ default: module.StudentsListPage })));
const StudentFormPage = lazy(() => import('./pages/admin/StudentFormPage').then(module => ({ default: module.StudentFormPage })));
const TeachersListPage = lazy(() => import('./pages/admin/TeachersListPage').then(module => ({ default: module.TeachersListPage })));
const TeacherFormPage = lazy(() => import('./pages/admin/TeacherFormPage').then(module => ({ default: module.TeacherFormPage })));
const SubjectsListPage = lazy(() => import('./pages/admin/SubjectsListPage').then(module => ({ default: module.SubjectsListPage })));
const SubjectFormPage = lazy(() => import('./pages/admin/SubjectFormPage').then(module => ({ default: module.SubjectFormPage })));
const GroupsListPage = lazy(() => import('./pages/admin/GroupsListPage').then(module => ({ default: module.GroupsListPage })));
const GroupFormPage = lazy(() => import('./pages/admin/GroupFormPage').then(module => ({ default: module.GroupFormPage })));
const GroupDetailPage = lazy(() => import('./pages/admin/GroupDetailPage').then(module => ({ default: module.GroupDetailPage })));
const EnrollmentFormPage = lazy(() => import('./pages/admin/EnrollmentFormPage').then(module => ({ default: module.EnrollmentFormPage })));
const AdminEnrollmentsListPage = lazy(() => import('./pages/admin/EnrollmentsListPage').then(module => ({ default: module.EnrollmentsListPage })));
const EnglishPaymentApprovalsPage = lazy(() => import('./pages/admin/EnglishPaymentApprovalsPage').then(module => ({ default: module.EnglishPaymentApprovalsPage })));
const ExamPeriodsListPage = lazy(() => import('./pages/admin/ExamPeriodsListPage').then(module => ({ default: module.ExamPeriodsListPage })));
const ExamPeriodFormPage = lazy(() => import('./pages/admin/ExamPeriodFormPage').then(module => ({ default: module.ExamPeriodFormPage })));
const DiagnosticExamsListPage = lazy(() => import('./pages/admin/DiagnosticExamsListPage').then(module => ({ default: module.DiagnosticExamsListPage })));
const ProcessExamResultPage = lazy(() => import('./pages/admin/ProcessExamResultPage').then(module => ({ default: module.ProcessExamResultPage })));
const SpecialCoursesListPage = lazy(() => import('./pages/admin/SpecialCoursesListPage').then(module => ({ default: module.SpecialCoursesListPage })));
const SpecialCourseDetailPage = lazy(() => import('./pages/admin/SpecialCourseDetailPage').then(module => ({ default: module.SpecialCourseDetailPage })));

// Lazy load student pages
const EnrollmentsListPage = lazy(() => import('./pages/student/EnrollmentsListPage').then(module => ({ default: module.EnrollmentsListPage })));
const EnglishStatusPage = lazy(() => import('./pages/student/EnglishStatusPage').then(module => ({ default: module.EnglishStatusPage })));
const RequestDiagnosticExamPage = lazy(() => import('./pages/student/RequestDiagnosticExamPage').then(module => ({ default: module.RequestDiagnosticExamPage })));
const RequestEnglishCoursePage = lazy(() => import('./pages/student/RequestEnglishCoursePage').then(module => ({ default: module.RequestEnglishCoursePage })));
const AvailableExamPeriodsPage = lazy(() => import('./pages/student/AvailableExamPeriodsPage').then(module => ({ default: module.AvailableExamPeriodsPage })));
const AvailableEnglishCoursesPage = lazy(() => import('./pages/student/AvailableEnglishCoursesPage').then(module => ({ default: module.AvailableEnglishCoursesPage })));

// Lazy load teacher pages
const GradesManagementPage = lazy(() => import('./pages/teacher/GradesManagementPage').then(module => ({ default: module.GradesManagementPage })));
import { UserRole } from './types';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <InactivityTimeoutHandler />
          <BrowserRouter>
            <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with role-based access */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <Suspense fallback={<PageLoader text="Cargando dashboard..." />}>
                  <DashboardStudent />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/teacher"
            element={
              <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
                <Suspense fallback={<PageLoader text="Cargando dashboard..." />}>
                  <DashboardTeacher />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Suspense fallback={<PageLoader text="Cargando dashboard..." />}>
                  <DashboardAdmin />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Suspense fallback={<PageLoader text="Cargando..." />}>
                  <StudentsListPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <StudentFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <StudentFormPage />
              </ProtectedRoute>
            }
          />

          {/* Teachers routes */}
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <TeachersListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <TeacherFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <TeacherFormPage />
              </ProtectedRoute>
            }
          />

          {/* Subjects routes */}
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <SubjectsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <SubjectFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <SubjectFormPage />
              </ProtectedRoute>
            }
          />

          {/* Groups routes */}
          <Route
            path="/admin/groups"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]}>
                <GroupsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/groups/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <GroupDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/groups/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <GroupFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/groups/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <GroupFormPage />
              </ProtectedRoute>
            }
          />

          {/* Enrollment routes */}
          <Route
            path="/admin/enrollments"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Suspense fallback={<PageLoader text="Cargando..." />}>
                  <AdminEnrollmentsListPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enrollments/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <EnrollmentFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enrollments/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <EnrollmentFormPage />
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher/grades"
            element={
              <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
                <GradesManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/enrollments"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <EnrollmentsListPage />
              </ProtectedRoute>
            }
          />

          {/* Student English routes (RB-038) */}
          <Route
            path="/student/english/status"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <EnglishStatusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/english/request-exam"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <RequestDiagnosticExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/english/request-course"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <RequestEnglishCoursePage />
              </ProtectedRoute>
            }
          />

          {/* Admin English routes (RB-038) */}
          <Route
            path="/admin/english/payment-approvals"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <EnglishPaymentApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/special-courses"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <SpecialCoursesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/special-courses/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <SpecialCourseDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Exam Periods routes (Admin) */}
          <Route
            path="/admin/exam-periods"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <ExamPeriodsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exam-periods/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <ExamPeriodFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exam-periods/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <ExamPeriodFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <DiagnosticExamsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/:id/process-result"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <ProcessExamResultPage />
              </ProtectedRoute>
            }
          />

          {/* Student Available routes */}
          <Route
            path="/student/english/available-exam-periods"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <AvailableExamPeriodsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/english/available-courses"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <AvailableEnglishCoursesPage />
              </ProtectedRoute>
            }
          />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* 404 Not Found */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

// Component to redirect to role-specific dashboard
const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case UserRole.STUDENT:
      return <Navigate to="/dashboard/student" replace />;
    case UserRole.TEACHER:
      return <Navigate to="/dashboard/teacher" replace />;
    case UserRole.ADMIN:
      return <Navigate to="/dashboard/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default App;
