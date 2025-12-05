# ARJA ERP - App Móvil

App móvil para clientes de ARJA ERP construida con React Native y Expo.

## 📦 Repositorio

**Repositorio GitHub**: [https://github.com/arieljarovisky/arja-erp-mobile.git](https://github.com/arieljarovisky/arja-erp-mobile.git)

## 📍 Ubicación

La app está ubicada en:
```
pelu-turnos/mobile-expo/
```

## 📦 Estructura del Proyecto

```
mobile-expo/
├── App.tsx              # Componente principal
├── app.json            # Configuración de Expo
├── package.json        # Dependencias
├── tsconfig.json       # Configuración TypeScript
├── index.ts            # Punto de entrada
├── assets/             # Imágenes e iconos (logo ARJA ERP)
├── src/
│   ├── api/           # Cliente API
│   ├── screens/       # Pantallas de la app
│   ├── navigation/    # Navegación
│   ├── services/      # Servicios (auth, etc.)
│   ├── store/         # Estado global (Zustand)
│   └── utils/         # Utilidades
└── README.md          # Este archivo
```

## 🔧 Configuración

### Variables de Entorno

La app usa la siguiente URL de API por defecto:
- **Producción**: `https://backend-production-1042.up.railway.app`

Puedes crear un archivo `.env` en la raíz del proyecto si necesitas cambiar la URL:

```env
API_BASE_URL=https://backend-production-1042.up.railway.app
```

### Instalación

```bash
# Instalar dependencias
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

La app se conecta al backend en el repositorio principal (`pelu-turnos/backend`):

- **Endpoints públicos**: `/api/public/customer/*`
  - `GET /api/public/customer/tenant/:code` - Verificar tenant
  - `POST /api/public/customer/identify` - Identificar cliente

- **OAuth para clientes**: `/api/public/customer/oauth/*`
  - `GET /api/public/customer/oauth/google` - Iniciar OAuth
  - `GET /api/public/customer/oauth/google/callback` - Callback OAuth
  - `POST /api/public/customer/oauth/select-tenant` - Seleccionar tenant

## 🎨 Características

- **Nombre**: ARJA ERP
- **Logo**: Logo oficial de ARJA ERP
- **Colores**: Paleta de ARJA ERP (#13b5cf, #0d7fd4)
- **Autenticación**: OAuth de Google (identificación automática del negocio)
- **Plataformas**: iOS, Android, Web (Expo)

## 👥 Para Clientes

Esta app está diseñada para **clientes** de los negocios que usan ARJA ERP (gimnasios, peluquerías, etc.), no para los dueños o administradores del sistema.

### Flujo de Autenticación

1. El cliente inicia sesión con Google OAuth
2. El sistema identifica automáticamente el negocio al que pertenece
3. Si tiene múltiples negocios, puede seleccionar cuál usar
4. Accede a sus turnos, clases y membresías

## 📝 Notas Importantes

- La app requiere que el cliente tenga su email registrado en el sistema
- El backend identifica automáticamente el negocio basándose en el email
- Los estilos siguen el diseño de ARJA ERP del frontend web

## 🆘 Soporte

Para más información sobre el backend y los endpoints disponibles, consulta:
- Repositorio principal: `pelu-turnos/backend`
- Documentación de API en el código del backend
