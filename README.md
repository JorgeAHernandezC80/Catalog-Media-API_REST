# Catalog-Media-API_REST

API REST modular diseñada para la administración y control centralizado de un catálogo de producciones audiovisuales (Películas y Series). El sistema implementa validaciones robustas para garantizar que todos los registros mantengan una relación consistente en la base de datos sin generar registros huérfanos.

Desarrollado para el curso **Proyecto Integrado II - Desarrollo de Aplicaciones Web** en la **Institución Universitaria Digital de Antioquia (IU Digital)**.

---

## 📌 Índice
1. [Descripción General & Propósito](#1-descripción-general--propósito)
2. [Arquitectura del Proyecto (Patrón MVC)](#2-arquitectura-del-proyecto-patrón-mvc)
3. [Reglas de Negocio Críticas](#3-reglas-de-negocio-críticas)
4. [Instalación y Levantamiento Rápido](#4-instalación-y-levantamiento-rápido)
5. [Estructura del Catálogo (Endpoints Simétricos 1 al 5)](#5-estructura-del-catálogo-endpoints-simétricos-1-al-5)
6. [Autores y Créditos](#6-autores-y-créditos)
7. [Licencia y Derechos de Autor](#7-Licencia-y-Derechos-de-Autor)

---

## 1. Descripción General & Propósito
Este proyecto resuelve la gestión de contenidos para una plataforma de streaming multimedia. Permite crear, consultar, editar y eliminar películas o series asegurando que cada título esté obligatoriamente vinculado a entidades reales de la plataforma (Directores, Géneros, Productoras y Tipos).

**Lo más importante en 90 segundos:** La API cuenta con un diseño de rutas totalmente simétrico y un controlador centralizado que verifica la existencia de llaves foráneas antes de alterar la base de datos, resolviendo las consultas mediante la función `populate` de Mongoose para entregar objetos enriquecidos.

---

## 2. Arquitectura del Proyecto (Patrón MVC)
El proyecto implementa el patrón **Modelo-Vista-Controlador (MVC)** para separar responsabilidades de forma limpia:

* **`config/`**: Configuración de entorno y conexión con tolerancia a fallos hacia MongoDB.
* **`models/`**: Esquemas de datos con restricciones nativas de Mongoose.
* **`controllers/`**: Capa lógica encargada de las validaciones lógicas de persistencia.
* **`routes/`**: Rutas de la API y mapeo ordenado de verbos HTTP.
* **`Server.js`**: Punto de entrada de la aplicación y configuración de middlewares globales.

---

## 3. Reglas de Negocio Críticas
El comportamiento del sistema está regido por las siguientes directrices lógicas de datos:

* **Identificación Única:** El campo `serial` funciona como el código de inventario obligatorio de cada obra multimedia. MongoDB restringe los duplicados mediante índices únicos.
* **Integridad de Relaciones:** El controlador de `Media` verifica la existencia física de cada ID de referencia en las colecciones secundarias antes de guardar o actualizar una producción.
* **Formatos Estrictos:** Se aplican expresiones regulares (*Regex*) para validar la legitimidad de las URLs de reproducción y restricciones numéricas que impiden registrar años de estreno anteriores a 1888 (origen del cine).

---

## 4. Instalación y Levantamiento Rápido

Siga estos pasos para clonar, configurar e iniciar el proyecto localmente en su entorno de desarrollo:

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
Cree un archivo llamado `.env` en la raíz del proyecto con los siguientes parámetros:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/catalog_media_db
```

### d. Arrancar el servidor en modo desarrollo
El proyecto utiliza `nodemon` para reiniciarse automáticamente ante cualquier cambio:
```bash
npm run dev
```

---

## 5. Estructura del Catálogo (Endpoints Simétricos 1 al 5)

La API cuenta con cinco módulos independientes que exponen de forma exacta la misma secuencia estructural de operaciones CRUD:
* **Módulos Base:** `/api/generos`, `/api/directores`, `/api/productoras`, `/api/tipos`
* **Módulo Relacional Central:** `/api/media`

```
```
| Secuencia | Acción Realizada              | Método HTTP | Endpoint Relativo |
| :-------- | :---------------------------- | :---------- | :---------------- |
| **1**     | Crear un nuevo registro       | `POST`      | `/`               |
| **2**     | Obtener el listado completo   | `GET`       | `/`               |
| **3**     | Consultar un registro por ID  | `GET`       | `/:id`            |
| **4**     | Actualizar un registro por ID | `PUT`       | `/:id`            |
| **5**     | Eliminar un registro por ID   | `DELETE`    | `/:id`            |
```
```

---

## 6. Autores y Créditos
* **Desarrollador:** Jorge A. Hernandez C.
* **Docente Evaluador:** Federico Henao
* **Institución:** Institución Universitaria Digital de Antioquia (IU Digital)
* **Curso:** Proyecto Integrado II - Desarrollo de Aplicaciones Web
* **Semestre:** Sexto Semestre - PREICA2602B020099
## 7. Licencia y Derechos de Autor

Copyright (c) 2026 Jorge A. Hernández C. Todos los derechos reservados. Este software y su código fuente son propiedad de Jorge A. Hernández C. No se concede ningún permiso para usar, copiar, modificar, fusionar, publish, distribuir, sublicenciar y/o vender copias de este software, ni para permitir que terceros lo hagan, sin el consentimiento previo y por escrito del autor. Todos los derechos no otorgados expresamente quedan reservados. Ver LICENSE.

Copyright (c) 2026 Jorge A. Hernández C. All rights reserved. This software and its source code are the property of Jorge A. Hernández C. No permission is granted to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software, or to permit persons to whom it is furnished to do so, without the prior written consent of the author. All rights not expressly granted are reserved.

---
### Proyectos Académicos y Uso Institucional
Este repositorio fue creado con fines estrictamente educativos y evaluativos para el curso **Proyecto Integrado II - Desarrollo de Aplicaciones Web** de la **Institución Universitaria Digital de Antioquia (IU Digital)**. Queda autorizado el acceso y revisión del material al docente evaluador **Federico Henao** y a los cuerpos directivos institucionales pertinentes.

