# 🚀 Pasos Rápidos para Crear Repositorio Separado

## 1️⃣ Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `arja-erp-mobile` (o el que prefieras)
3. **NO** marques "Add a README file"
4. Clic en "Create repository"
5. Copia la URL del repositorio (ej: `https://github.com/tu-usuario/arja-erp-mobile.git`)

## 2️⃣ Inicializar Git en mobile-expo

Abre PowerShell o CMD en la carpeta `mobile-expo`:

```powershell
# Ir a la carpeta
cd C:\Users\usuario\Desktop\pelu-turnos\mobile-expo

# Si ya hay un .git (del repo principal), no hagas nada especial
# Si quieres estar seguro, verifica:
# dir .git

# Inicializar Git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: ARJA ERP Mobile App"

# Agregar remoto (REEMPLAZA con tu URL)
git remote add origin https://github.com/tu-usuario/arja-erp-mobile.git

# Subir al repositorio
git branch -M main
git push -u origin main
```

## 3️⃣ Verificar

Ve a tu repositorio en GitHub y verifica que todos los archivos estén ahí.

## ✅ ¡Listo!

Ahora tienes la app móvil en su propio repositorio separado.

## 📝 Nota Importante

La app se conecta al backend en:
- URL: `https://backend-production-1042.up.railway.app`
- Endpoints públicos: `/api/public/customer/*`
- OAuth: `/api/public/customer/oauth/*`

Estos endpoints están en el repositorio principal (`pelu-turnos/backend`).

