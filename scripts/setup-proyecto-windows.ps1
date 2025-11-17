# Script de Configuración Rápida - SIPI Modern en Windows
# Ejecutar desde la raíz del proyecto: .\scripts\setup-proyecto-windows.ps1

Write-Host "=== Configuración del Proyecto SIPI Modern ===" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Verificar prerrequisitos
Write-Host "1. Verificando prerrequisitos..." -ForegroundColor Yellow

# Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "   ✅ Node.js: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js no encontrado" -ForegroundColor Red
    $errors++
}

# npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "   ✅ npm: $(npm --version)" -ForegroundColor Green
} else {
    Write-Host "   ❌ npm no encontrado" -ForegroundColor Red
    $errors++
}

# MySQL
$mysql = Get-Process | Where-Object {$_.ProcessName -like "*mysqld*"} -ErrorAction SilentlyContinue
if ($mysql) {
    Write-Host "   ✅ MySQL está corriendo" -ForegroundColor Green
} else {
    Write-Host "   ❌ MySQL NO está corriendo" -ForegroundColor Red
    Write-Host "      Inicia MySQL desde XAMPP Control Panel" -ForegroundColor Yellow
    $errors++
}

Write-Host ""

if ($errors -gt 0) {
    Write-Host "❌ Hay errores que debes resolver antes de continuar" -ForegroundColor Red
    exit 1
}

# Verificar base de datos
Write-Host "2. Verificando base de datos sipi_db..." -ForegroundColor Yellow
$dbExists = & "C:\xampp\mysql\bin\mysql.exe" -u root -e "SHOW DATABASES LIKE 'sipi_db';" 2>$null | Select-String "sipi_db"
if ($dbExists) {
    Write-Host "   ✅ Base de datos sipi_db existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Base de datos sipi_db NO existe" -ForegroundColor Yellow
    Write-Host "      Creando base de datos..." -ForegroundColor Gray
    & "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      ✅ Base de datos creada" -ForegroundColor Green
    } else {
        Write-Host "      ❌ Error al crear base de datos" -ForegroundColor Red
        Write-Host "      Ejecuta manualmente:" -ForegroundColor Yellow
        Write-Host "      mysql -u root -e `"CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`"" -ForegroundColor Gray
        $warnings++
    }
}

Write-Host ""

# Verificar backend/.env
Write-Host "3. Verificando backend/.env..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "   ✅ backend/.env existe" -ForegroundColor Green
    
    # Verificar contenido básico
    $envContent = Get-Content "backend\.env" -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "   ✅ DATABASE_URL configurado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  DATABASE_URL no encontrado en .env" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "   ⚠️  backend/.env NO existe" -ForegroundColor Yellow
    if (Test-Path "backend\.env.example") {
        Write-Host "      Copiando desde .env.example..." -ForegroundColor Gray
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "      ✅ Archivo creado. Edítalo con tus configuraciones" -ForegroundColor Green
        Write-Host "      Comando: notepad backend\.env" -ForegroundColor Gray
    } else {
        Write-Host "      ❌ backend/.env.example tampoco existe" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# Verificar dependencias del backend
Write-Host "4. Verificando dependencias del backend..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Dependencias NO instaladas" -ForegroundColor Yellow
    Write-Host "      ¿Instalar ahora? (S/N)" -ForegroundColor Cyan
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host "      Instalando dependencias..." -ForegroundColor Gray
        Set-Location backend
        npm install
        Set-Location ..
        if (Test-Path "backend\node_modules") {
            Write-Host "      ✅ Dependencias instaladas" -ForegroundColor Green
        } else {
            Write-Host "      ❌ Error al instalar dependencias" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "      Ejecuta manualmente: cd backend; npm install" -ForegroundColor Gray
        $warnings++
    }
}

Write-Host ""

# Verificar Prisma
Write-Host "5. Verificando Prisma..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules\.prisma") {
    Write-Host "   ✅ Cliente de Prisma generado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Cliente de Prisma NO generado" -ForegroundColor Yellow
    Write-Host "      ¿Generar ahora? (S/N)" -ForegroundColor Cyan
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host "      Generando cliente de Prisma..." -ForegroundColor Gray
        Set-Location backend
        npm run prisma:generate
        Set-Location ..
        Write-Host "      ✅ Cliente generado" -ForegroundColor Green
    } else {
        Write-Host "      Ejecuta manualmente: cd backend; npm run prisma:generate" -ForegroundColor Gray
        $warnings++
    }
}

Write-Host ""

# Verificar migraciones
Write-Host "6. Verificando migraciones..." -ForegroundColor Yellow
$tables = & "C:\xampp\mysql\bin\mysql.exe" -u root sipi_db -e "SHOW TABLES;" 2>$null | Select-String -Pattern "users|students|teachers" -Quiet
if ($tables) {
    Write-Host "   ✅ Tablas creadas (migraciones ejecutadas)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Tablas NO encontradas (migraciones no ejecutadas)" -ForegroundColor Yellow
    Write-Host "      ¿Ejecutar migraciones ahora? (S/N)" -ForegroundColor Cyan
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host "      Ejecutando migraciones..." -ForegroundColor Gray
        Set-Location backend
        npm run prisma:migrate
        Set-Location ..
        Write-Host "      ✅ Migraciones ejecutadas" -ForegroundColor Green
    } else {
        Write-Host "      Ejecuta manualmente: cd backend; npm run prisma:migrate" -ForegroundColor Gray
        $warnings++
    }
}

Write-Host ""

# Verificar frontend/.env
Write-Host "7. Verificando frontend/.env..." -ForegroundColor Yellow
if (Test-Path "frontend\.env") {
    Write-Host "   ✅ frontend/.env existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  frontend/.env NO existe" -ForegroundColor Yellow
    if (Test-Path "frontend\.env.example") {
        Write-Host "      Copiando desde .env.example..." -ForegroundColor Gray
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "      ✅ Archivo creado" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  frontend/.env.example tampoco existe" -ForegroundColor Yellow
        Write-Host "      Creando archivo .env con valores por defecto..." -ForegroundColor Gray
        "VITE_API_URL=http://localhost:3001/api" | Out-File -FilePath "frontend\.env" -Encoding utf8
        Write-Host "      ✅ Archivo creado" -ForegroundColor Green
    }
}

Write-Host ""

# Verificar dependencias del frontend
Write-Host "8. Verificando dependencias del frontend..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Dependencias NO instaladas" -ForegroundColor Yellow
    Write-Host "      ¿Instalar ahora? (S/N)" -ForegroundColor Cyan
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host "      Instalando dependencias..." -ForegroundColor Gray
        Set-Location frontend
        npm install
        Set-Location ..
        if (Test-Path "frontend\node_modules") {
            Write-Host "      ✅ Dependencias instaladas" -ForegroundColor Green
        } else {
            Write-Host "      ❌ Error al instalar dependencias" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "      Ejecuta manualmente: cd frontend; npm install" -ForegroundColor Gray
        $warnings++
    }
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ Todo está configurado correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar el proyecto:" -ForegroundColor Yellow
    Write-Host "  Terminal 1 (Backend): cd backend; npm run dev" -ForegroundColor White
    Write-Host "  Terminal 2 (Frontend): cd frontend; npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Luego accede a: http://localhost:5173/" -ForegroundColor Cyan
    Write-Host "Credenciales: admin / admin123" -ForegroundColor Cyan
} elseif ($errors -eq 0) {
    Write-Host "⚠️  Hay $warnings advertencia(s) pero puedes continuar" -ForegroundColor Yellow
    Write-Host "   Revisa los mensajes arriba" -ForegroundColor Gray
} else {
    Write-Host "❌ Hay $errors error(es) que debes resolver" -ForegroundColor Red
    Write-Host "   Revisa los mensajes arriba" -ForegroundColor Gray
    exit 1
}

