// Main App component with routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { InactivityTimeoutHandler } from './components/InactivityTimeoutHandler';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/errors/NotFoundPage';
import { DashboardStudent } from './pages/dashboards/DashboardStudent';
import { DashboardTeacher } from './pages/dashboards/DashboardTeacher';
import { DashboardAdmin } from './pages/dashboards/DashboardAdmin';
import { StudentsListPage } from './pages/admin/StudentsListPage';
import { StudentFormPage } from './pages/admin/StudentFormPage';
import { TeachersListPage } from './pages/admin/TeachersListPage';
import { TeacherFormPage } from './pages/admin/TeacherFormPage';
import { SubjectsListPage } from './pages/admin/SubjectsListPage';
import { SubjectFormPage } from './pages/admin/SubjectFormPage';
import { GroupsListPage } from './pages/admin/GroupsListPage';
import { GroupFormPage } from './pages/admin/GroupFormPage';
import { GroupDetailPage } from './pages/admin/GroupDetailPage';
import { EnrollmentFormPage } from './pages/admin/EnrollmentFormPage';
import { EnrollmentsListPage as AdminEnrollmentsListPage } from './pages/admin/EnrollmentsListPage';
import { EnglishPaymentApprovalsPage } from './pages/admin/EnglishPaymentApprovalsPage';
import { EnrollmentsListPage } from './pages/student/EnrollmentsListPage';
import { EnglishStatusPage } from './pages/student/EnglishStatusPage';
import { RequestDiagnosticExamPage } from './pages/student/RequestDiagnosticExamPage';
import { RequestEnglishCoursePage } from './pages/student/RequestEnglishCoursePage';
import { AvailableExamPeriodsPage } from './pages/student/AvailableExamPeriodsPage';
import { AvailableEnglishCoursesPage } from './pages/student/AvailableEnglishCoursesPage';
import { ExamPeriodsListPage } from './pages/admin/ExamPeriodsListPage';
import { ExamPeriodFormPage } from './pages/admin/ExamPeriodFormPage';
import { DiagnosticExamsListPage } from './pages/admin/DiagnosticExamsListPage';
import { ProcessExamResultPage } from './pages/admin/ProcessExamResultPage';
import { SpecialCoursesListPage } from './pages/admin/SpecialCoursesListPage';
import { SpecialCourseDetailPage } from './pages/admin/SpecialCourseDetailPage';
import { GradesManagementPage } from './pages/teacher/GradesManagementPage';
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
                <DashboardStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/teacher"
            element={
              <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
                <DashboardTeacher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <StudentsListPage />
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
                <AdminEnrollmentsListPage />
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
