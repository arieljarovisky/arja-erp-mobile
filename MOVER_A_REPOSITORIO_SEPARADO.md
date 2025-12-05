# 📦 Guía: Mover la App Móvil a un Repositorio Separado

Esta guía te ayudará a mover la app móvil a su propio repositorio Git independiente.

## 📍 Ubicación Actual

```
pelu-turnos/
├── backend/
├── frontend/
└── mobile-expo/  ← La app móvil está aquí
```

## 🎯 Pasos para Crear Repositorio Separado

### Paso 1: Preparar la Carpeta

1. Abre una terminal en la carpeta `pelu-expo`:
   ```bash
   cd C:\Users\usuario\Desktop\pelu-turnos\mobile-expo
   ```

2. Verifica que tengas todos los archivos importantes:
   - `App.tsx`
   - `package.json`
   - `app.json`
   - `src/` (con todo el código)
   - `.gitignore`

### Paso 2: Crear el Repositorio en GitHub/GitLab

1. Ve a GitHub (o GitLab) y crea un nuevo repositorio:
   - Nombre sugerido: `arja-erp-mobile` o `pelu-turnos-mobile`
   - **NO inicialices con README, .gitignore o licencia** (ya los tenemos)

2. Copia la URL del repositorio (ej: `https://github.com/tu-usuario/arja-erp-mobile.git`)

### Paso 3: Inicializar Git en la Carpeta

Desde la terminal en `mobile-expo`:

```bash
# Si ya existe un .git (estás en el repo principal), elimínalo primero
rm -rf .git

# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: ARJA ERP Mobile App"

# Agregar el remoto (reemplaza con tu URL)
git remote add origin https://github.com/tu-usuario/arja-erp-mobile.git

# Crear rama main y hacer push
git branch -M main
git push -u origin main
```

### Paso 4: Verificar que Todo Funciona

1. En GitHub/GitLab, verifica que todos los archivos estén ahí
2. Clona el repositorio en otra ubicación para probar:
   ```bash
   cd ..
   mkdir test-clone
   cd test-clone
   git clone https://github.com/tu-usuario/arja-erp-mobile.git
   cd arja-erp-mobile
   npm install
   npm start
   ```

## 🔄 Actualizar Referencias

Una vez que la app esté en su propio repositorio:

1. **Actualiza el README principal** del proyecto `pelu-turnos` para mencionar que la app móvil está en otro repositorio

2. **Documenta la conexión** entre repositorios:
   - La app móvil se conecta al backend en `backend-production-1042.up.railway.app`
   - Los endpoints públicos están en `backend/src/routes/customerPublic.js`
   - El OAuth está en `backend/src/routes/customerOAuth.js`

## 📝 Archivos Importantes a Incluir

Asegúrate de incluir estos archivos en el repositorio:

- ✅ `App.tsx` - Componente principal
- ✅ `package.json` - Dependencias
- ✅ `app.json` - Configuración Expo
- ✅ `tsconfig.json` - Config TypeScript
- ✅ `src/` - Todo el código fuente
- ✅ `.gitignore` - Archivos a ignorar
- ✅ `README.md` - Documentación
- ✅ `assets/` - Imágenes e iconos (si existen)

## ⚠️ Archivos que NO Debes Incluir

- ❌ `node_modules/` - Se instala con `npm install`
- ❌ `.env` - Variables de entorno (si usas)
- ❌ Archivos de build temporales
- ❌ Logs

## 🎉 ¡Listo!

Una vez completados estos pasos, tendrás:
- ✅ App móvil en su propio repositorio
- ✅ Independencia para desarrollo
- ✅ Historial Git separado
- ✅ Facilidad para colaborar en la app móvil

## 📞 Siguiente Paso

Después de mover la app, actualiza:
1. La documentación del proyecto principal
2. Cualquier CI/CD que uses
3. Los enlaces en la documentación

