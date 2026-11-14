# 🎬 Catalog-Media-API_REST

API RESTful modular diseñada para la administración y control centralizado de un catálogo de producciones audiovisuales (Películas y Series). El sistema implementa validaciones robustas para garantizar que todos los registros mantengan una relación consistente en la base de datos sin generar registros huérfanos.

Desarrollado para el curso **Proyecto Integrado II - Desarrollo de Aplicaciones Web** en la **Institución Universitaria Digital de Antioquia (IU Digital)**.

---

## 📋 Índice

1. [Descripción General & Propósito](#1-descripción-general--propósito)
2. [Arquitectura del Proyecto (Patrón MVC)](#2-arquitectura-del-proyecto-patrón-mvc)
3. [Reglas de Negocio Críticas](#3-reglas-de-negocio-críticas)
4. [Instalación y Levantamiento Rápido](#4-instalación-y-levantamiento-rápido)
5. [Estructura del Catálogo (Endpoints Simétricos 1 al 5)](#5-estructura-del-catálogo-endpoints-simétricos-1-al-5)
6. [Estructura de Archivos](#6-estructura-de-archivos)
7. [Buenas Prácticas Aplicadas](#7-buenas-prácticas-aplicadas)
8. [Autores y Créditos](#8-autores-y-créditos)
9. [Licencia y Derechos de Autor](#9-licencia-y-derechos-de-autor)

---

## 1. Descripción General & Propósito

Este proyecto resuelve la gestión de contenidos para una plataforma de streaming multimedia. Permite crear, consultar, editar y eliminar películas o series asegurando que cada título esté obligatoriamente vinculado a entidades reales de la plataforma (Directores, Géneros, Productoras y Tipos).

**Lo más importante en 90 segundos:** La API cuenta con un diseño de rutas totalmente simétrico y un controlador centralizado que verifica la existencia de llaves foráneas antes de alterar la base de datos, resolviendo las consultas mediante la función `populate` de Mongoose para entregar objetos enriquecidos.

---

## 2. Arquitectura del Proyecto (Patrón MVC)

El proyecto implementa el patrón **Modelo-Vista-Controlador (MVC)** para separar responsabilidades de forma limpia:

* **`config/`**: Configuración de entorno y conexión con tolerancia a fallos hacia MongoDB Atlas.
* **`models/`**: Esquemas de datos con restricciones nativas de Mongoose.
* **`controllers/`**: Capa lógica encargada de las validaciones lógicas de persistencia.
* **`routes/`**: Rutas de la API y mapeo ordenado de verbos HTTP.
* **`server.js`**: Punto de entrada de la aplicación y configuración de middlewares globales.

> **Nota:** El proyecto usa **ES Modules** (`import`/`export`) en lugar de CommonJS (`require`).

---

## 3. Reglas de Negocio Críticas

El comportamiento del sistema está regido por las siguientes directrices lógicas de datos:

* **Identificación Única:** El `serial` y la `url` de cada producción son únicos. MongoDB restringe los duplicados mediante índices únicos y la API responde `409 Conflict`.
* **Solo Referencias Activas:** Al crear o editar una producción, el Género, Director y Productora deben existir y estar en estado `Activo`. El Tipo solo debe existir (no maneja estado).
* **Sin Registros Huérfanos:** No se puede eliminar un Género, Director, Productora o Tipo que tenga producciones asociadas (`409 Conflict`).
* **Formatos Estrictos:** La URL de reproducción y la portada se validan como URLs `http`/`https`, y el año de estreno no puede ser anterior a 1888 (origen del cine).
* **Varios Géneros:** Una producción ya no tiene un solo género, sino una lista en el campo `generos`. La lista debe tener de 1 a 5 IDs, sin repetidos, y cada género debe existir y estar `Activo`. Si la lista está vacía, pasa de 5, tiene repetidos, un ID no es válido o un género está `Inactivo`, la API responde `400 Bad Request`; si un género no existe, responde `404 Not Found`. El campo antiguo `genero` ya no se acepta y devuelve `400` con un aviso para usar `generos`. Además, no se puede eliminar un género que aparezca en la lista `generos` de alguna producción (`409 Conflict`); en ese caso conviene cambiarlo a `Inactivo` o reasignar las producciones.

---

## 4. Instalación y Levantamiento Rápido

Sigue estos pasos para clonar, configurar e iniciar el proyecto localmente:

### a. Clonar el repositorio

```bash
git clone https://github.com/JorgeAHernandezC80/Catalog-Media-API_REST.git
cd Catalog-Media-API_REST
```

### b. Instalar dependencias esenciales
```bash
npm install
```

### c. Configurar variables de entorno
Copia el archivo `.env.template` y renómbralo a `.env` en la raíz del proyecto (o créelo) con los siguientes parámetros:
```bash
cp .env.template .env
```

```env
# Puerto del servidor
PORT=5000

# Cadena de conexión a MongoDB local
# Si usas MongoDB Atlas, reemplaza esta línea por tu cadena de conexión
MONGODB_URI=mongodb://127.0.0.1:27017/catalog_media_db
```

### d. Cargar los datos iniciales del caso de estudio
Registra los géneros (Acción, Aventura, Ciencia ficción, Drama, Terror) y los tipos (Serie, Película). Se puede ejecutar varias veces sin duplicar datos:
```bash
npm run seed
```

### e. Arrancar el servidor en modo desarrollo
El proyecto utiliza `nodemon` para reiniciarse automáticamente ante cualquier cambio:
```bash
npm run dev
```
Deberías ver:
```
🔌 Conexión exitosa a la base de datos de la IU Digital
🚀 Servidor ejecutándose en el puerto 5000
```
---
## 5. Estructura del Catálogo (Endpoints Simétricos 1 al 5)

La API cuenta con cinco módulos independientes que exponen de forma exacta la misma secuencia estructural de operaciones CRUD:

* **Módulos Base:** `/api/v1/generos`, `/api/v1/directores`, `/api/v1/productoras`, `/api/v1/tipos`
* **Módulo Relacional Central:** `/api/v1/media`

| Secuencia | Acción Realizada | Método HTTP | Endpoint Relativo |
| :--- | :--- | :--- | :--- |
| **1** | Crear un nuevo registro | `POST` | `/` |
| **2** | Obtener el listado completo | `GET` | `/` |
| **3** | Consultar un registro por ID | `GET` | `/:id` |
| **4** | Actualizar un registro por ID | `PUT` | `/:id` |
| **5** | Eliminar un registro por ID | `DELETE` | `/:id` |

**Ejemplo de petición `POST /api/v1/generos`:**
```
json
{
  "nombre": "Comedia",
  "estado": "Activo",
  "descripcion": "Películas con humor"
}
```
Respuesta (201 Created):
```
json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "nombre": "Comedia",
  "estado": "Activo",
  "descripcion": "Películas con humor",
  "createdAt": "2026-11-06T10:00:00.000Z",
  "updatedAt": "2026-11-06T10:00:00.000Z"
}
```

**Ejemplo de petición `POST /api/v1/media` con varios géneros:**

El campo `generos` es una lista con los IDs de 1 a 5 géneros activos, sin repetir. Los demás IDs (`director`, `productora` y `tipo`) siguen siendo un solo valor.
```json
{
  "serial": "PEL-0001",
  "titulo": "Viaje a las estrellas",
  "sinopsis": "Una tripulación explora los límites del universo conocido.",
  "url": "https://catalogo.ejemplo.com/peliculas/viaje-a-las-estrellas",
  "portada": "https://catalogo.ejemplo.com/portadas/viaje-a-las-estrellas.jpg",
  "anoEstreno": 2024,
  "generos": ["<id1>", "<id2>"],
  "director": "<idDirector>",
  "productora": "<idProductora>",
  "tipo": "<idTipo>"
}
```
Respuesta (201 Created): la producción guardada, con `generos` como lista de IDs.

Si se envía el campo antiguo `genero` en vez de `generos`, la respuesta es `400 Bad Request`:
```json
{
  "message": "El campo 'genero' ya no se usa. Ahora se llama 'generos' y debe ser una lista de IDs de género (de 1 a 5)."
}
```

**Filtro por género: `GET /api/v1/media?genero=<id>`**

Devuelve solo las producciones que tienen ese género dentro de su lista `generos`. Los géneros, el director, la productora y el tipo llegan con sus datos básicos gracias a `populate`. Sin el parámetro, la ruta devuelve todo el catálogo, como antes.

Respuesta (200 OK):
```json
[
  {
    "_id": "65f1a2b3c4d5e6f7a8b9c0e1",
    "serial": "PEL-0001",
    "titulo": "Viaje a las estrellas",
    "generos": [
      { "_id": "<id1>", "nombre": "Ciencia ficción", "estado": "Activo" },
      { "_id": "<id2>", "nombre": "Aventura", "estado": "Activo" }
    ],
    "director": { "_id": "<idDirector>", "nombres": "Ana Gómez", "estado": "Activo" },
    "productora": { "_id": "<idProductora>", "nombre": "Estudios Andinos", "eslogan": "Historias que inspiran", "estado": "Activo" },
    "tipo": { "_id": "<idTipo>", "nombre": "Película" }
  }
]
```
Si ninguna producción tiene ese género, la respuesta es `200 OK` con una lista vacía (`[]`). Si el ID no es válido, la respuesta es `400 Bad Request`:
```json
{
  "message": "El parámetro 'genero' debe ser un ID de género válido."
}
```

**Filtro por estado: `GET /api/v1/generos?estado=Activo`**

Devuelve solo los géneros con ese estado. Los valores permitidos son `Activo` e `Inactivo`. Sin el parámetro, la ruta devuelve todos los géneros, como antes.

Respuesta (200 OK):
```json
[
  {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "nombre": "Comedia",
    "estado": "Activo",
    "descripcion": "Películas con humor",
    "createdAt": "2026-11-06T10:00:00.000Z",
    "updatedAt": "2026-11-06T10:00:00.000Z"
  }
]
```
Con cualquier otro valor, por ejemplo `?estado=Pausado`, la respuesta es `400 Bad Request`:
```json
{
  "message": "El parámetro estado no es válido. Valores permitidos: Activo, Inactivo."
}
```
---
## 6. Estructura de Archivos

```
Catalog-Media-API_REST/
├── config/
│   └── db-connection.js
├── controllers/
│   ├── genero.controller.js
│   ├── director.controller.js
│   ├── productora.controller.js
│   ├── tipo.controller.js
│   └── media.controller.js
├── models/
│   ├── genero.model.js
│   ├── director.model.js
│   ├── productora.model.js
│   ├── tipo.model.js
│   └── media.model.js
├── routes/
│   ├── genero.routes.js
│   ├── director.routes.js
│   ├── productora.routes.js
│   ├── tipo.routes.js
│   └── media.routes.js
├── .env.template
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── seed.script.js
└── server.js
```
---
## 7. Buenas Prácticas Aplicadas

* **Nombres de archivos:** kebab-case + sufijo (genero.model.js, genero.controller.js, genero.routes.js).
* **Nombres de carpetas:** minúsculas (config/, controllers/, models/, routes/).
* **Endpoints:** plural, kebab-case, con versión (/api/v1/generos).
* **Variables y funciones:** camelCase (getGeneros, createMedia).
* **Clases y modelos:** PascalCase (Genero, Media).
* **Variables de entorno:** UPPER_SNAKE_CASE (PORT, MONGODB_URI).
* **Módulos:** ES Modules (import/export) en lugar de CommonJS (require).
* **Configuración:** .env excluido de Git, .env.template incluido.
* **Seguridad:** Usuario de base de datos con privilegios mínimos e IP autorizada en Atlas.
---

## 8. Autores y Créditos
* **Desarrollador:** Jorge A. Hernandez C.
* **Docente Evaluador:** Federico Henao
* **Institución:** Institución Universitaria Digital de Antioquia (IU Digital)
* **Curso:** Proyecto Integrado II - Desarrollo de Aplicaciones Web
* **Semestre:** Sexto Semestre - PREICA2602B020099
---

## 9. Licencia y Derechos de Autor

Copyright (c) 2026 Jorge A. Hernández C. Todos los derechos reservados. Este software y su código fuente son propiedad de Jorge A. Hernández C. No se concede ningún permiso para usar, copiar, modificar, fusionar, publish, distribuir, sublicenciar y/o vender copias de este software, ni para permitir que terceros lo hagan, sin el consentimiento previo y por escrito del autor. Todos los derechos no otorgados expresamente quedan reservados. Ver LICENSE.

Copyright (c) 2026 Jorge A. Hernández C. All rights reserved. This software and its source code are the property of Jorge A. Hernández C. No permission is granted to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software, or to permit persons to whom it is furnished to do so, without the prior written consent of the author. All rights not expressly granted are reserved.

---
### Proyectos Académicos y Uso Institucional
Este repositorio fue creado con fines estrictamente educativos y evaluativos para el curso **Proyecto Integrado II - Desarrollo de Aplicaciones Web** de la **Institución Universitaria Digital de Antioquia (IU Digital)**. Queda autorizado el acceso y revisión del material al docente evaluador **Federico Henao** y a los cuerpos directivos institucionales pertinentes.

