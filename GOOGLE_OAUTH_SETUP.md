# 🔐 Configuración de Google OAuth para App Móvil

## 📋 Requisitos

Para usar Google OAuth en la app móvil necesitas:

1. **Credenciales de Google OAuth** configuradas en Google Cloud Console
2. **Expo Auth Session** para manejar el flujo OAuth
3. **Configurar el redirect URI** para la app móvil

---

## 🔧 Paso 1: Instalar Dependencias

```bash
cd mobile-expo
npx expo install expo-auth-session expo-web-browser
```

---

## 📝 Paso 2: Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services > Credentials**
4. Edita tu **OAuth 2.0 Client ID** existente o crea uno nuevo
5. Agrega los **Authorized redirect URIs** para Expo:
   - `exp://127.0.0.1:8081` (desarrollo)
   - `exp://localhost:8081` (desarrollo)
   - Tu URL de Expo (producción)

---

## 🚀 Paso 3: Implementar en la App

El código ya está actualizado en `App.tsx` para usar Google OAuth.

---

## ⚠️ Nota Importante

El flujo actual usa el OAuth del backend. Para una mejor experiencia móvil, podrías:

1. **Usar Expo Google Auth** (más simple)
2. **O adaptar el callback del backend** para manejar la respuesta móvil

---

## 🔄 Próximos Pasos

1. Instalar las dependencias
2. Configurar Google Cloud Console
3. Probar el login

---

**¡Vamos a implementarlo!**

