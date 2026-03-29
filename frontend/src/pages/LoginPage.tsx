// Login page component
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low transition-colors duration-200">
      <div className="bg-surface p-8 rounded-2xl shadow-lg w-full max-w-md border border-outline-variant animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-md">
            <span className="text-2xl font-bold text-on-primary font-headline">S</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-on-surface font-headline">
            SIPI Modern
          </h1>
          <p className="text-sm text-on-surface-variant">Sistema de Registro Estudiantil</p>
        </div>
        <h2 className="text-xl font-semibold text-center mb-6 text-on-surface">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-error-container border border-error text-on-error-container px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-on-surface mb-1">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-outline-variant rounded-xl bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              placeholder="Ingresa tu usuario"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-outline-variant rounded-xl bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              placeholder="Ingresa tu contraseña"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3 rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

