#!/bin/bash
set -e

echo "🚀 Iniciando Milo Bookings..."

# Ejecutar migraciones de base de datos
echo "📊 Ejecutando migraciones de base de datos..."
cd backend
npm run db:migrate || {
  echo "⚠️  Advertencia: Error al ejecutar migraciones. Continuando..."
}

# Ejecutar seeds automáticamente si no hay datos (solo en producción)
if [ "$NODE_ENV" = "production" ]; then
  echo "🌱 Verificando si se necesitan datos iniciales..."
  node scripts/check-and-seed.js || {
    echo "⚠️  Advertencia: Error al verificar/ejecutar seeds. Continuando..."
  }
fi

# Volver al directorio raíz
cd ..

# Ejecutar el comando principal
exec "$@"

