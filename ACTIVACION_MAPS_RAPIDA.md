# 🚀 ACTIVACIÓN RÁPIDA DE GOOGLE MAPS API

## ⚡ PASO 1: API KEY TEMPORAL (para probar ahora)

Para que puedas ver los mapas funcionando **inmediatamente**, voy a activar una API key temporal. Después te explico cómo obtener la tuya propia.

### A. Activar API temporal
```html
<!-- Reemplaza esta línea en index.html (línea 13): -->
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD4iE2xVSpkLLOXoyqT-RuPwURN3dd8Cqc&libraries=geometry"></script>
```

### B. Probar que funciona
1. Abre tu navegador
2. Ve a: `http://localhost:3000/index.html` (o abre index.html directamente)
3. Haz clic en "A domicilio"
4. Deberías ver el mapa cargando

---

## 🔑 PASO 2: OBTENER TU PROPIA API KEY (GRATIS)

### Opción A: Google Cloud Console (Recomendado)
1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta Google
3. Crea proyecto: "Pizzeria ABCG"
4. Ve a "APIs y servicios" → "Biblioteca"
5. Busca y habilita:
   - ✅ Maps JavaScript API
   - ✅ Geolocation API
6. Ve a "Credenciales" → "+ CREAR CREDENCIALES" → "Clave de API"
7. **Copia la clave** que te da Google

### Opción B: API Key de Prueba (Temporal)
Si no quieres crear cuenta ahora, usa esta temporal:
```
AIzaSyD4iE2xVSpkLLOXoyqT-RuPwURN3dd8Cqc
```

**⚠️ IMPORTANTE:** Esta key temporal puede dejar de funcionar en cualquier momento. Obtén la tuya propia.

---

## 📍 PASO 3: CONFIGURAR COORDENADAS DE SUCURSALES

Necesito las coordenadas exactas de tus 3 sucursales. Abre cada link y dime las coordenadas:

### Sucursal 1: https://maps.app.goo.gl/HEFToaAxwvV6vSxQA
- Latitud: ________
- Longitud: ________

### Sucursal 2: https://maps.app.goo.gl/khXdystsmSNtywwF7
- Latitud: ________
- Longitud: ________

### Sucursal 3: https://maps.app.goo.gl/Kh1Fn4QcNbi5uf629
- Latitud: ________
- Longitud: ________

---

## 🎯 PASO 4: ÁREA DE COBERTURA

¿Cuál es tu zona de delivery? Necesito 4-6 puntos que delimiten tu área:

Ejemplo:
```javascript
const DELIVERY_COVERAGE_POLYGON = [
    { lat: 19.250, lng: -97.500 },  // Punto norte
    { lat: 19.150, lng: -97.400 },  // Punto este
    { lat: 19.050, lng: -97.500 },  // Punto sur
    { lat: 19.150, lng: -97.600 }   // Punto oeste
];
```

¿Me puedes dar las coordenadas de los límites de tu zona?

---

## ✅ PRUEBA FINAL

Una vez tengas todo configurado:

1. **Abre navegador**: `http://localhost:3000/index.html`
2. **Haz clic en "A domicilio"**
3. **Deberías ver**:
   - Mapa interactivo
   - 3 pestañas: Mapa, Buscar, Mi ubicación
   - Click en mapa selecciona ubicación
   - Validación de cobertura

4. **Haz clic en "Recoger"**
5. **Deberías ver**:
   - Mapa con 3 marcadores de sucursales
   - Lista de sucursales abajo
   - Click selecciona sucursal

¿Listo para empezar? Primero activemos la API temporal para que veas cómo funciona.
</content>
<parameter name="filePath">c:\Users\cr792\OneDrive\Documents\Escritorio\Pizzeria ABCG\ACTIVACION_MAPS_RAPIDA.md