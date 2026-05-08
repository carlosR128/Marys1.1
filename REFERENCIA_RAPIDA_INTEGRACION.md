# 🚀 Integración Completa - Formularios de Entrega

## ✅ Implementado - 6 de abril de 2026

### Resumen de cambios:

#### 1. **HTML (index.html)**
- ✅ Botones con IDs: `btn-domicilio` y `btn-sucursal`
- ✅ Formularios ocultos por defecto (display: none en CSS)
- ✅ Campos organizados semánticamente
- ✅ Toast container para mensajes

#### 2. **CSS (main.css)** - ESTILOS RESPONSIVOS
- ✅ Diseño adaptable (Desktop, Tablet, Mobile)
- ✅ Animaciones suaves (slideUp, fadeIn)
- ✅ Validaciones visuales (bordes rojo en errores)
- ✅ Toast messages con diferentes estados
- ✅ Botones deshabilitados con estilos claros

**Breakpoints:**
- Desktop: Sin restricciones
- Tablet: 768px y menos
- Mobile: 480px y menos

#### 3. **JavaScript (delivery-form.js)** - INTEGRACIÓN COMPLETA
- ✅ Validaciones en tiempo real
- ✅ Envío automático al backend
- ✅ Toast messages (éxito, error, carga)
- ✅ Eventos custom para otras integraciones
- ✅ Limpieza de formularios post-envío

#### 4. **JavaScript (cart.js)** - EXPOSICIÓN DE API
- ✅ `window.Cart` con métodos públicos
- ✅ `window.cartItems` accesible (getter)
- ✅ Compatible con delivery-form.js

---

## 🎯 Función Principal

Cuando usuario hace clic en "Continuar pedido" después de llenar un formulario:

```javascript
// delivery-form.js automáticamente:
1. Valida todos los campos
2. Obtiene items del carrito (si existen)
3. Construye payload
4. Envía POST a http://localhost:3000/api/orders
5. Muestra toast de éxito/error
6. Guarda en sessionStorage
7. Dispara evento 'order:submitted'
8. Limpia formularios
```

---

## 📊 Datos Enviados al Servidor

```javascript
{
  customerName: "Juan García",
  customerPhone: "2221234567",
  orderType: "domicilio" | "para_llevar",
  paymentMethod: "efectivo",
  deliveryAddress: "Calle Principal 123",
  notes: "Referencia o indicaciones",
  items: [ /* array de items del carrito */ ],
  branchId: 1 /* para pickup */
}
```

---

## 🎨 Responsive Design

### Desktop (1200px+)
- Formulario centrado, ancho máximo 600px
- Botones con hover effects
- Errores mostrados en rojo

### Tablet (768px - 1199px)
- Padding reducido
- Fuentes más pequeñas
- Toast en las esquinas

### Mobile (480px - 767px)
- Ancho completo con márgenes
- Fonte de 16px (evita zoom en iOS)
- Botones más grandes para touch
- Toast inferior (alineado a bordes)

### Extra Small (<480px)
- Forma ultra compacta
- Sin líneas horizontales
- Botones ocupan 100% ancho
- Textarea ajustado para pantalla

---

## 🔌 API Pública Expuesta

### `window.DeliveryForm`
```javascript
DeliveryForm.openDeliveryForm()      // Abre formulario domicilio
DeliveryForm.openPickupForm()        // Abre formulario sucursal
DeliveryForm.getDeliveryData()       // Obtiene datos domicilio
DeliveryForm.getPickupData()         // Obtiene datos sucursal
DeliveryForm.validateDeliveryForm()  // Valida domicilio (true/false)
DeliveryForm.validatePickupForm()    // Valida sucursal (true/false)
DeliveryForm.showToast(msg, type)    // Muestra toast
```

### `window.Cart`
```javascript
Cart.getItems()      // Obtiene copia de items del carrito
Cart.clearCart()     // Vacía el carrito
Cart.getTotal()      // Retorna total
Cart.showToast(msg)  // Muestra toast del carrito
```

### `window.cartItems`
```javascript
// Getter que retorna el array de items actual
const items = window.cartItems;
```

---

## 📡 Eventos Custom

### `order:submitted`
Se dispara cuando el pedido se guarda exitosamente.

```javascript
document.addEventListener('order:submitted', (e) => {
    // e.detail contiene: { type, name, phone, zone, etc., orderId }
    console.log('Pedido guardado:', e.detail);
});
```

---

## 🧪 Cómo Probar

### En la consola del navegador:

```javascript
// Prueba el formulario de domicilio
window.DeliveryForm.openDeliveryForm();

// Rellena los campos programáticamente
document.getElementById('delivery-name').value = 'Test User';
document.getElementById('delivery-phone').value = '2221234567';
document.getElementById('delivery-zone').value = 'Tepeaca';
document.getElementById('delivery-address').value = 'Calle 1 #123';
document.getElementById('delivery-reference').value = 'Próximo al parque';

// Obtén los datos
const data = window.DeliveryForm.getDeliveryData();
console.log(data);

// Valida
const isValid = window.DeliveryForm.validateDeliveryForm();
console.log('¿Válido?', isValid);

// Accede al carrito
console.log('Items en carrito:', window.cartItems);
console.log('Total:', window.Cart.getTotal());
```

---

## 🛑 Validaciones Implementadas

| Campo | Regla | Ejemplo Válido | Inválido |
|-------|-------|---|---|
| **Nombre** | No vacío | "Juan García" | "" |
| **Teléfono** | 10 dígitos | "2221234567" | "123" |
| **Zona** | Una de 5 | "Tepeaca" | "México" |
| **Dirección** | Opcional | "Calle 1 #123" | N/A |
| **Referencia** | Opcional | "Próximo a..." | N/A |
| **Sucursal** | Seleccionada | "tepeaca" | value="" |

---

## 🌍 Localidades Permitidas

1. **Tepeaca**
2. **San Hipólito Xochiltenango**
3. **Candelaria Purificación**
4. **Santa María Oxtotipan**
5. **San Nicolás Zoyapetlayoca**

> Si usuario escribe una zona que no esté en la lista, verá: "No contamos con servicio en tu zona"

---

## 🚨 Manejo de Errores

### Errores de Validación
```
El nombre es obligatorio
El teléfono es obligatorio
El teléfono debe tener 10 dígitos
La localidad es obligatoria
No contamos con servicio en tu zona
Debes seleccionar una sucursal
```

### Errores de Servidor
```
Toast rojo con mensaje del servidor
Botones permanecen habilitados
Usuario puede reintentar
```

---

## 📝 Archivos Modificados

1. **index.html** - Agregados formularios limpios, sin estilos inline
2. **css/main.css** - Agregados ~400px de estilos responsivos
3. **js/delivery-form.js** - Reescrito con integración completa
4. **js/cart.js** - Agregada API pública y exposición de datos

---

## 💡 Flujo Completo Típico

```
Usuario hace clic en "A domicilio"
    ↓
Se muestra formulario de domicilio
    ↓
Usuario completa campos
    ↓
Validación en tiempo real (mientras escribe/blur)
    ↓
Botón "Continuar" se habilita cuando todo es válido
    ↓
Usuario hace clic en "Continuar pedido"
    ↓
Validación final completa
    ↓
Toast: "Guardando pedido..." (loading)
    ↓
POST a /api/orders con datos + items del carrito
    ↓
✅ Éxito: Toast verde "Pedido guardado exitosamente"
❌ Error: Toast rojo con mensaje de error
    ↓
Si éxito: Formularios se limpian, sesión guarda datos
Evento 'order:submitted' se dispara
```

---

## 🔄 Integración con Backend

El endpoint espera:

```bash
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "customerName": "string",
  "customerPhone": "string",
  "orderType": "domicilio" | "para_llevar",
  "paymentMethod": "string",
  "deliveryAddress": "string or null",
  "notes": "string",
  "items": [ { name, qty, unitPrice, total, ... } ],
  "branchId": number | null
}
```

Respuesta esperada (éxito):
```json
{
  "id": 123,
  "orderId": "ORD-123"
}
```

---

## ✨ Ventajas Actuales

✅ **Responsive** - Funciona en todos los tamaños de pantalla
✅ **Accesible** - Labels asociados, inputs con placeholders
✅ **Rápida** - Validación en tiempo real sin delays
✅ **Amigable** - Mensajes claros y toast visuales
✅ **Integrada** - Con carrito y backend automáticamente
✅ **Mantenible** - Código limpio y bien documentado
✅ **Segura** - Validación en cliente y servidor
✅ **Offline-Ready** - Guarda datos en sessionStorage

