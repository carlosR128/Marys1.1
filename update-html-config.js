#!/usr/bin/env node

/**
 * Script para actualizar todas las páginas HTML con la configuración del backend
 * Uso: node update-html-config.js
 */

const fs = require('fs');
const path = require('path');

// Lista de archivos HTML a actualizar
const htmlFiles = [
    'index.html',
    'pizzas.html',
    'ubicacion.html',
    'bebidas.html',
    'pastas.html',
    'alitas_y_cryspy.html',
    'calzones.html',
    'ensaladas.html',
    'hamburguesas.html',
    'hotdog.html',
    'promos.html',
    'postres.html',
    'snacks.html'
];

console.log('🔧 Actualizando configuración del backend en páginas HTML...\n');

htmlFiles.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verificar si ya tiene la configuración
        if (content.includes('js/config.js')) {
            console.log(`✅ ${fileName} - Ya tiene configuración`);
            return;
        }

        // Buscar donde insertar el script de configuración
        // Después de los estilos CSS y antes de Google Maps API o el primer script
        const insertPattern = /<\/head>/i;
        const configScript = '    <!-- Configuración automática del backend -->\n    <script src="js/config.js"></script>\n\n';

        if (insertPattern.test(content)) {
            content = content.replace(insertPattern, configScript + '</head>');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${fileName} - Configuración agregada`);
        } else {
            console.log(`❌ ${fileName} - No se pudo encontrar </head>`);
        }

    } catch (error) {
        console.log(`❌ ${fileName} - Error: ${error.message}`);
    }
});

console.log('\n🎉 ¡Actualización completada!');
console.log('\n📝 Recuerda:');
console.log('1. Edita js/config.js y cambia la URL de producción');
console.log('2. Despliega el backend en Railway/Render/VPS');
console.log('3. Actualiza la URL en js/config.js');
console.log('4. Sube los cambios a producción');