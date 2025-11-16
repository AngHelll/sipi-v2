# Extensiones Recomendadas para Cursor/VS Code

Este proyecto funciona mejor con las siguientes extensiones instaladas. Cursor soporta extensiones de VS Code, así que puedes instalarlas directamente desde el marketplace.

## 🚀 Extensiones Esenciales

### TypeScript & JavaScript
- **ESLint** (`dbaeumer.vscode-eslint`)
  - Linting automático para TypeScript/JavaScript
  - Ya configurado en el proyecto
  
- **Prettier** (`esbenp.prettier-vscode`)
  - Formateo automático de código
  - Mantiene consistencia en el código

### React & Frontend
- **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
  - Snippets útiles para React
  - Escribe código más rápido

- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
  - Autocompletado para clases de Tailwind
  - Muestra preview de colores y espaciados
  - **¡Muy útil para este proyecto!**

### Prisma & Database
- **Prisma** (`prisma.prisma`)
  - Syntax highlighting para archivos `.prisma`
  - Autocompletado para el schema
  - Formateo automático

## 🛠️ Extensiones de Productividad

### Git
- **GitLens** (`eamodio.gitlens`)
  - Ver historial de cambios inline
  - Blame annotations
  - Comparar cambios fácilmente

### General
- **Auto Rename Tag** (`formulahendry.auto-rename-tag`)
  - Renombra automáticamente tags HTML/JSX emparejados
  
- **Path Intellisense** (`christian-kohler.path-intellisense`)
  - Autocompletado para rutas de archivos
  
- **Error Lens** (`usernamehw.errorlens`)
  - Muestra errores inline en el código
  - Muy útil para detectar problemas rápidamente

- **TypeScript and JavaScript Language Features** (`ms-vscode.vscode-typescript-next`)
  - Ya viene incluido, pero asegúrate de tenerlo activado

## 📝 Extensiones de Calidad de Código

- **Code Spell Checker** (`streetsidesoftware.code-spell-checker`)
  - Detecta errores de ortografía en comentarios y strings
  
- **Spanish - Code Spell Checker** (`streetsidesoftware.code-spell-checker-spanish`)
  - Diccionario en español (útil para comentarios en español)

## 🎨 Extensiones Opcionales (pero útiles)

- **Thunder Client** (`rangav.vscode-thunder-client`)
  - Cliente REST integrado para probar APIs
  - Alternativa a Postman dentro de Cursor

- **REST Client** (`humao.rest-client`)
  - Probar APIs directamente desde archivos `.http` o `.rest`

- **DotENV** (`mikestead.dotenv`)
  - Syntax highlighting para archivos `.env`

- **Material Icon Theme** (`pkief.material-icon-theme`)
  - Iconos bonitos para el explorador de archivos

- **One Dark Pro** (`zhuangtongfa.material-theme`)
  - Tema oscuro popular (opcional)

## 📦 Cómo Instalar

### Opción 1: Desde la UI de Cursor
1. Abre el panel de extensiones (Cmd+Shift+X en macOS)
2. Busca el nombre de la extensión
3. Click en "Install"

### Opción 2: Desde la Terminal
```bash
# Ejemplo: instalar ESLint
code --install-extension dbaeumer.vscode-eslint

# O usando el comando de Cursor (si está disponible)
cursor --install-extension dbaeumer.vscode-eslint
```

### Opción 3: Instalar Todas las Recomendadas
Si abres el proyecto en Cursor y tienes el archivo `.vscode/extensions.json`, Cursor te sugerirá instalar todas las extensiones recomendadas automáticamente.

## ⚙️ Configuración Recomendada

Agrega esto a tu `settings.json` de Cursor (Cmd+, → busca "settings.json"):

```json
{
  // Formateo automático al guardar
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  
  // ESLint auto-fix al guardar
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  
  // Tailwind CSS
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^\"'`]*)(?:'|\"|`)"]
  ],
  
  // TypeScript
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative",
  
  // Archivos
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/dist": true
  },
  
  // Spell checker
  "cSpell.language": "en,es",
  "cSpell.enabledLanguageIds": [
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact",
    "markdown"
  ]
}
```

## 🔥 Las Más Importantes para Este Proyecto

Si solo quieres instalar las esenciales:

1. **Prisma** - Para trabajar con el schema
2. **Tailwind CSS IntelliSense** - Para las clases de CSS
3. **ESLint** - Para mantener código limpio
4. **Error Lens** - Para ver errores rápidamente
5. **GitLens** - Para trabajar con Git

---

**Nota:** Cursor ya tiene muchas de estas funcionalidades integradas gracias a la IA, pero estas extensiones mejoran la experiencia de desarrollo tradicional.

