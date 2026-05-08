# 🚀 Guía de Despliegue - Pizzería ABCG

## Problema de HTTPS y Geolocalización

### ❌ ¿Por qué pide permisos para "acceder a otras aplicaciones"?

Cuando subes tu sitio web a un servidor de producción, los navegadores modernos requieren **HTTPS** para usar ciertas APIs como la geolocalización. Si tu sitio está en HTTP, el navegador bloquea estas funcionalidades por seguridad.

### ✅ Solución: Configurar HTTPS

#### Opción 1: Usar servicios gratuitos con HTTPS automático

**Netlify (Recomendado para principiantes):**
1. Ve a [netlify.com](https://netlify.com)
2. Regístrate gratis
3. Arrastra tu carpeta del proyecto
4. ¡Listo! HTTPS automático incluido

**Vercel:**
1. Ve a [vercel.com](https://vercel.com)
2. Regístrate gratis
3. Conecta tu repositorio de GitHub
4. Despliegue automático con HTTPS

**GitHub Pages:**
1. Sube tu código a un repositorio de GitHub
2. Ve a Settings → Pages
3. Selecciona la rama y carpeta
4. HTTPS automático

#### Opción 2: Configurar HTTPS manualmente

Si usas un servidor propio (Apache, Nginx, etc.):

**Con Let's Encrypt (Gratis):**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-apache  # Ubuntu/Debian
sudo yum install certbot python-certbot-apache  # CentOS/RHEL

# Obtener certificado
sudo certbot --apache -d tu-dominio.com
```

**Configuración manual:**
- Compra un certificado SSL en Namecheap, GoDaddy, etc.
- Configura tu servidor web para usar HTTPS

### 🔧 Verificación

Después de configurar HTTPS:
1. Tu URL debería ser `https://tu-dominio.com`
2. Deberías ver un candado verde en la barra de direcciones
3. La geolocalización debería funcionar sin problemas

### 📱 Mensajes de error mejorados

El código ahora muestra mensajes específicos según el problema:

- **"Para usar la geolocalización, el sitio debe estar en HTTPS"** → Configura SSL
- **"Permiso de ubicación denegado"** → Usuario debe permitir en el navegador
- **"Ubicación no disponible"** → GPS deshabilitado en el dispositivo

### 🚨 Importante

- **Nunca uses HTTP en producción** para sitios con geolocalización
- **HTTPS es obligatorio** para APIs modernas del navegador
- **Los servicios gratuitos** como Netlify/Vercel manejan esto automáticamente

¿Necesitas ayuda configurando alguno de estos servicios?</content>
<parameter name="filePath">c:\Users\cr792\OneDrive\Documents\Escritorio\Pizzeria ABCG\GUIA_HTTPS_DESPLIEGUE.md