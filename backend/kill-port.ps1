# Script para cerrar procesos en el puerto 3000
Write-Host "🔍 Buscando procesos en el puerto 3000..." -ForegroundColor Cyan

$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "📋 Procesos encontrados: $($processes -join ', ')" -ForegroundColor Yellow
    foreach ($pid in $processes) {
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "🛑 Cerrando proceso $pid ($($proc.ProcessName))..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        } catch {
            Write-Host "⚠️  No se pudo cerrar el proceso $pid" -ForegroundColor Red
        }
    }
    Write-Host "✅ Procesos cerrados. El puerto 3000 está libre ahora." -ForegroundColor Green
} else {
    Write-Host "✅ El puerto 3000 está libre." -ForegroundColor Green
}

