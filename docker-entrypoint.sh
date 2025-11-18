#!/bin/bash
set -e

echo "🚀 Iniciando Milo Bookings..."

# Ejecutar migraciones de base de datos
echo "📊 Ejecutando migraciones de base de datos..."
cd backend
npm run db:migrate || {
  echo "⚠️  Advertencia: Error al ejecutar migraciones. Continuando..."
}

# Ejecutar seeds solo si no hay datos (solo en producción la primera vez)
if [ "$NODE_ENV" = "production" ]; then
  echo "🌱 Verificando si se necesitan datos iniciales..."
  # Verificar si hay negocios en la base de datos
  # Si no hay, ejecutar seeds
  node -e "
    import('knex').then(async ({ default: knex }) => {
      const config = (await import('./knexfile.js')).default;
      const db = knex(config.production);
      const count = await db('businesses').count('* as count').first();
      if (parseInt(count.count) === 0) {
        console.log('📊 No hay datos iniciales, ejecutando seeds...');
        process.exit(1); // Indicar que se deben ejecutar seeds
      } else {
        console.log('✅ Ya hay datos en la base de datos, saltando seeds');
        process.exit(0);
      }
    }).catch(() => process.exit(0));
  " && {
    echo "🌱 Ejecutando seeds de base de datos..."
    npm run db:seed || {
      echo "⚠️  Advertencia: Error al ejecutar seeds. Continuando..."
    }
  } || {
    echo "✅ Datos iniciales ya existen, saltando seeds"
  }
fi

# Volver al directorio raíz
cd ..

# Ejecutar el comando principal
exec "$@"

