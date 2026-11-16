// Migración de datos: pasa cada producción del campo viejo 'productora' (un solo id)
// al campo nuevo 'productoras' (una lista de ids).
//
// Uso:
//   node scripts/migrar-productoras.js             -> simula (solo lee y reporta)
//   node scripts/migrar-productoras.js --simular   -> simula (solo lee y reporta)
//   node scripts/migrar-productoras.js --ejecutar  -> escribe en la base de datos
//
// Simula por defecto: una migración cambia datos reales, así que solo se escribe
// cuando se pide de forma explícita con --ejecutar. Es repetible: solo toca las
// producciones que todavía tienen el campo viejo 'productora'.

import 'dotenv/config';
import mongoose from 'mongoose';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import Media from '../models/media.model.js';
import Productora from '../models/productora.model.js';

// Los ObjectId iguales son objetos distintos, por eso los comparamos como texto.
const clave = (id) => String(id);

// Devuelve el código de salida: 0 si todo salió bien y 1 si algo impidió migrar.
export const migrar = async ({ colMedias, colProductoras, simular = true, log = console.log }) => {
    const modo = simular ? 'SIMULACIÓN (no se escribe nada)' : 'EJECUCIÓN (se escribe en la base)';
    log(`== Migración de 'productora' a 'productoras' :: modo ${modo} ==`);

    // Usamos el driver nativo (Media.collection) porque 'productora' ya no existe en el
    // esquema y Mongoose lo ignoraría al leer o filtrar.
    const pendientes = await colMedias.find({ productora: { $exists: true } }).toArray();
    const productoras = await colProductoras.find({}).toArray();
    const porId = new Map(productoras.map((p) => [clave(p._id), p]));

    // Referencias huérfanas: 'productora' apunta a una productora que no existe.
    // Si hay alguna se para sin escribir, para no copiar el problema al campo nuevo.
    const huerfanas = pendientes.filter((m) => m.productora == null || !porId.has(clave(m.productora)));
    if (huerfanas.length > 0) {
        log(`ERROR: ${huerfanas.length} producción(es) tienen 'productora' apuntando a una productora inexistente:`);
        huerfanas.forEach((m) => log(`  - serial ${m.serial} (productora: ${m.productora})`));
        log('No se modificó nada. Corrige esas producciones y vuelve a correr el script.');
        return 1;
    }

    log(`Producciones a migrar: ${pendientes.length}.`);
    if (simular) {
        log('== Resumen ==');
        log(`Se migrarían ${pendientes.length} producción(es). Para aplicar los cambios usa --ejecutar.`);
        return 0;
    }

    let actualizadas = 0;
    const fallidas = [];
    for (const media of pendientes) {
        // Un único updateOne: $set y $unset ocurren juntos y solo si el documento sigue
        // igual a como lo leímos, así nunca queda sin ninguno de los dos campos.
        const resultado = await colMedias.updateOne(
            { _id: media._id, productora: media.productora },
            { $set: { productoras: [media.productora] }, $unset: { productora: '' } }
        );
        // Verificación posterior: leemos de nuevo y comparamos con lo esperado.
        const despues = await colMedias.findOne({ _id: media._id });
        const quedoBien = resultado.matchedCount === 1
            && despues
            && !Object.prototype.hasOwnProperty.call(despues, 'productora')
            && Array.isArray(despues.productoras)
            && despues.productoras.map(clave).join(',') === clave(media.productora);
        if (quedoBien) actualizadas += 1;
        else fallidas.push(media.serial);
    }

    log('== Resumen ==');
    log(`Producciones actualizadas y verificadas: ${actualizadas} de ${pendientes.length}.`);
    if (fallidas.length > 0) {
        log(`ADVERTENCIA: no se pudieron verificar estas producciones: ${fallidas.join(', ')}. Vuelve a correr el script.`);
        return 1;
    }
    return 0;
};

// Rechaza banderas desconocidas para que un error de escritura (por ejemplo --ejecuta)
// no se tome en silencio como otra cosa.
export const leerBanderas = (argumentos) => {
    const conocidas = new Set(['--simular', '--ejecutar']);
    const desconocidas = argumentos.filter((a) => !conocidas.has(a));
    if (desconocidas.length > 0) return { error: `Bandera(s) desconocida(s): ${desconocidas.join(', ')}. Usa --simular o --ejecutar.` };
    const pideSimular = argumentos.includes('--simular');
    const pideEjecutar = argumentos.includes('--ejecutar');
    if (pideSimular && pideEjecutar) return { error: 'No se puede usar --simular y --ejecutar al mismo tiempo. Elige una sola.' };
    return { simular: !pideEjecutar };
};

const principal = async () => {
    const banderas = leerBanderas(process.argv.slice(2));
    if (banderas.error) {
        console.error(`ERROR: ${banderas.error}`);
        process.exitCode = 1;
        return;
    }
    const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog_media_db';
    try {
        await mongoose.connect(dbURI);
        process.exitCode = await migrar({
            colMedias: Media.collection,
            colProductoras: Productora.collection,
            simular: banderas.simular
        });
    } catch (error) {
        console.error('Error durante la migración de productoras:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

// Solo se ejecuta cuando se llama directo con node, no cuando otro archivo lo importa.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    principal();
}