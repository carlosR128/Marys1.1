# Guía: Módulo de formularios de entrega

## 📋 Descripción general
El módulo `delivery-form.js` gestiona la interfaz de selección de tipo de pedido (domicilio vs sucursal) con validaciones de campos en tiempo real.

---

## 🎯 Características

✅ **Validación de teléfono**: Solo permite 10 dígitos
✅ **Validación de zona**: Solo permite 5 localidades específicas
✅ **Validación en tiempo real**: Los campos se validan mientras escriben
✅ **Botón inteligente**: Se habilita solo cuando todo es válido
✅ **Mensajes de error claros**: Muestra por qué no puede continuar
✅ **Sin dependencias**: Código vanilla JavaScript puro

---

## 📍 Localidades permitidas para domicilio

1. Tepeaca
2. San Hipólito Xochiltenango
3. Candelaria Purificación
4. Santa María Oxtotipan
5. San Nicolás Zoyapetlayoca

*Si el usuario escribe una localidad no permitida, verá el mensaje "No contamos con servicio en tu zona" y no podrá continuar.*

---

## 🛠️ API Pública

El módulo expone un objeto global `window.DeliveryForm` con las siguientes funciones:

### `getDeliveryData()`
Retorna los datos del formulario de domicilio actual.

```javascript
const data = window.DeliveryForm.getDeliveryData();
// Retorna:
// {
//   type: 'domicilio',
//   name: 'Juan García',
//   phone: '2221234567',
//   zone: 'Tepeaca',
//   address: 'Calle Principal 123',
//   reference: 'Próximo al supermercado'
// }
```

### `getPickupData()`
Retorna los datos del formulario de sucursal actual.

```javascript
const data = window.DeliveryForm.getPickupData();
// Retorna:
// {
//   type: 'pickup',
//   name: 'María López',
//   phone: '5552345678',
//   branch: 'tepeaca'
// }
```

### `validateDeliveryForm()`
Valida todos los campos del formulario de domicilio.

```javascript
const isValid = window.DeliveryForm.validateDeliveryForm();
// Retorna: true o false
```

### `validatePickupForm()`
Valida todos los campos del formulario de sucursal.

```javascript
const isValid = window.DeliveryForm.validatePickupForm();
// Retorna: true o false
```

---

## 📡 Eventos Custom

El módulo dispara dos eventos custom que permiten ejecutar código personalizado:

### `order:delivery-ready`
Se dispara cuando el usuario hace clic en "Continuar pedido" en el formulario de domicilio y todos los campos son válidos.

```javascript
document.addEventListener('order:delivery-ready', (e) => {
    const data = e.detail;
    console.log('Pedido a domicilio listo:', data);
    // Aquí puedes guardar los datos, enviarlos al servidor, etc.
});
```

### `order:pickup-ready`
Se dispara cuando el usuario hace clic en "Continuar pedido" en el formulario de sucursal y todos los campos son válidos.

```javascript
document.addEventListener('order:pickup-ready', (e) => {
    const data = e.detail;
    console.log('Pedido para recoger listo:', data);
    // Aquí puedes guardar los datos, enviarlos al servidor, etc.
});
```

---

## 🎨 Interacción del usuario

### Flujo de domicilio:
1. Usuario hace clic en "A domicilio"
   - Se muestra el formulario de domicilio
   - Se oculta el formulario de sucursal
2. Usuario completa los campos (nombre, teléfono, localidad, etc.)
3. El sistema valida en tiempo real:
   - ✅ Nombre no vacío
   - ✅ Teléfono con 10 dígitos
   - ✅ Localidad en la lista permitida
4. Si todo es válido → Botón "Continuar pedido" se habilita
5. Usuario hace clic → Se dispara evento `order:delivery-ready`

### Flujo de sucursal:
1. Usuario hace clic en "Recoger"
   - Se muestra el formulario de sucursal
   - Se oculta el formulario de domicilio
2. Usuario completa los campos (nombre, teléfono, sucursal)
3. El sistema valida en tiempo real:
   - ✅ Nombre no vacío
   - ✅ Teléfono con 10 dígitos
   - ✅ Sucursal seleccionada
4. Si todo es válido → Botón "Continuar pedido" se habilita
5. Usuario hace clic → Se dispara evento `order:pickup-ready`

---

## 📝 Validaciones implementadas

### Teléfono
- **Regla**: Exactamente 10 dígitos
- **Aceptados**: "2221234567", "222-123-4567", "(222) 123-4567"
- **Rechazados**: "123", "22212345", "111 222 3333"

### Zona (domicilio)
- **Búsqueda flexible** (caso insensible):
  - Usuario escribe "tepeaca" → ✅ válido
  - Usuario escribe "TEPEACA" → ✅ válido
  - Usuario escribe "Tepea" → ❌ no coincide exacto
  - Usuario escribe "México" → ❌ no permitido

### Campos obligatorios
- **Domicilio**: Nombre, Teléfono, Localidad (obligatorios)
- **Sucursal**: Nombre, Teléfono, Sucursal (obligatorios)
- **Opcionales**: Dirección, Referencia (domicilio)

---

## 🚀 Ejemplo de integración completa

```javascript
// Escuchar cuando el usuario quiera hacer un pedido a domicilio
document.addEventListener('order:delivery-ready', async (e) => {
    const data = e.detail;
    
    try {
        // Enviar a tu API
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert(`Pedido guardado para ${data.name}`);
            // Limpiar formulario, cerrar modal, etc.
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Similar para pickups
document.addEventListener('order:pickup-ready', async (e) => {
    const data = e.detail;
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert(`Recoge tu pedido en ${data.branch}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
```

---

## 🐛 Debugging

Para ver qué datos se están capturando, abre la consola y ejecuta:

```javascript
// Obtener datos del formulario de domicilio
console.log(window.DeliveryForm.getDeliveryData());

// Obtener datos del formulario de sucursal
console.log(window.DeliveryForm.getPickupData());

// Validar formulario de domicilio
console.log(window.DeliveryForm.validateDeliveryForm());

// Validar formulario de sucursal
console.log(window.DeliveryForm.validatePickupForm());
```

---

## 📦 Estructura de archivos

```
index.html                    # HTML actualizado con formularios
js/
├── delivery-form.js         # Módulo principal (NUEVO)
├── cart.js                  # Carrito de compras
├── mobile-menu.js           # Menú móvil
└── promo-slider.js          # Slider de promociones
```

---

## ✨ Notas

- El módulo es completamente **independiente** del carrito de compras
- Los estudios están separados en un `<div>` oculto por defecto
- Los estilos inline mantienen los formularios funcionales sin cambiar CSS
- Compatible con todos los navegadores modernos
- Código totalmente documentado con comentarios JSDoc

