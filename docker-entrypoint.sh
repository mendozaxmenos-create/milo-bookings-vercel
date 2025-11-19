#!/bin/bash
set -e

echo "🚀 Iniciando Milo Bookings..."

# Ejecutar migraciones de base de datos
echo "📊 Ejecutando migraciones de base de datos..."
cd backend
npm run db:migrate || {
  echo "⚠️  Advertencia: Error al ejecutar migraciones. Continuando..."
}

# EJECUTAR SEEDS SIEMPRE (solo si no hay datos)
# Esto es más confiable que usar un endpoint HTTP
echo "🌱 Verificando y ejecutando seeds si es necesario..."
echo "📂 Directorio actual: $(pwd)"
echo "📂 Listando scripts disponibles:"
ls -la scripts/ || echo "⚠️  No se encontró directorio scripts"
echo "🚀 Ejecutando check-and-seed.js..."
node scripts/check-and-seed.js || {
  echo "⚠️  Advertencia: Error al ejecutar seeds. Continuando..."
  echo "⚠️  Esto no debería impedir que el servidor inicie"
}
echo "✅ Script de seeds completado"

# Permitir forzar la ejecución de seeds completos (npm run db:seed)
if [ "$FORCE_DB_SEED" = "true" ]; then
  echo "🌱 FORCE_DB_SEED= true → ejecutando npm run db:seed..."
  cd backend
  npm run db:seed || {
    echo "⚠️  Error al ejecutar npm run db:seed forzado"
  }
  cd ..
  echo "✅ Seeds forzados completados (o se reportó el error arriba)"
fi

# Volver al directorio raíz
cd ..

# Ejecutar el comando principal
exec "$@"

