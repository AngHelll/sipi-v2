/**
 * Subject utilities
 * Helper functions for subject-related operations
 */

/**
 * Check if a subject is an English subject
 * 
 * Identifies English subjects by:
 * - Clave starting with "ING-", "LE-", "EN-", "ENG-"
 * - Nombre containing "inglés", "ingles", "english" (case insensitive)
 * 
 * @param clave - Subject code (e.g., "ING-101", "LE-001")
 * @param nombre - Subject name (e.g., "Inglés I", "INGLES 1")
 * @returns true if the subject is an English subject
 */
export function isEnglishSubject(clave?: string | null, nombre?: string | null): boolean {
  if (!clave && !nombre) {
    return false;
  }

  // Check by clave (subject code)
  if (clave) {
    const claveUpper = clave.toUpperCase();
    if (
      claveUpper.startsWith('ING-') ||
      claveUpper.startsWith('LE-') ||
      claveUpper.startsWith('EN-') ||
      claveUpper.startsWith('ENG-')
    ) {
      return true;
    }
  }

  // Check by nombre (subject name)
  if (nombre) {
    const nombreLower = nombre.toLowerCase();
    if (
      nombreLower.includes('inglés') ||
      nombreLower.includes('ingles') ||
      nombreLower.includes('english')
    ) {
      return true;
    }
  }

  return false;
}



