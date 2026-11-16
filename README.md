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
* **Solo Referencias Activas:** Al crear o editar una producción, los Géneros, los Directores y las Productoras deben existir y estar en estado `Activo`. El Tipo solo debe existir (no maneja estado).
* **Sin Registros Huérfanos:** No se puede eliminar un Género, Director, Productora o Tipo que tenga producciones asociadas (`409 Conflict`).
* **Formatos Estrictos:** La URL de reproducción y la portada se validan como URLs `http`/`https`, y el año de estreno no puede ser anterior a 1888 (origen del cine).
* **Varios Géneros:** Una producción ya no tiene un solo género, sino una lista en el campo `generos`. La lista debe tener de 1 a 5 IDs, sin repetidos, y cada género debe existir y estar `Activo`. Si la lista está vacía, pasa de 5, tiene repetidos, un ID no es válido o un género está `Inactivo`, la API responde `400 Bad Request`; si un género no existe, responde `404 Not Found`. El campo antiguo `genero` ya no se acepta y devuelve `400` con un aviso para usar `generos`. Además, no se puede eliminar un género que aparezca en la lista `generos` de alguna producción (`409 Conflict`); en ese caso conviene cambiarlo a `Inactivo` o reasignar las producciones.
* **Varios Directores:** Una película la pueden dirigir uno o más directores, así que una producción lleva una lista en el campo `directores`, con las mismas reglas que `generos` y `productoras`: de 1 a 5 IDs, sin repetidos, y cada director debe existir y estar `Activo` (`400` si la lista es inválida o un director está `Inactivo`, `404` si no existe). El campo antiguo `director` ya no se acepta y devuelve `400` con un aviso para usar `directores`. No se puede eliminar un director que aparezca en la lista `directores` de alguna producción (`409 Conflict`).
* **Varias Productoras:** Una película la pueden hacer una o más productoras, así que una producción lleva una lista en el campo `productoras`, con las mismas reglas que `generos`: de 1 a 5 IDs, sin repetidos, y cada productora debe existir y estar `Activo`. Una lista vacía, con más de 5, con repetidos, con un ID inválido o con una productora `Inactivo` responde `400 Bad Request`; si una productora no existe, responde `404 Not Found`. El campo antiguo `productora` ya no se acepta y devuelve `400` con un aviso para usar `productoras`. No se puede eliminar una productora que aparezca en la lista `productoras` de alguna producción (`409 Conflict`).

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

### e. Migrar datos guardados con el formato anterior (solo si ya tenías producciones)
Si la base ya tiene producciones con el campo antiguo `productora` (un solo ID), pásalas a la lista `productoras`. Primero simula (no escribe nada) y luego ejecuta:
```bash
npm run migrar:productoras                         # simula
node scripts/migrar-productoras.js --ejecutar      # escribe en la base
```
El script se puede repetir sin dañar datos: solo toca las producciones que todavía tienen `productora`.

Con el campo `director` (un solo ID) se hace igual, con `npm run migrar:directores` y `node scripts/migrar-directores.js --ejecutar`.

### g. Arrancar el servidor en modo desarrollo
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

**Ejemplo de petición `POST /api/v1/media` con varios géneros, directores y productoras:**

Los campos `generos`, `directores` y `productoras` son listas con los IDs de 1 a 5 registros activos, sin repetir. El ID de `tipo` sigue siendo un solo valor.
```json
{
  "serial": "PEL-0001",
  "titulo": "Viaje a las estrellas",
  "sinopsis": "Una tripulación explora los límites del universo conocido.",
  "url": "https://catalogo.ejemplo.com/peliculas/viaje-a-las-estrellas",
  "portada": "https://catalogo.ejemplo.com/portadas/viaje-a-las-estrellas.jpg",
  "anoEstreno": 2024,
  "generos": ["<id1>", "<id2>"],
  "directores": ["<idDirector1>", "<idDirector2>"],
  "productoras": ["<idProductora1>", "<idProductora2>"],
  "tipo": "<idTipo>"
}
```
Respuesta (201 Created): la producción guardada, con `generos` y `productoras` como listas de IDs.

Si se envía el campo antiguo `genero` en vez de `generos` (o `productora` en vez de `productoras`), la respuesta es `400 Bad Request`:
```json
{
  "message": "El campo 'genero' ya no se usa. Ahora se llama 'generos' y debe ser una lista de IDs de género (de 1 a 5)."
}
```

**Filtro por género: `GET /api/v1/media?genero=<id>`**

Devuelve solo las producciones que tienen ese género dentro de su lista `generos`. Los géneros, los directores, las productoras y el tipo llegan con sus datos básicos gracias a `populate`. Sin el parámetro, la ruta devuelve todo el catálogo, como antes.

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
    "directores": [
      { "_id": "<idDirector1>", "nombres": "Ana Gómez", "estado": "Activo" },
      { "_id": "<idDirector2>", "nombres": "Luis Pérez", "estado": "Activo" }
    ],
    "productoras": [
      { "_id": "<idProductora1>", "nombre": "Estudios Andinos", "eslogan": "Historias que inspiran", "estado": "Activo" },
      { "_id": "<idProductora2>", "nombre": "Cine del Sur", "eslogan": "Cine con raíces", "estado": "Activo" }
    ],
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
├── postman/
│   └── catalog-media.json
├── scripts/
│   ├── migrar-generos.js
│   ├── migrar-productoras.js
│   └── migrar-directores.js
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

