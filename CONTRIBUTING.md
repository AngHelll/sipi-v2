# Guía de Contribución

¡Gracias por tu interés en contribuir a SIPI Modern! 🎉

## Cómo Contribuir

### 1. Reportar Bugs

Si encuentras un bug, por favor:

- Verifica que no haya sido reportado ya en los Issues
- Crea un nuevo Issue con:
  - Descripción clara del problema
  - Pasos para reproducirlo
  - Comportamiento esperado vs actual
  - Screenshots si aplica
  - Información del entorno (OS, Node version, etc.)

### 2. Sugerir Mejoras

Las sugerencias son bienvenidas:

- Abre un Issue con la etiqueta `enhancement`
- Describe claramente la mejora propuesta
- Explica por qué sería útil

### 3. Contribuir con Código

#### Configuración del Entorno

1. Fork el repositorio
2. Clona tu fork:
   ```bash
   git clone https://github.com/tu-usuario/sipi-modern.git
   cd sipi-modern
   ```
3. Instala dependencias:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. Crea una rama:
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```

#### Estándares de Código

- **TypeScript**: Usa tipos explícitos, evita `any`
- **Naming**: camelCase para variables/funciones, PascalCase para componentes
- **Comentarios**: Comenta código complejo, no lo obvio
- **Formato**: Ejecuta `npm run lint` antes de commitear
- **Commits**: Mensajes claros y descriptivos en español o inglés

#### Estructura de Commits

```
tipo(scope): descripción breve

Descripción más detallada si es necesario
```

Tipos:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, punto y coma, etc.
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Tareas de mantenimiento

#### Pull Request

1. Asegúrate de que tu código:
   - Pasa los linters (`npm run lint`)
   - No tiene errores de TypeScript
   - Sigue las convenciones del proyecto
   - Incluye comentarios donde sea necesario

2. Crea el Pull Request:
   - Título descriptivo
   - Descripción clara de los cambios
   - Referencia a Issues relacionados si aplica
   - Screenshots si hay cambios de UI

3. Espera la revisión:
   - Responde a comentarios constructivamente
   - Haz cambios si se solicitan
   - Mantén el PR actualizado con la rama principal

## Áreas de Contribución

### Prioridad Alta
- Tests unitarios y de integración
- Documentación de API (Swagger/OpenAPI)
- Mejoras de seguridad
- Optimización de performance

### Prioridad Media
- Nuevas funcionalidades
- Mejoras de UI/UX
- Internacionalización (i18n)
- Mejoras de accesibilidad

### Prioridad Baja
- Refactorizaciones
- Mejoras de código
- Documentación adicional

## Preguntas

Si tienes preguntas, puedes:
- Abrir un Issue con la etiqueta `question`
- Contactar a los mantenedores

¡Gracias por contribuir! 🚀

