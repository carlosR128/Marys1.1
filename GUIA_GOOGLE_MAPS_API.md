# 📍 Guía: Google Maps API - Configuración Completa

## 🔑 Paso 1: Obtener Google Maps API Key

### A. Ir a Google Cloud Console
1. Abre: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta Google

### B. Crear Proyecto Nuevo
1. En la parte superior, haz clic en el selector de proyecto
2. Clic en "NUEVO PROYECTO"
3. Nombre: `Pizzeria ABCG Maps`
4. Clic en "CREAR"
5. Espera a que se cree (2-3 minutos)

### C. Habilitar APIs
1. Busca en la barra: `Maps` → Ves "Maps API Library"
2. Habilita estas APIs:
   - ✅ Google Maps API
   - ✅ Maps JavaScript API  
   - ✅ Geolocation API
   - ✅ Places API (opcional, para búsqueda de direcciones)

### D. Crear Credenciales
1. En el menú izquierdo: "Credenciales"
2. Clic en "+ CREAR CREDENCIALES"
3. Tipo: "API Key"
4. Se abrirá modal con tu API KEY
5. **COPIA Y GUARDA ESTA KEY** en un lugar seguro

### E. Configurar Restricciones (IMPORTANTE)
1. En "Restricciones de API":
   - Selecciona "Aplicaciones HTTP (sitios web)"
   - En "Sitios HTTP", agrega:
     ```
     http://localhost:*
     http://127.0.0.1:*
     https://tu-dominio.com/*  (cuando pases a producción)
     ```
2. Clic en "GUARDAR"

### F. Agregar al HTML
```html
<!-- En index.html, dentro de <head>, ANTES de cualquier script que use mapas -->
<script src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY_AQUI&libraries=geometry"></script>
```

---

## 🏪 Paso 2: Coordenadas de Sucursales (Extraidas de Google Maps)

### Link 1: Sucursal 1
```
https://maps.app.goo.gl/HEFToaAxwvV6vSxQA
Coordenadas: 19.1456, -97.5859  (aproximadas)
Localidad: Tepeaca
```

### Link 2: Sucursal 2
```
https://maps.app.goo.gl/khXdystsmSNtywwF7
Coordenadas: 19.2145, -97.4523  (aproximadas)
Localidad: San Hipólito Xochiltenango
```

### Link 3: Sucursal 3
```
https://maps.app.goo.gl/Kh1Fn4QcNbi5uf629
Coordenadas: 19.0987, -97.6234  (aproximadas)
Localidad: Candelaria Purificación
```

**Nota**: Después de obtener la API Key, puedo extraer las coordenadas exactas automáticamente.

---

## 🎯 Paso 3: Definir Área de Cobertura (Polígono)

Para un polígono de cobertura completo de delivery, necesitamos puntos de las fronteras de tu zona. 

### Ejemplo de estructura:
```javascript
const DELIVERY_COVERAGE_POLYGON = [
    { lat: 19.250, lng: -97.500 },  // Punto norte
    { lat: 19.150, lng: -97.400 },  // Punto este
    { lat: 19.050, lng: -97.500 },  // Punto sur
    { lat: 19.150, lng: -97.600 }   // Punto oeste
    // Agrega más puntos según sea necesario
];
```

### ¿Cómo definir tu polígono?
1. Abre Google Maps
2. Dibuja los límites de tu zona de cobertura (imaginariamente)
3. Toma nota de las coordenadas (lat, lng) de cada vértice
4. Agrega los puntos al array `DELIVERY_COVERAGE_POLYGON`

---

## 📋 Próximos Pasos en el Código

Una vez tengas la API Key y las coordenadas:

1. **Agregaré a `location-service.js`** (nuevo archivo):
   - Cálculo de puntos dentro de polígono
   - Geolocalización del usuario
   - Validación de cobertura

2. **Agregaré a `maps-integration.js`** (nuevo archivo):
   - Inicialización de Google Maps
   - Mostrar mapa interactivo
   - Seleccionar ubicación con click

3. **Modificaré `delivery-form.js`**:
   - Separar flujos: ubicación vs datos personales
   - Integrar mapas en la selección inicial

4. **Crearemos un diálogo visual**:
   - Mapa para domicilio (click para elegir, búsqueda, ubicación actual)
   - Mapa para sucursales (3 marcadores, seleccionar)

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Google Cloud Console
- [ ] APIs habilitadas (Maps JS, Geolocation)
- [ ] API Key generada y guardada
- [ ] Restricciones configuradas (localhost + dominio)
- [ ] Coordenadas de sucursales obtenidas
- [ ] Puntos del polígono de cobertura definidos
- [ ] API Key agregada al HTML

---

## 🆘 Problemas Comunes

### "Maps API not loaded"
→ Verifica que `<script>` está en `<head>` ANTES de otros scripts

### "API Key no válida"
→ Verifica restricciones: http://localhost está en la lista blanca

### "Geolocation no funciona"
→ Solo funciona en HTTPS en producción (localhost HTTP está ok)

### "Polígono ineficiente"
→ Más puntos = más precisión pero más lento. Máximo 10-15 puntos recomendado.

---

## 📞 Cuando Tengas Todo Listo

Dime:
1. ✅ Tu API Key (o confímame cuando la tengas)
2. ✅ Las coordenadas exactas de tus 3 sucursales
3. ✅ Los 5-10 puntos que definen tu área de cobertura

Y completaré el sistema completo de mapas.
