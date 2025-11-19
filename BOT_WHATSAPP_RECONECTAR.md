# 🔄 Reconectar Bot de WhatsApp

## ❌ Problema: El bot no responde a mensajes

**Causa común:** Después de un redeploy o reinicio del servidor, la sesión de WhatsApp se pierde y el bot necesita escanear el QR code nuevamente.

## ✅ Solución: Reconectar el Bot

### Opción 1: Desde el Frontend (Recomendado)

1. **Accede al panel de administración:**
   - URL: https://milo-bookings-admin-panel-f3hacagnc-milo-bookings-projects.vercel.app
   - Login como Super Admin: `admin@milobookings.com` / `admin123`

2. **Ve a la sección de Negocios:**
   - En el menú lateral, busca "Negocios" o "Admin"

3. **Encuentra tu negocio:**
   - Busca el negocio `demo-business-001` (Salón de Belleza Demo)

4. **Ver el QR Code:**
   - Haz clic en el botón **"Ver QR"**
   - Se mostrará un modal con el código QR

5. **Escanear el QR:**
   - Abre WhatsApp en tu teléfono
   - Ve a **Configuración** → **Dispositivos vinculados** → **Vincular un dispositivo**
   - Escanea el QR code que aparece en el modal

6. **Verificar conexión:**
   - Después de escanear, el estado del bot debería cambiar a **"authenticated"**
   - El bot ahora debería responder a los mensajes

### Opción 2: Reconectar desde la API

Si prefieres usar la API directamente:

```powershell
# 1. Obtener token de login
$body = @{business_id='demo-business-001'; phone='+5491123456789'; password='demo123'} | ConvertTo-Json
$response = Invoke-WebRequest -Uri 'https://milo-bookings.onrender.com/api/auth/login' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$token = ($response.Content | ConvertFrom-Json).token

# 2. Reconectar el bot (genera nuevo QR)
$headers = @{Authorization="Bearer $token"}
Invoke-WebRequest -Uri 'https://milo-bookings.onrender.com/api/admin/businesses/demo-business-001/reconnect-bot' -Method POST -Headers $headers -UseBasicParsing

# 3. Obtener el nuevo QR
$response = Invoke-WebRequest -Uri 'https://milo-bookings.onrender.com/api/bot/demo-business-001/qr' -Method GET -Headers $headers -UseBasicParsing
$qrData = ($response.Content | ConvertFrom-Json).data
Write-Host "QR Code: $($qrData.qr)"
```

### Opción 3: Verificar estado actual

Para ver el estado del bot sin reconectar:

```powershell
# Obtener estado
$token = 'TU_TOKEN_AQUI'
$headers = @{Authorization="Bearer $token"}
$response = Invoke-WebRequest -Uri 'https://milo-bookings.onrender.com/api/bot/demo-business-001/status' -Method GET -Headers $headers -UseBasicParsing
($response.Content | ConvertFrom-Json) | ConvertTo-Json
```

## 🔍 Estados del Bot

- **`waiting_qr`**: Necesita escanear QR code (estado actual)
- **`authenticated`**: Bot conectado y funcionando ✅
- **`initializing`**: Bot iniciando
- **`error`**: Error en la conexión
- **`not_initialized`**: Bot no inicializado

## ⚠️ Notas Importantes

1. **Sesiones persistentes**: El bot intenta mantener la sesión, pero después de un redeploy puede perderse
2. **QR expira**: Los QR codes expiran después de un tiempo. Si expira, necesitas reconectar
3. **Un solo dispositivo**: WhatsApp solo permite un dispositivo vinculado a la vez. Si escaneas desde otro teléfono, se desconectará el anterior
4. **Número del bot**: Asegúrate de estar escribiendo al número correcto configurado en el negocio (`+5491123456789` para el demo)

## 🐛 Troubleshooting

### El bot no responde después de escanear

1. **Verifica el estado:**
   ```powershell
   # Debería mostrar status: "authenticated"
   ```

2. **Revisa los logs en Render:**
   - Ve a Render Dashboard → Tu servicio → Logs
   - Busca mensajes que digan "Bot ready" o "Bot authenticated"
   - Busca errores relacionados con WhatsApp

3. **Verifica el número:**
   - Confirma que estás escribiendo al número correcto
   - El número debe coincidir con `whatsapp_number` del negocio

4. **Reconecta el bot:**
   - Si el estado sigue siendo "waiting_qr", reconecta el bot
   - Esto generará un nuevo QR code

### El QR code no aparece

1. **Verifica que el bot esté inicializado:**
   - Revisa los logs en Render
   - Deberías ver "Bot inicializado para: ..."

2. **Reconecta el bot:**
   - Usa el endpoint de reconexión para forzar un nuevo QR

### El bot se desconecta frecuentemente

1. **Problema común en Render Free Tier:**
   - El servicio puede "dormirse" después de 15 minutos de inactividad
   - Cuando se despierta, el bot puede necesitar reconexión

2. **Solución:**
   - Considera usar un servicio de pago para mantener el servicio activo
   - O implementa un health check que mantenga el servicio despierto

## 📝 Checklist de Reconexión

- [ ] Acceder al panel de administración
- [ ] Ver el QR code del bot
- [ ] Escanear el QR con WhatsApp
- [ ] Verificar que el estado cambie a "authenticated"
- [ ] Enviar un mensaje de prueba al bot
- [ ] Verificar que el bot responda

---

**¿Necesitas ayuda?** Revisa los logs en Render para ver más detalles sobre el estado del bot.

