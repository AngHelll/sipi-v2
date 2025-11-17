#!/bin/bash
# Script para agregar imágenes al repositorio

echo "📸 Agregando imágenes al repositorio..."

cd "$(dirname "$0")/.."

# Verificar que la carpeta existe
if [ ! -d "docs/images" ]; then
    echo "❌ Error: La carpeta docs/images/ no existe"
    exit 1
fi

# Contar imágenes encontradas
IMAGE_COUNT=0

# Verificar cada imagen requerida
REQUIRED_IMAGES=(
    "dashboard-admin"
    "students-management"
    "teachers-management"
    "subjects-management"
    "groups-management"
)

echo ""
echo "🔍 Verificando imágenes..."
echo ""

for img in "${REQUIRED_IMAGES[@]}"; do
    if [ -f "docs/images/${img}.png" ]; then
        echo "✅ ${img}.png encontrada"
        ((IMAGE_COUNT++))
    elif [ -f "docs/images/${img}.jpg" ]; then
        echo "✅ ${img}.jpg encontrada"
        ((IMAGE_COUNT++))
    else
        echo "❌ ${img}.png/.jpg NO encontrada"
    fi
done

echo ""
if [ $IMAGE_COUNT -eq 0 ]; then
    echo "⚠️  No se encontraron imágenes en docs/images/"
    echo ""
    echo "Por favor, coloca las imágenes en docs/images/ con estos nombres:"
    for img in "${REQUIRED_IMAGES[@]}"; do
        echo "   • ${img}.png (o .jpg)"
    done
    exit 1
fi

echo "📦 Agregando ${IMAGE_COUNT} imagen(es) al repositorio..."
echo ""

# Agregar imágenes
git add docs/images/*.png docs/images/*.jpg 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Imágenes agregadas al staging area"
    echo ""
    echo "📝 Para hacer commit y push:"
    echo "   git commit -m 'docs: agregar capturas de pantalla'"
    echo "   git push"
else
    echo "❌ Error al agregar imágenes"
    exit 1
fi

