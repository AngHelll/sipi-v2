# Script de Verificación de Instalación para Windows
# Ejecutar desde la raíz del proyecto: .\scripts\verify-installation.ps1

Write-Host "=== Verificando Instalación SIPI Modern ===" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js no encontrado" -ForegroundColor Red
    Write-Host "      Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    $errors++
}

# Verificar npm
Write-Host "2. Verificando npm..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "   ✅ npm instalado: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ npm no encontrado" -ForegroundColor Red
    $errors++
}

# Verificar MySQL
Write-Host "3. Verificando MySQL..." -ForegroundColor Yellow
if (Get-Command mysql -ErrorAction SilentlyContinue) {
    $mysqlVersion = mysql --version
    Write-Host "   ✅ MySQL instalado: $mysqlVersion" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  MySQL no encontrado en PATH" -ForegroundColor Yellow
    Write-Host "      Puede estar instalado pero no en PATH" -ForegroundColor Gray
    $warnings++
}

# Verificar si MySQL está corriendo
Write-Host "4. Verificando servicio MySQL..." -ForegroundColor Yellow
$mysqlService = Get-Service | Where-Object {$_.Name -like "*mysql*"}
if ($mysqlService) {
    Write-Host "   ✅ Servicio MySQL encontrado: $($mysqlService.Name)" -ForegroundColor Green
    if ($mysqlService.Status -eq 'Running') {
        Write-Host "   ✅ MySQL está corriendo" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  MySQL no está corriendo (Estado: $($mysqlService.Status))" -ForegroundColor Yellow
        Write-Host "      Ejecuta: Start-Service $($mysqlService.Name)" -ForegroundColor Gray
        $warnings++
    }
} else {
    Write-Host "   ⚠️  Servicio MySQL no encontrado" -ForegroundColor Yellow
    Write-Host "      Si usas XAMPP, inicia MySQL desde el Panel de Control" -ForegroundColor Gray
    $warnings++
}

# Verificar estructura del proyecto
Write-Host "5. Verificando estructura del proyecto..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Write-Host "   ✅ Carpeta backend existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ Carpeta backend no existe" -ForegroundColor Red
    $errors++
}

if (Test-Path "frontend") {
    Write-Host "   ✅ Carpeta frontend existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ Carpeta frontend no existe" -ForegroundColor Red
    $errors++
}

# Verificar archivos .env
Write-Host "6. Verificando archivos .env..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "   ✅ backend\.env existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ backend\.env no existe" -ForegroundColor Red
    if (Test-Path "backend\.env.example") {
        Write-Host "      Copia desde: backend\.env.example" -ForegroundColor Yellow
        Write-Host "      Comando: Copy-Item backend\.env.example backend\.env" -ForegroundColor Gray
    } else {
        Write-Host "      ⚠️  backend\.env.example tampoco existe" -ForegroundColor Yellow
    }
    $errors++
}

if (Test-Path "frontend\.env") {
    Write-Host "   ✅ frontend\.env existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ frontend\.env no existe" -ForegroundColor Red
    if (Test-Path "frontend\.env.example") {
        Write-Host "      Copia desde: frontend\.env.example" -ForegroundColor Yellow
        Write-Host "      Comando: Copy-Item frontend\.env.example frontend\.env" -ForegroundColor Gray
    } else {
        Write-Host "      ⚠️  frontend\.env.example tampoco existe" -ForegroundColor Yellow
    }
    $errors++
}

# Verificar node_modules
Write-Host "7. Verificando dependencias instaladas..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "   ✅ Dependencias del backend instaladas" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Dependencias del backend no instaladas" -ForegroundColor Yellow
    Write-Host "      Ejecuta: cd backend; npm install" -ForegroundColor Gray
    $warnings++
}

if (Test-Path "frontend\node_modules") {
    Write-Host "   ✅ Dependencias del frontend instaladas" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Dependencias del frontend no instaladas" -ForegroundColor Yellow
    Write-Host "      Ejecuta: cd frontend; npm install" -ForegroundColor Gray
    $warnings++
}

# Verificar Prisma
Write-Host "8. Verificando Prisma..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules\.prisma") {
    Write-Host "   ✅ Cliente de Prisma generado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Cliente de Prisma no generado" -ForegroundColor Yellow
    Write-Host "      Ejecuta: cd backend; npm run prisma:generate" -ForegroundColor Gray
    $warnings++
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ Todo está configurado correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar el proyecto:" -ForegroundColor Yellow
    Write-Host "  Terminal 1 (Backend): cd backend; npm run dev" -ForegroundColor White
    Write-Host "  Terminal 2 (Frontend): cd frontend; npm run dev" -ForegroundColor White
    exit 0
} elseif ($errors -eq 0) {
    Write-Host "⚠️  Hay $warnings advertencia(s) pero puedes continuar" -ForegroundColor Yellow
    Write-Host "   Revisa los mensajes arriba para más detalles" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "❌ Hay $errors error(es) que debes resolver antes de continuar" -ForegroundColor Red
    Write-Host "   Revisa los mensajes arriba para más detalles" -ForegroundColor Gray
    exit 1
}


