#!/bin/bash
# Script para generar reporte ejecutivo actualizado

echo "📊 Generando Reporte Ejecutivo de Datos..."
echo ""

# Reemplazar fecha en el reporte
sed -i '' "s/\$(date +\"%Y-%m-%d\")/$(date +"%Y-%m-%d")/g" REPORTE-EJECUTIVO-DATOS.md
sed -i '' "s/\$(date +\"%Y-%m-%d %H:%M:%S\")/$(date +"%Y-%m-%d %H:%M:%S")/g" REPORTE-EJECUTIVO-DATOS.md

echo "✅ Reporte actualizado: REPORTE-EJECUTIVO-DATOS.md"
echo ""
echo "📋 Para ver el reporte:"
echo "   cat REPORTE-EJECUTIVO-DATOS.md"
echo "   o abre el archivo en tu editor"
