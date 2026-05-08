# 🏗️ NUEVA ARQUITECTURA - Sistema De Dos Fases

## ✅ CAMBIOS IMPLEMENTADOS

Has solicitado que separemos completamente el flujo de selección de ubicación del flujo de pedido. Aquí te muestro exactamente qué cambió:

---

## 📊 COMPARATIVA: ANTES vs DESPUÉS

### ❌ ANTES (Todo mezclado):
```
Usuario abre página
    ↓
Botón "A domicilio" / "Recoger"
    ↓
Formulario pide: Nombre + Teléfono + Zona/Sucursal + Dirección
    ↓
TODO DEBE ESTAR VALIDADO para continuar
    ↓
Aún no hay nada en el carrito
```

### ✅ DESPUÉS (Dos fases separadas):

**FASE 1 - UBICACIÓN (SIN carrito requerido):**
```
Usuario hace clic en "A domicilio" o "Recoger"
    ↓
Se abre DIÁLOGO (modal) con MAPA
    ↓
Usuario SOLO selecciona ubicación:
    - Domicilio: Click en mapa/búsqueda/ubicación actual
    - Sucursal: Click en una de las 3 sucursales del mapa
    ↓
Se confirma ubicación y se guarda en sesión
    ↓
Diálogo se cierra
    ↓
Usuario continúa agregando productos al carrito
```

**FASE 2 - PEDIDO COMPLETO (Desde carrito):**
```
Cuando usuario hace clic en "Finalizar compra" (desde carrito)
    ↓
AHORA sí se muestra formulario con:
    - Nombre ✓
    - Teléfono ✓
    - Los otros datos (usa ubicación de FASE 1)
    ↓
Se envía al backend
```

---

## 📁 ARCHIVOS NUEVO/MODIFICADOS

### 🆕 ARCHIVOS NUEVOS (3):

1. **`js/location-service.js`** (230+ líneas)
   - Geolocalización del usuario
   - Validación de cobertura (polígono/radio)
   - Almacenamiento de ubicación seleccionada
   - Cálculo de distancias

2. **`js/maps-service.js`** (180+ líneas)
   - Integración con Google Maps API
   - Inicialización de mapas
   - Geocodificación de direcciones
   - Manejo de marcadores

3. **`css/location-dialog.css`** (400+ líneas)
   - Estilos para diálogos (modal)
   - Estilos para mapas
   - Tabs responsive
   - Branches list

### ♻️ ARCHIVOS MODIFICADOS (3):

1. **`index.html`**
   - ✅ Agregado: Script de Google Maps API (comentado, necesita tu KEY)
   - ✅ Agregado: Links a location-service.js y maps-service.js
   - ✅ Reemplazado: Formularios viejos por DIALOGs (modales)
   - ✅ Agregado: Tabs para domicilio (Mapa/Busca/Mi ubicación)
   - ✅ Agregado: Mapa de sucursales para recoger

2. **`js/delivery-form.js`** (REESCRITO COMPLETO)
   - ✅ Separa FASE 1 (ubicación) de FASE 2 (datos)
   - ✅ Abre diálogos (no formularios inline)
   - ✅ Integra Google Maps
   - ✅ Maneja geolocalización

3. **`css/location-dialog.css`** (nuevo archivo importado)
   - ✅ Estilos modernos para diálogos
   - ✅ Responsive para mobile/tablet/desktop

---

## 🎯 FLUJO ACTUAL (FASE 1 - UBICACIÓN)

### Para DOMICILIO:
```javascript
Usuario hace clic en "A domicilio"
    ↓
Dialog se abre con 3 opciones:
    1. TAB "Mapa" - Click en mapa → selecciona ubicación
    2. TAB "Buscar" - Escribe dirección → busca y selecciona
    3. TAB "Mi ubicación" - Botón → usa geolocalización
    ↓
Se valida si está dentro de cobertura:
    ✅ Verde si está DENTRO
    ❌ Roja si está FUERA
    ↓
Usuario confirma ubicación
    ↓
Dialog se cierra
    ↓
Ubicación guardada en sessionStorage
```

### Para RECOGER:
```javascript
Usuario hace clic en "Recoger"
    ↓
Dialog se abre con:
    - Mapa mostrando 3 sucursales
    - Lista de 3 sucursales debajo
    ↓
Usuario hace clic en una sucursal
    ↓
Dialog se cierra
    ↓
Sucursal guardada en sessionStorage
```

---

## 🔧 CONFIGURACIÓN REQUERIDA

### 1. Google Maps API Key (CRÍTICO)

En `index.html`, línea ~13:
```html
<!-- ACTUAL (COMENTADO): -->
<!-- <script src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY_AQUI&libraries=geometry"></script> -->

<!-- DEBES CAMBIAR A: -->
<script src="https://maps.googleapis.com/maps/api/js?key=MiApiKeyReal123&libraries=geometry"></script>
```

**¿Cómo obtener la API Key?**
→ Ver archivo: `GUIA_GOOGLE_MAPS_API.md` que creamos anteriormente

### 2. Coordenadas de Sucursales

En `js/location-service.js`, líneas ~22-46:
```javascript
const BRANCHES = [
    {
        id: 1,
        name: 'Sucursal Tepeaca',
        lat: 19.1456,  // ← ACTUALIZAR CON TUS COORDENADAS
        lng: -97.5859, // ← ACTUALIZAR CON TUS COORDENADAS
        ...
    },
    // ... más sucursales
];
```

### 3. Área de Cobertura (Polígono)

En `js/location-service.js`, líneas ~16-20:
```javascript
const DELIVERY_COVERAGE_POLYGON = [
    { lat: 19.250, lng: -97.500 },  // ← Puntos frontera de tu zona
    { lat: 19.150, lng: -97.400 },
    { lat: 19.050, lng: -97.500 },
    { lat: 19.150, lng: -97.600 }
];
```

---

## 📱 ESTADOS ACTUALES

### Estado: `DeliveryForm` (API Pública)
```javascript
// FASE 1 - Abrir diálogos
window.DeliveryForm.openDeliveryDialog()  // Abre mapa de domicilio
window.DeliveryForm.openPickupDialog()    // Abre mapa de sucursales

// Acceder a la ubicación seleccionada
const location = window.DeliveryForm.getSelectedLocation()
console.log(location);
// {
//   type: 'delivery' o 'pickup',
//   lat: 19.1456,
//   lng: -97.5859,
//   address: 'Tu dirección',
//   branchId: 1 (si es pickup),
//   savedToSession: true
// }

// Guardar manualmente
window.DeliveryForm.saveSelectedLocation()
```

### Estado: `LocationService` (API Pública)
```javascript
// Validar cobertura
const validation = window.LocationService.validateDeliveryLocation(lat, lng);
console.log(validation);
// { inCoverage: true, message: "Ubicación dentro de zona de cobertura ✅" }

// Obtener sucursales
const branches = window.LocationService.getBranches();
const nearest = window.LocationService.getNearestBranch(lat, lng);
```

### Estado: `MapsService` (API Pública)
```javascript
// Geocodifcar dirección
const result = await window.MapsService.geocodeAddress('Mi dirección');
console.log(result);
// { lat: 19.145, lng: -97.586, formattedAddress: '...' }
```

---

## ⚡ LO QUE FALTA PARA COMPLETAR

### Para que FASE 1 funcione 100%:

1. **[ ] Obtener Google Maps API Key**
   - Seguir: GUIA_GOOGLE_MAPS_API.md
   - Pegar key en index.html

2. **[ ] Extraer coordenadas de las 3 sucursales**
   - Tienes los links: 
     - https://maps.app.goo.gl/HEFToaAxwvV6vSxQA
     - https://maps.app.goo.gl/khXdystsmSNtywwF7
     - https://maps.app.goo.gl/Kh1Fn4QcNbi5uf629
   - Actualizar en `location-service.js`

3. **[ ] Definir polígono de cobertura**
   - Determinar fronteras de tu zona de delivery
   - Agregar puntos al array `DELIVERY_COVERAGE_POLYGON` en `location-service.js`

4. **[ ] Crear FASE 2 (Completar pedido)**
   - Cuando usuario hace "Finalizar compra" en carrito
   - Mostrar formulario con nombre/teléfono/observaciones
   - Usar ubicación seleccionada de FASE 1
   - Enviar al backend

---

## 🧪 CÓMO PROBAR AHORA

Una vez tengas la Google Maps API Key:

### Desktop:
```
1. Abre: http://localhost:3000/index.html
2. Haz clic en "A domicilio"
3. Se abre diálogo con mapa
4. Selecciona ubicación en mapa
5. Se confirma ubicación
6. Cierra el diálogo
```

### Mobile:
```
Igual que desktop, pero en teléfono
```

---

## 📋 PRÓXIMO PASO RECOMENDADO

1. **PRIMERO**: Obtén Google Maps API Key (15 min)
2. **SEGUNDO**: Extrae coordenadas de 3 sucursales (5 min)
3. **TERCERO**: Define polígono de cobertura (10 min)
4. **CUARTO**: Prueba FASE 1 completamente
5. **QUINTO**: Luego crearemos FASE 2 (formulario de pedido completo)

---

## ✨ BENEFICIOS DE ESTA ARQUITECTURA

✅ **Separación clara** - ubicación vs datos personales
✅ **No requiere carrito lleno** - usuario selecciona ubicación primero
✅ **Mejor UX** - flujo más lógico y claro
✅ **Reutilizable** - ubicación se guarda y se usa después
✅ **Flexible** - fácil de modificar cobertura o sucursales
✅ **Validación temprana** - sabe si tiene cobertura antes de llenar carrito

---

*Actualizado: 7 de abril de 2026*
*Arquitectura: Two-Phase Location Selection*
