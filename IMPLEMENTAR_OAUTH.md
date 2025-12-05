# 🔐 Implementar Google OAuth en la App Móvil

## 🎯 Opciones para OAuth en la App Móvil

Tienes dos opciones principales:

---

## 🟢 Opción 1: Google OAuth Directo (Recomendado)

### Ventajas:
- ✅ Más simple y directo
- ✅ Mejor UX para móvil
- ✅ Usa el SDK nativo de Google

### Implementación:

1. **Instalar dependencias:**
```bash
cd mobile-expo
npx expo install expo-auth-session expo-web-browser
```

2. **Configurar Google Cloud Console:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo OAuth Client ID para aplicaciones móviles
   - O usa el mismo que tienes pero agrega el redirect URI de Expo

3. **Actualizar App.tsx** - Ya está parcialmente hecho

---

## 🔵 Opción 2: Usar el Backend OAuth (Más Complejo)

### Ventajas:
- ✅ Reutiliza la lógica del backend
- ✅ Mismo flujo que el web

### Desventajas:
- ⚠️ Más complejo de implementar
- ⚠️ Requiere manejar redirects personalizados

---

## 📝 Implementación Recomendada

### Paso 1: Usar Expo Google Auth

La forma más simple es usar el paquete de Expo:

```bash
npx expo install expo-auth-session expo-web-browser
```

### Paso 2: Configurar

1. Obtener el `GOOGLE_CLIENT_ID` del backend
2. Configurarlo en la app
3. Implementar el flujo OAuth

### Paso 3: Conectar con Backend

Una vez que obtengas el token de Google, enviarlo al backend para:
- Validar el usuario
- Obtener los tokens de tu sistema
- Crear/actualizar usuario si es necesario

---

## 🔧 Código Base Ya Creado

Ya creé la estructura básica en `App.tsx`. Ahora necesitas:

1. **Obtener el GOOGLE_CLIENT_ID** del backend
2. **Configurarlo en la app**
3. **Implementar el endpoint en el backend** para recibir el token de Google desde móvil

---

## 💡 Recomendación

**Usa Google OAuth directo** con `expo-auth-session`, es más simple y funciona mejor en móvil.

Luego, el backend solo necesita validar el token y crear/autenticar al usuario.

---

**¿Quieres que implemente la opción completa ahora?**

