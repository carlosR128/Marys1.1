// Configuración automática de backend por entorno
(function() {
    // URLs de backend por entorno
    const BACKEND_URLS = {
        development: 'http://localhost:3000',
        production: 'https://tu-backend-url.com' // ⚠️ CAMBIA ESTA URL POR TU BACKEND REAL
    };

    // Detectar si estamos en producción
    const isProduction = window.location.hostname !== 'localhost' &&
                        !window.location.hostname.includes('127.0.0.1') &&
                        !window.location.hostname.includes('192.168.') &&
                        !window.location.hostname.includes('0.0.0.0');

    // Configurar URL del backend
    window.ABCG_API_BASE = isProduction ? BACKEND_URLS.production : BACKEND_URLS.development;

    console.log('🌐 Backend configurado:', window.ABCG_API_BASE, isProduction ? '(producción)' : '(desarrollo)');
})();