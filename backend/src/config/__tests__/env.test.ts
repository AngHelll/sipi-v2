import { validateJwtSecret } from '../env';

describe('validateJwtSecret', () => {
  it('acepta secret de 32+ caracteres', () => {
    expect(() => validateJwtSecret('a'.repeat(32))).not.toThrow();
  });

  it('rechaza secret corto', () => {
    expect(() => validateJwtSecret('too-short')).toThrow(/at least 32 characters/);
  });
});
