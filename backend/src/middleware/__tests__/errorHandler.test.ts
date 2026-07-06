import { errorHandler, ForbiddenError, AuthenticationError } from '../errorHandler';
import type { Request, Response, NextFunction } from 'express';

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

describe('errorHandler', () => {
  const req = {} as Request;
  const next = jest.fn() as NextFunction;
  let prevNodeEnv: string | undefined;

  beforeEach(() => {
    prevNodeEnv = process.env.NODE_ENV;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = prevNodeEnv;
    jest.restoreAllMocks();
  });

  it('en producción oculta el mensaje de errores 500 genéricos', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    const err = new Error('PrismaClientKnownRequestError: sensitive detail');

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('en producción expone mensajes de ForbiddenError (403)', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    const err = new ForbiddenError('You can only view your own enrollments');

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'You can only view your own enrollments' });
  });

  it('en desarrollo incluye stack trace', () => {
    process.env.NODE_ENV = 'development';
    const res = mockRes();
    const err = new AuthenticationError('Invalid credentials');

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ error: 'Invalid credentials' });
    expect((res.body as { stack?: string }).stack).toBeDefined();
  });
});
