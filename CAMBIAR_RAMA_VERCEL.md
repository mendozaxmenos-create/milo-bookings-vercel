# 🔧 Cambiar Rama en Vercel

## Pasos para que Vercel use `feat/logs-and-improvements`

1. **Ve a Vercel Dashboard**
   - https://vercel.com/dashboard
   - Selecciona tu proyecto

2. **Ve a Settings**
   - Click en **"Settings"** (arriba del proyecto)

3. **Ve a Git**
   - En el menú lateral, click en **"Git"**

4. **Cambia la Production Branch**
   - Busca **"Production Branch"**
   - Cambia de `main` a `feat/logs-and-improvements`
   - O déjala en `main` y agrega `feat/logs-and-improvements` como rama adicional

5. **Guarda los cambios**
   - Click en **"Save"**

6. **Vercel hará deploy automáticamente**
   - Ve a la pestaña **"Deployments"**
   - Deberías ver un nuevo deployment en progreso

---

## Alternativa: Usar Pull Request

Si prefieres mantener `main` como rama de producción:

1. Crea un Pull Request desde `feat/logs-and-improvements` a `main`
2. Haz merge del PR
3. Vercel desplegará automáticamente desde `main`

---

**Recomendación**: Cambia la rama en Vercel (Opción 1) - Es más rápido y no requiere merge.

