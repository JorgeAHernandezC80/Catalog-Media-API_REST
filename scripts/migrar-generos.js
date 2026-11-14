// Migración de datos: pasa cada producción del campo viejo 'genero' (un solo id)
// al campo nuevo 'generos' (una lista de ids). Además reemplaza el género combinado
// 'Acción y Ciencia Ficción' por los dos géneros separados [Acción, Ciencia ficción]
// y, al final, borra el combinado si ya nadie lo usa.
//
// Uso:
//   node scripts/migrar-generos.js             -> simula (solo lee y reporta)
//   node scripts/migrar-generos.js --simular   -> simula (solo lee y reporta)
//   node scripts/migrar-generos.js --ejecutar  -> escribe en la base de datos
//
// Por qué simula por defecto: una migración cambia datos reales. Si alguien corre el
// script sin pensar, lo más seguro es que no pase nada. Para escribir hay que pedirlo
// de forma explícita con --ejecutar.
//
// Si llegan --simular y --ejecutar al mismo tiempo, el script termina con error y no
// se conecta a la base. Preferimos eso a "adivinar" cuál quiso decir la persona,
// porque las dos órdenes se contradicen y un error claro obliga a revisar el comando.
//
// El script se puede ejecutar varias veces sin dañar datos: solo toca producciones que
// todavía tienen 'genero' o que todavía tienen el combinado dentro de 'generos'.

import 'dotenv/config';
import mongoose from 'mongoose';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import Media from '../models/media.model.js';
import Genero from '../models/genero.model.js';

// Nombres que buscamos. Se comparan exactos pero sin distinguir mayúsculas,
// porque en la base pudieron quedar escritos como 'Ciencia Ficción' o 'ciencia ficción'.
const NOMBRE_ACCION = 'Acción';
const NOMBRE_CIENCIA_FICCION = 'Ciencia ficción';
const NOMBRE_COMBINADO = 'Acción y Ciencia Ficción';

// Mismo límite que usa el modelo Media para la lista de géneros.
const MAX_GENEROS = 5;

// Escapa los caracteres especiales para que el nombre se use como texto literal en la
// expresión regular y no como un patrón.
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Filtro de nombre exacto sin distinguir mayúsculas (^ y $ evitan coincidencias parciales).
const filtroNombre = (nombre) => ({ nombre: { $regex: `^${escaparRegex(nombre)}$`, $options: 'i' } });

// Los ObjectId iguales son objetos distintos, por eso los comparamos como texto.
const clave = (id) => String(id);

// Quita repetidos de una lista de ids conservando el primer orden en que aparecen.
const sinRepetidos = (lista) => {
    const vistos = new Set();
    const resultado = [];
    for (const id of lista) {
        if (!vistos.has(clave(id))) {
            vistos.add(clave(id));
            resultado.push(id);
        }
    }
    return resultado;
};

// Busca un género por nombre y avisa si no existe, si hay más de uno con ese nombre
// (no sabríamos cuál usar) o si no está Activo.
const buscarRequisito = async (colGeneros, nombre) => {
    const encontrados = await colGeneros.find(filtroNombre(nombre)).toArray();
    if (encontrados.length === 0) return { error: `No existe el género '${nombre}'` };
    if (encontrados.length > 1) return { error: `Hay ${encontrados.length} géneros llamados '${nombre}' y no se sabe cuál usar` };
    const genero = encontrados[0];
    if (genero.estado !== 'Activo') return { error: `El género '${nombre}' existe pero no está Activo (estado: ${genero.estado})` };
    return { genero };
};

// Hace todo el trabajo. Recibe las colecciones del driver nativo (o dobles de prueba
// con la misma forma) para poder probar la lógica sin una base real.
// Devuelve el código de salida: 0 si todo salió bien y 1 si algo impidió migrar.
export const migrar = async ({ colMedias, colGeneros, simular = true, log = console.log }) => {
    const modo = simular ? 'SIMULACIÓN (no se escribe nada)' : 'EJECUCIÓN (se escribe en la base)';
    log(`== Migración de 'genero' a 'generos' :: modo ${modo} ==`);

    // 1) Requisitos: 'Acción' y 'Ciencia ficción' deben existir y estar Activo.
    //    Se revisa antes de escribir para no dejar la base a medio migrar.
    const accion = await buscarRequisito(colGeneros, NOMBRE_ACCION);
    const cienciaFiccion = await buscarRequisito(colGeneros, NOMBRE_CIENCIA_FICCION);
    const erroresRequisitos = [accion.error, cienciaFiccion.error].filter(Boolean);
    if (erroresRequisitos.length > 0) {
        erroresRequisitos.forEach((e) => log(`ERROR: ${e}`));
        log('No se modificó nada. Corre primero el seed (npm run seed) o activa esos géneros.');
        return 1;
    }
    const idAccion = accion.genero._id;
    const idCienciaFiccion = cienciaFiccion.genero._id;

    // 2) Género combinado. Si no existe, solo se hace la conversión de 'genero' a 'generos'.
    const combinados = await colGeneros.find(filtroNombre(NOMBRE_COMBINADO)).toArray();
    if (combinados.length > 1) {
        log(`ERROR: hay ${combinados.length} géneros llamados '${NOMBRE_COMBINADO}' y no se sabe cuál reemplazar. No se modificó nada.`);
        return 1;
    }
    const combinado = combinados[0] || null;
    log(combinado
        ? `Género combinado '${combinado.nombre}' encontrado (${clave(combinado._id)}); se reemplazará por [${NOMBRE_ACCION}, ${NOMBRE_CIENCIA_FICCION}].`
        : `El género combinado '${NOMBRE_COMBINADO}' no existe; solo se convierte 'genero' en 'generos'.`);

    // 3) Mapa de todos los géneros, para revisar referencias y estados sin consultar uno por uno.
    const todosLosGeneros = await colGeneros.find({}).toArray();
    const generosPorId = new Map(todosLosGeneros.map((g) => [clave(g._id), g]));

    // 4) Producciones a revisar. Usamos el driver nativo (Media.collection) porque
    //    'genero' ya no existe en el esquema y Mongoose lo ignoraría al leer o filtrar.
    //    a) las que todavía tienen el campo viejo 'genero';
    //    b) las que ya tienen 'generos' pero con el combinado adentro (así el script es repetible).
    const conGeneroViejo = await colMedias.find({ genero: { $exists: true } }).toArray();
    const conCombinado = combinado
        ? await colMedias.find({ generos: combinado._id }).toArray()
        : [];
    const porId = new Map();
    for (const media of [...conGeneroViejo, ...conCombinado]) porId.set(clave(media._id), media);
    const pendientes = [...porId.values()];

    // 5) Referencias huérfanas: 'genero' apunta a un género que no existe.
    //    Si hay alguna, paramos sin escribir: no sabemos qué género ponerle y
    //    copiarla a 'generos' solo movería el problema (R3: ninguna referencia huérfana).
    const huerfanas = conGeneroViejo.filter((m) => m.genero == null || !generosPorId.has(clave(m.genero)));
    if (huerfanas.length > 0) {
        log(`ERROR: ${huerfanas.length} producción(es) tienen 'genero' apuntando a un género inexistente:`);
        huerfanas.forEach((m) => log(`  - serial ${m.serial} (genero: ${m.genero})`));
        log('No se modificó nada. Corrige esas producciones y vuelve a correr el script.');
        return 1;
    }

    // 6) Calcula y valida la lista nueva de cada producción ANTES de escribir.
    //    Así, si alguna lista sale mal, no se escribe ninguna y la base queda como estaba.
    const planes = [];
    const invalidas = [];
    for (const media of pendientes) {
        const base = Array.isArray(media.generos) ? [...media.generos] : [];
        const tieneViejo = Object.prototype.hasOwnProperty.call(media, 'genero');
        if (tieneViejo) base.push(media.genero);

        // El combinado se cambia por los dos géneros separados.
        const expandida = [];
        for (const id of base) {
            if (combinado && clave(id) === clave(combinado._id)) expandida.push(idAccion, idCienciaFiccion);
            else expandida.push(id);
        }
        const lista = sinRepetidos(expandida);

        // Las mismas reglas del modelo (1 a 5 sin repetidos) y R2 (géneros existentes y Activo).
        const problemas = [];
        if (lista.length < 1) problemas.push('quedaría sin géneros');
        if (lista.length > MAX_GENEROS) problemas.push(`quedaría con ${lista.length} géneros (máximo ${MAX_GENEROS})`);
        for (const id of lista) {
            const g = generosPorId.get(clave(id));
            if (!g) problemas.push(`el género ${clave(id)} no existe`);
            else if (g.estado !== 'Activo') problemas.push(`el género '${g.nombre}' no está Activo`);
        }
        if (problemas.length > 0) invalidas.push({ media, problemas });
        else planes.push({ media, tieneViejo, lista });
    }
    if (invalidas.length > 0) {
        log(`ERROR: ${invalidas.length} producción(es) quedarían con una lista de géneros inválida:`);
        invalidas.forEach(({ media, problemas }) => log(`  - serial ${media.serial}: ${problemas.join('; ')}`));
        log('No se modificó nada. Corrige esos géneros y vuelve a correr el script.');
        return 1;
    }

    const conversiones = planes.filter((p) => p.tieneViejo).length;
    const correcciones = planes.length - conversiones;
    log(`Producciones a migrar: ${planes.length} (${conversiones} con 'genero' viejo, ${correcciones} con el combinado dentro de 'generos').`);

    // 7) Escritura. En simulación no se hace ningún updateOne.
    let actualizadas = 0;
    const fallidas = [];
    if (!simular) {
        for (const { media, tieneViejo, lista } of planes) {
            // Un único updateOne por producción. El filtro incluye el valor leído
            // ('genero' o 'generos' tal como estaba), así $set y $unset ocurren juntos
            // y de forma atómica, y solo si el documento sigue igual a como lo validamos.
            // Esto cumple "quitar 'genero' solo después de verificar 'generos'": la lista
            // ya se validó arriba y MongoDB nunca deja el documento sin ninguno de los dos.
            const filtro = tieneViejo
                ? { _id: media._id, genero: media.genero }
                : { _id: media._id, genero: { $exists: false }, generos: media.generos };
            const cambio = tieneViejo
                ? { $set: { generos: lista }, $unset: { genero: '' } }
                : { $set: { generos: lista } };
            const resultado = await colMedias.updateOne(filtro, cambio);

            // Verificación posterior: leemos de nuevo y comparamos con lo esperado.
            const despues = await colMedias.findOne({ _id: media._id });
            const quedoBien = resultado.matchedCount === 1
                && despues
                && !Object.prototype.hasOwnProperty.call(despues, 'genero')
                && Array.isArray(despues.generos)
                && despues.generos.map(clave).join(',') === lista.map(clave).join(',');
            if (quedoBien) actualizadas += 1;
            else fallidas.push(media.serial);
        }
    }

    // 8) Borrado del combinado (R3): solo si ninguna producción lo referencia ni en
    //    'generos' ni en 'genero'. Se cuenta otra vez en la base, no se supone.
    let combinadoEliminado = false;
    if (combinado) {
        if (simular) {
            // En simulación no se escribió nada, así que estimamos con el plan: después de
            // migrar, ninguna producción del plan tendría el combinado.
            const enGeneros = await colMedias.countDocuments({ generos: combinado._id });
            const enGenero = await colMedias.countDocuments({ genero: combinado._id });
            log(`El combinado hoy está en ${enGeneros + enGenero} producción(es); tras migrar quedaría sin referencias y se eliminaría.`);
        } else {
            const enGeneros = await colMedias.countDocuments({ generos: combinado._id });
            const enGenero = await colMedias.countDocuments({ genero: combinado._id });
            if (enGeneros + enGenero === 0) {
                const borrado = await colGeneros.deleteOne({ _id: combinado._id });
                combinadoEliminado = borrado.deletedCount === 1;
                log(combinadoEliminado
                    ? `Género combinado '${combinado.nombre}' eliminado.`
                    : `No se pudo eliminar el género combinado '${combinado.nombre}'.`);
            } else {
                log(`El combinado sigue referenciado por ${enGeneros + enGenero} producción(es); no se elimina (R3).`);
            }
        }
    }

    // 9) Resumen final.
    log('== Resumen ==');
    if (simular) {
        log(`Se migrarían ${planes.length} producción(es). Combinado: ${combinado ? 'existe' : 'no existe'}.`);
        log('Requisitos cumplidos. Para aplicar los cambios usa --ejecutar.');
        return 0;
    }
    log(`Producciones actualizadas y verificadas: ${actualizadas} de ${planes.length}.`);
    if (combinado) log(`Combinado eliminado: ${combinadoEliminado ? 'sí' : 'no'}.`);
    if (fallidas.length > 0) {
        log(`ADVERTENCIA: no se pudieron verificar estas producciones (quizá cambiaron mientras corría el script): ${fallidas.join(', ')}. Vuelve a correr el script.`);
        return 1;
    }
    if (combinado && !combinadoEliminado) return 1;
    return 0;
};

// Lee las banderas de la línea de comandos. Rechaza banderas desconocidas para que un
// error de escritura (por ejemplo --ejecuta) no se tome en silencio como otra cosa.
export const leerBanderas = (argumentos) => {
    const conocidas = new Set(['--simular', '--ejecutar']);
    const desconocidas = argumentos.filter((a) => !conocidas.has(a));
    if (desconocidas.length > 0) return { error: `Bandera(s) desconocida(s): ${desconocidas.join(', ')}. Usa --simular o --ejecutar.` };
    const pideSimular = argumentos.includes('--simular');
    const pideEjecutar = argumentos.includes('--ejecutar');
    if (pideSimular && pideEjecutar) return { error: 'No se puede usar --simular y --ejecutar al mismo tiempo. Elige una sola.' };
    // Sin banderas se simula: solo --ejecutar habilita la escritura.
    return { simular: !pideEjecutar };
};

const principal = async () => {
    const banderas = leerBanderas(process.argv.slice(2));
    if (banderas.error) {
        // Se termina antes de conectarse: no hace falta tocar la base para un comando mal escrito.
        console.error(`ERROR: ${banderas.error}`);
        process.exitCode = 1;
        return;
    }
    const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog_media_db';
    try {
        await mongoose.connect(dbURI);
        process.exitCode = await migrar({
            colMedias: Media.collection,
            colGeneros: Genero.collection,
            simular: banderas.simular
        });
    } catch (error) {
        console.error('Error durante la migración de géneros:', error.message);
        process.exitCode = 1;
    } finally {
        // Siempre cerramos la conexión, salga bien o mal, para que el proceso termine.
        await mongoose.disconnect();
    }
};

// Solo se ejecuta cuando se llama directo con node. Si otro archivo lo importa
// (por ejemplo, una prueba), no se conecta a la base.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    principal();
}
