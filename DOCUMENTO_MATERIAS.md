# Documento de Materias en el Proyecto Pizzeria ABCG

## Introducción
Este proyecto consta de dos aplicaciones principales que comparten una base de datos PostgreSQL:
1. **Sitio web público**: Frontend estático (HTML/CSS/JS) con backend Node.js/Express para pedidos online.
2. **Sistema administrativo**: Frontend React/Vite con backend Node.js/Sequelize para gestión del restaurante.

A continuación, se explica cómo se aplican las materias de Ingeniería de Software, Programación Web, Redes de Computadoras y Base de Datos en el proyecto.

## Ingeniería de Software
Esta materia se enfoca en el diseño, desarrollo y mantenimiento de software de calidad. En el proyecto se aplica en:

### Arquitectura del Sistema
- **Separación de responsabilidades**: El frontend maneja la interfaz de usuario, el backend la lógica de negocio y la base de datos el almacenamiento persistente.
- **Patrones de diseño**: Uso de MVC (Model-View-Controller) en el backend administrativo, y patrón de módulos en JavaScript.
- **Capa de servicios**: Los archivos `services/` encapsulan la lógica de comunicación con APIs.

### Ciclo de Vida del Software
- **Análisis de requisitos**: El sistema maneja pedidos, inventario, empleados y clientes según necesidades del restaurante.
- **Diseño modular**: Código dividido en módulos reutilizables (carrito, autenticación, pedidos).
- **Testing y validación**: Validaciones en frontend y backend para asegurar integridad de datos.
- **Mantenimiento**: Código comentado y estructurado para facilitar futuras modificaciones.

### Calidad del Software
- **Documentación**: Comentarios en código explicando funcionalidad.
- **Gestión de errores**: Manejo de excepciones en backend y frontend.
- **Escalabilidad**: Arquitectura que permite agregar nuevas funcionalidades sin romper existentes.

## Programación Web
Esta materia cubre el desarrollo de aplicaciones web. Se aplica en:

### Tecnologías Frontend
- **HTML**: Estructura de páginas web (index.html, pizzas.html, etc.).
- **CSS**: Estilos y diseño responsivo (main.css, styles.css).
- **JavaScript**: Interactividad del sitio (cart.js, menu-tabs.js, mobile-menu.js).
- **Frameworks**: React con Vite para el sistema administrativo, proporcionando componentes reutilizables y estado gestionado.

### Tecnologías Backend
- **Node.js**: Runtime de JavaScript para servidor.
- **Express.js**: Framework web para crear APIs RESTful.
- **Sequelize**: ORM para interactuar con la base de datos de manera orientada a objetos.

### Desarrollo Web Moderno
- **APIs REST**: Endpoints para login, pedidos, sucursales, etc.
- **WebSockets**: Comunicación en tiempo real para cocina (KDS).
- **SPA (Single Page Application)**: El sistema administrativo es una SPA con React Router.
- **Responsive Design**: Sitio web adaptable a móviles y desktop.

## Redes de Computadoras
Esta materia trata sobre la comunicación entre sistemas. En el proyecto se aplica en:

### Comunicación Cliente-Servidor
- **Protocolo HTTP/HTTPS**: Todas las comunicaciones entre frontend y backend usan HTTP para APIs REST.
- **WebSockets**: Para comunicación bidireccional en tiempo real (notificaciones de pedidos a cocina).
- **CORS (Cross-Origin Resource Sharing)**: Configurado en backend para permitir requests desde diferentes orígenes.

### Arquitectura de Red
- **Cliente-Servidor**: Frontend (cliente) solicita datos al backend (servidor).
- **APIs**: Interfaces de programación que permiten comunicación estandarizada.
- **Sockets**: Conexiones persistentes para actualizaciones en vivo.

### Seguridad en Red
- **Autenticación JWT**: Tokens para verificar identidad de usuarios.
- **Encriptación**: Contraseñas hasheadas con bcrypt.
- **Validación de datos**: Prevención de ataques como SQL injection mediante prepared statements.

## Base de Datos
Esta materia cubre el diseño y gestión de bases de datos. Se aplica en:

### Diseño de Base de Datos
- **Modelo Relacional**: Tablas para sucursales, empleados, usuarios, pedidos, etc., con relaciones (foreign keys).
- **Normalización**: Datos organizados para evitar redundancia (ej: clientes separados de pedidos).
- **Esquemas**: Definición de tablas en `schema.sql` con constraints y tipos de datos apropiados.

### Tecnologías de BD
- **PostgreSQL**: Sistema de gestión de base de datos relacional.
- **Sequelize**: ORM que mapea objetos JavaScript a tablas SQL.
- **Consultas SQL**: Inserciones, actualizaciones y consultas para pedidos, usuarios, etc.

### Gestión de Datos
- **Transacciones**: Operaciones atómicas para pedidos (BEGIN/COMMIT/ROLLBACK).
- **Índices**: Para optimizar consultas (ej: por fecha, sucursal).
- **Integridad referencial**: Foreign keys aseguran consistencia de datos.

### Funcionalidades Avanzadas
- **Triggers y procedimientos**: Para automatizar procesos (ej: actualizar inventario).
- **Auditoría**: Logs de operaciones para seguimiento.
- **Backup y recuperación**: Estructura preparada para respaldos.

## Conclusión
Este proyecto integra las cuatro materias de manera coherente, creando un sistema completo de gestión de restaurante. La Ingeniería de Software proporciona la estructura y calidad, la Programación Web las tecnologías de desarrollo, las Redes de Computadoras la comunicación, y la Base de Datos el almacenamiento y gestión de información.</content>
<parameter name="filePath">c:\Users\cr792\OneDrive\Documents\Escritorio\Pizzeria ABCG\DOCUMENTO_MATERIAS.md