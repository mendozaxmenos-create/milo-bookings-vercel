# 🔧 Ejecutar Migraciones

El error que estás viendo indica que faltan columnas en la base de datos. Necesitas ejecutar las migraciones.

## Pasos para ejecutar las migraciones:

### Opción 1: Desde la terminal (recomendado)

```bash
cd backend
npm run db:migrate
```

### Opción 2: Si tienes problemas con PowerShell

Abre una terminal `cmd` (no PowerShell) y ejecuta:

```cmd
cd C:\Users\gusta\Desktop\milo-bookings\backend
npm run db:migrate
```

### Opción 3: Usar npx directamente

```bash
cd backend
npx knex migrate:latest
```

## Verificar que las migraciones se ejecutaron

Después de ejecutar las migraciones, deberías ver mensajes como:

```
Batch 1 run: 11 migrations
```

## Si hay errores

Si ves errores sobre migraciones duplicadas o problemas, puedes:

1. **Ver el estado de las migraciones:**
   ```bash
   npx knex migrate:status
   ```

2. **Hacer rollback y volver a ejecutar:**
   ```bash
   npm run db:rollback
   npm run db:migrate
   ```

## Migraciones pendientes

Las siguientes migraciones deberían ejecutarse:

- `010_add_trial_to_businesses.js` - Agrega campos de trial a businesses
- `011_create_system_config.js` - Crea tabla de configuración del sistema

Después de ejecutar las migraciones, reinicia el servidor.

