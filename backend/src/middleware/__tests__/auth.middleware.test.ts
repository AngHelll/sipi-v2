import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../auth';
import { UserRole } from '../../types';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../config/env', () => ({
  config: { jwt: { secret: 'test-secret-with-at-least-32-chars!!' } },
}));

import jwt from 'jsonwebtoken';

const jwtMock = jwt as unknown as { verify: jest.Mock };

function mockRes(): Response & { statusCode?: number; body?: unknown } {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode?: number; body?: unknown };
}

describe('authorize middleware', () => {
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve 401 si no hay usuario autenticado', () => {
    const res = mockRes();
    authorize(UserRole.ADMIN)({} as Request, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('devuelve 403 si el rol no está permitido', () => {
    const res = mockRes();
    const req = { user: { userId: 'u1', role: UserRole.STUDENT } } as Request;
    authorize(UserRole.ADMIN)(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  it('permite el acceso cuando el rol coincide', () => {
    const res = mockRes();
    const req = { user: { userId: 'u1', role: UserRole.ADMIN } } as Request;
    authorize(UserRole.ADMIN)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(0);
  });

  it('acepta cualquiera de los roles listados', () => {
    const res = mockRes();
    const req = { user: { userId: 'u1', role: UserRole.TEACHER } } as Request;
    authorize(UserRole.ADMIN, UserRole.TEACHER)(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('authenticate middleware', () => {
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve 401 sin cookie token', () => {
    const res = mockRes();
    const req = { cookies: {} } as unknown as Request;
    authenticate(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });

  it('adjunta el usuario y continúa con token válido', () => {
    jwtMock.verify.mockReturnValue({ userId: 'u1', role: UserRole.STUDENT });
    const res = mockRes();
    const req = { cookies: { token: 'valid' } } as unknown as Request;
    authenticate(req, res, next);
    expect(req.user).toEqual({ userId: 'u1', role: UserRole.STUDENT });
    expect(next).toHaveBeenCalled();
  });
});
