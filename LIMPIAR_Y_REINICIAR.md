# 🔄 Limpiar Caché y Reiniciar

## ⚠️ Después de corregir los errores, necesitas:

### Paso 1: Detener Metro
En la terminal donde está corriendo Metro:
```
Ctrl + C
```

### Paso 2: Limpiar caché e iniciar de nuevo
```bash
cd C:\Users\usuario\Desktop\pelu-turnos\mobile-expo
npm start -- --clear
```

O si prefieres hacerlo en dos pasos:
```bash
# Limpiar caché de Metro
npx expo start --clear

# O simplemente
npm start -- --clear
```

### Paso 3: Recargar en Expo Go
- Presiona `r` en la terminal, O
- Agita el celular y selecciona "Reload"

---

## ✅ Cambios Realizados:

1. ✅ Corregido import de Zustand: `import { create }` en lugar de `import create`
2. ✅ Simplificado App.tsx (sin SafeAreaProvider por ahora)
3. ✅ Actualizado useAuthStore.ts con sintaxis correcta

---

## 🔍 Si aún hay errores:

### Ver errores detallados:
1. Agita el celular
2. Selecciona "Show Element Inspector"
3. Revisa la consola de errores

### Reinstalar dependencias:
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

---

**¡Ahora detén Metro, limpia el caché y reinicia!**

