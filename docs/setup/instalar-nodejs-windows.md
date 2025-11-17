# Instalar Node.js y npm en Windows

## 📥 Descargar Node.js

### Opción 1: Descarga Directa (Recomendado)

1. **Ve a la página oficial:**
   - URL: https://nodejs.org/
   - O directamente: https://nodejs.org/en/download/

2. **Descarga la versión LTS (Long Term Support):**
   - Busca el botón verde que dice **"LTS"** o **"Recommended For Most Users"**
   - Haz clic en **"Windows Installer (.msi)"** para 64-bit
   - Se descargará un archivo como: `node-v20.x.x-x64.msi`

3. **Instala Node.js:**
   - Haz doble clic en el archivo `.msi` descargado
   - Sigue el asistente de instalación
   - **IMPORTANTE:** Marca la opción **"Automatically install the necessary tools"** cuando aparezca
   - Acepta los términos y continúa
   - Asegúrate de que **"Add to PATH"** esté marcado (por defecto lo está)
   - Completa la instalación

4. **Verifica la instalación:**
   - Abre PowerShell o CMD (cierra y abre una nueva ventana si ya estaba abierta)
   - Ejecuta:
   ```powershell
   node --version
   npm --version
   ```
   
   Deberías ver algo como:
   ```
   v20.11.0
   10.2.4
   ```

---

## 📥 Opción 2: Usando Chocolatey (Gestor de Paquetes)

Si ya tienes Chocolatey instalado:

```powershell
# Instalar Node.js (incluye npm)
choco install nodejs-lts

# Verificar instalación
node --version
npm --version
```

### Instalar Chocolatey primero (si no lo tienes):

1. Abre PowerShell como **Administrador**
2. Ejecuta:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```
3. Verifica: `choco --version`

---

## 📥 Opción 3: Usando Winget (Windows Package Manager)

Si tienes Windows 10/11 con Winget:

```powershell
# Buscar Node.js
winget search nodejs

# Instalar Node.js LTS
winget install OpenJS.NodeJS.LTS

# Verificar instalación
node --version
npm --version
```

---

## ✅ Verificar Instalación

Después de instalar, abre una **nueva** ventana de PowerShell o CMD y ejecuta:

```powershell
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar que ambos funcionan
node -e "console.log('Node.js funciona correctamente!')"
npm --help
```

**Salida esperada:**
```
v20.11.0        # Versión de Node.js
10.2.4          # Versión de npm
Node.js funciona correctamente!
```

---

## 🔧 Solución de Problemas

### Problema 1: "node no se reconoce como comando"

**Solución:**
1. Reinicia tu terminal (ciérrala y ábrela de nuevo)
2. Si persiste, verifica que Node.js esté en el PATH:
   ```powershell
   $env:PATH -split ';' | Select-String node
   ```
3. Si no aparece, reinstala Node.js y asegúrate de marcar "Add to PATH"

### Problema 2: Versión antigua de npm

**Actualizar npm:**
```powershell
npm install -g npm@latest
npm --version
```

### Problema 3: Permisos al instalar paquetes globales

**Solución:**
```powershell
# Cambiar la ubicación de npm global en Windows
npm config set prefix "$env:APPDATA\npm"
```

O ejecuta PowerShell como Administrador.

### Problema 4: Node.js instalado pero no funciona

**Reinstalar:**
1. Desinstala Node.js desde "Configuración > Aplicaciones"
2. Descarga e instala la última versión LTS
3. Reinicia tu terminal

---

## 📚 Información Adicional

### ¿Qué versión instalar?

- **LTS (Long Term Support)**: Recomendado para desarrollo. Recibe actualizaciones de seguridad por más tiempo.
- **Current (Latest)**: Versión más reciente con características nuevas. Puede tener cambios incompatibles.

**Para este proyecto:** Usa la versión **LTS (18.x o superior)**.

### Verificar Requisitos del Proyecto

El proyecto SIPI Modern requiere:
- Node.js 18 o superior
- npm (viene incluido con Node.js)

Verifica tu versión:
```powershell
node --version
# Debe ser v18.x.x o superior
```

---

## 🎯 Siguiente Paso

Una vez instalado Node.js y npm, continúa con la instalación del proyecto:

1. Verifica que todo está instalado: `.\scripts\verify-installation.ps1`
2. Sigue la guía de instalación: `docs/setup/windows-installation.md`

---

## 📞 Enlaces Útiles

- **Node.js Oficial**: https://nodejs.org/
- **Documentación npm**: https://docs.npmjs.com/
- **Guía de Instalación Windows**: `docs/setup/windows-installation.md`
- **Solución de Problemas**: `docs/setup/troubleshooting.md`


