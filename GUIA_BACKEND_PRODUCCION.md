# 🚀 Guía Completa de Despliegue - Backend + Frontend

## ❌ Problema: "Fail fetch" en producción

Cuando subes el sitio a producción, el frontend intenta hacer `fetch` a `http://localhost:3000`, pero ese backend no existe en el servidor remoto.

## ✅ Solución: Configurar backend en producción

### Opción 1: Railway (Recomendado - Fácil)

**Railway** es perfecto para Node.js + PostgreSQL:

1. **Crear cuenta gratuita:** [railway.app](https://railway.app)

2. **Conectar GitHub:**
   - Ve a "New Project" → "Deploy from GitHub repo"
   - Selecciona tu repositorio
   - Railway detecta automáticamente Node.js

3. **Configurar variables de entorno:**
   - Ve a "Variables" en tu proyecto
   - Agrega estas variables:
   ```
   PGHOST=containers-us-west-1.railway.app
   PGPORT=XXXX
   PGDATABASE=railway
   PGUSER=postgres
   PGPASSWORD=tu_password_generado
   PORT=3000
   ```

4. **Configurar PostgreSQL:**
   - Railway crea automáticamente la base de datos
   - Las credenciales aparecen en "Variables"

5. **Crear tablas:**
   - Ve a "Query" en la pestaña de PostgreSQL
   - Ejecuta el contenido de `backend/db/schema.sql`

6. **Obtener URL del backend:**
   - Ve a "Settings" → "Domains"
   - Copia la URL (ej: `https://tu-proyecto.up.railway.app`)

### Opción 2: Render (También fácil)

1. **Crear cuenta:** [render.com](https://render.com)

2. **Crear Web Service:**
   - "New" → "Web Service"
   - Conecta tu repo de GitHub
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`

3. **Crear PostgreSQL:**
   - "New" → "PostgreSQL"
   - Conecta a tu web service

4. **Variables de entorno:**
   - Misma configuración que Railway

### Opción 3: VPS propio (Avanzado)

Si tienes un servidor VPS:

```bash
# 1. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# 3. Configurar PostgreSQL
sudo -u postgres createdb pizzeriaabcg
sudo -u postgres psql -c "CREATE USER pizzeria_user WITH PASSWORD 'tu_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pizzeriaabcg TO pizzeria_user;"

# 4. Subir archivos y instalar dependencias
cd /var/www/pizzeria
npm install

# 5. Configurar PM2 para mantener el servidor corriendo
npm install -g pm2
pm2 start server.js --name pizzeria-backend
pm2 startup
pm2 save

# 6. Configurar Nginx como proxy reverso
sudo apt install nginx
# Configurar sitio en /etc/nginx/sites-available/pizzeria
```

## 🔧 Configurar Frontend para Producción

### Paso 1: Actualizar URL del backend

En tu HTML (index.html, pizzas.html, etc.), agrega esta línea **antes** de cargar los scripts:

```html
<!-- Configurar URL del backend para producción -->
<script>
    window.ABCG_API_BASE = 'https://tu-backend-url.com';
</script>

<!-- Luego cargar los scripts -->
<script src="js/location-service.js" defer></script>
<script src="js/maps-service.js" defer></script>
<script src="js/delivery-form.js" defer></script>
<script src="js/cart.js" defer></script>
```

### Paso 2: Actualizar todas las páginas HTML

Necesitas agregar esa configuración en **todas** las páginas que usen el backend:
- `index.html`
- `pizzas.html`
- `bebidas.html`
- `pastas.html`
- `alitas_y_cryspy.html`
- `calzones.html`
- `ensaladas.html`
- `hamburguesas.html`
- `hotdog.html`
- `postres.html`
- `snacks.html`
- `promos.html`
- `ubicacion.html`

### Opción automática: Script de configuración

Crea un archivo `js/config.js`:

```javascript
// Configuración de producción
(function() {
    // URLs de backend por entorno
    const BACKEND_URLS = {
        development: 'http://localhost:3000',
        production: 'https://tu-backend-url.com'
    };

    // Detectar entorno
    const isProduction = window.location.hostname !== 'localhost' &&
                        !window.location.hostname.includes('127.0.0.1') &&
                        !window.location.hostname.includes('192.168.');

    // Configurar URL del backend
    window.ABCG_API_BASE = isProduction ? BACKEND_URLS.production : BACKEND_URLS.development;

    console.log('🌐 Backend URL configurada:', window.ABCG_API_BASE);
})();
```

Luego inclúyelo en todas las páginas:

```html
<script src="js/config.js"></script>
<script src="js/location-service.js" defer></script>
<!-- ... otros scripts -->
```

## 🗄️ Configurar Base de Datos

### Crear tablas en PostgreSQL

Conecta a tu base de datos PostgreSQL y ejecuta:

```sql
-- Crear tabla de sucursales
CREATE TABLE IF NOT EXISTS sucursales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    sucursal_id INTEGER REFERENCES sucursales(id),
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20) NOT NULL,
    cliente_email VARCHAR(100),
    tipo_entrega VARCHAR(20) NOT NULL, -- 'domicilio' o 'sucursal'
    direccion_entrega TEXT,
    referencia_entrega TEXT,
    productos JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar sucursales requeridas
INSERT INTO sucursales (nombre, direccion, telefono, email) VALUES
('San Hipolito', 'San Hipolito', '222-000-0001', 'sanhipolito@pizzeriaabcg.local'),
('9 Oriente', '9 Oriente', '222-000-0002', '9oriente@pizzeriaabcg.local')
ON CONFLICT (nombre) DO NOTHING;
```

## 🔍 Verificar funcionamiento

### 1. Probar backend
```bash
# Si tienes el backend local
curl https://tu-backend-url.com/api/branches

# Debería devolver las sucursales en JSON
```

### 2. Probar frontend
- Abre el sitio en producción
- Intenta hacer un pedido
- Revisa la consola del navegador (F12) para errores

### 3. Verificar CORS
Si hay errores de CORS, agrega al backend:
```javascript
app.use(cors({
    origin: ['https://tu-frontend-url.com', 'http://localhost:3000'],
    credentials: true
}));
```

## 🚨 Errores comunes

### "Failed to fetch"
- Backend no está corriendo
- URL del backend incorrecta
- Problemas de CORS

### "Network Error"
- Backend caído
- Problemas de conectividad
- Firewall bloqueando puertos

### "CORS error"
- Backend no permite requests desde el frontend
- URLs no configuradas correctamente

## 📞 ¿Necesitas ayuda?

Si tienes problemas con algún paso específico, dime cuál y te ayudo a resolverlo.

¿Quieres que configure Railway para ti o prefieres otra opción?</content>
<parameter name="filePath">c:\Users\cr792\OneDrive\Documents\Escritorio\Pizzeria ABCG\GUIA_BACKEND_PRODUCCION.md