# ARJA ERP - App Móvil

App móvil para clientes de ARJA ERP construida con React Native y Expo.

## 📍 Ubicación Actual

La app está actualmente en:
```
pelu-turnos/mobile-expo/
```

## 🚀 Para Mover a un Repositorio Separado

Si quieres tener la app en un repositorio Git independiente, sigue estos pasos:

### Opción 1: Crear un Nuevo Repositorio Git

1. **Crear un nuevo repositorio en GitHub/GitLab/etc:**
   - Nombre sugerido: `arja-erp-mobile` o `pelu-turnos-mobile`

2. **Desde la carpeta `mobile-expo`, inicializar Git:**
   ```bash
   cd mobile-expo
   git init
   git add .
   git commit -m "Initial commit: ARJA ERP Mobile App"
   ```

3. **Conectar con el repositorio remoto:**
   ```bash
   git remote add origin <URL_DEL_REPOSITORIO_NUEVO>
   git branch -M main
   git push -u origin main
   ```

### Opción 2: Mover la Carpeta y Crear Repositorio

1. **Mover la carpeta `mobile-expo` a una ubicación separada:**
   ```bash
   # Desde la raíz del proyecto
   cd ..
   mkdir arja-erp-mobile  # o el nombre que prefieras
   mv pelu-turnos/mobile-expo/* arja-erp-mobile/
   ```

2. **Inicializar Git en la nueva ubicación:**
   ```bash
   cd arja-erp-mobile
   git init
   git add .
   git commit -m "Initial commit: ARJA ERP Mobile App"
   git remote add origin <URL_DEL_REPOSITORIO>
   git push -u origin main
   ```

## 📦 Estructura del Proyecto

```
mobile-expo/
├── App.tsx              # Componente principal
├── app.json            # Configuración de Expo
├── package.json        # Dependencias
├── tsconfig.json       # Configuración TypeScript
├── assets/             # Imágenes e iconos
├── src/
│   ├── api/           # Cliente API
│   ├── screens/       # Pantallas de la app
│   ├── navigation/    # Navegación
│   └── services/      # Servicios (auth, etc.)
└── README.md          # Este archivo
```

## 🔧 Configuración

### Variables de Entorno

La app usa la siguiente URL de API por defecto:
- **Producción**: `https://backend-production-1042.up.railway.app`

Puedes crear un archivo `.env` en la raíz del proyecto:

```env
API_BASE_URL=https://backend-production-1042.up.railway.app
```

### Instalación

```bash
npm install
# o
yarn install
```

### Ejecutar la App

```bash
# Iniciar Metro bundler
npm start

# Android
npm run android

# iOS (solo macOS)
npm run ios

# Web
npm run web
```

## 🔗 Conexión con el Backend

La app se conecta al backend en:
- `backend/src/routes/customerPublic.js` - Endpoints públicos para clientes
- `backend/src/routes/customerOAuth.js` - OAuth para clientes

## 📝 Notas Importantes

- La app está configurada para clientes (no usuarios del sistema)
- Usa autenticación por OAuth de Google
- El nombre de la app es "ARJA ERP"
- Los colores y estilos siguen el diseño de ARJA ERP

## 🆘 Soporte

Para más información, consulta la documentación del proyecto principal o contacta al equipo de desarrollo.

