// Validador determinista de las reglas de negocio de Catalog-Media-API_REST.
// Lo ejecutan el Inmune (subagente) y la CLI del Organismo como comando de verificación.
//
//   node .claude/organismo/validar-reglas.js                 # estático + datos (requiere MongoDB)
//   node .claude/organismo/validar-reglas.js --solo-estatico # solo código y esquemas
//
// Reglas (README, sección 3):
//   R1 Serial único           — índice único en el esquema y sin duplicados en los datos (también la URL)
//   R2 Referencias activas    — crear/editar valida que Género, Director y Productora estén 'Activo'
//   R3 Sin registros huérfanos — no se elimina un catálogo con producciones asociadas, y ninguna
//                                producción apunta a un documento inexistente
//
// SOLO LECTURA: únicamente find/aggregate/listIndexes. autoIndex y autoCreate están apagados para que
// Mongoose no cree índices ni colecciones al conectar. Para garantizarlo a nivel de servidor, define
// MONGODB_URI_LECTURA con un usuario de rol 'read'.
//
// Salida: JSON en stdout. Código 0 = todo cumple, 1 = alguna regla incumplida, 2 = no verificable.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const soloEstatico = process.argv.includes('--solo-estatico');
const chequeos = [];
const advertencias = [];
const anotar = (regla, nombre, ok, detalle, tipo) => chequeos.push({ regla, nombre, ok: Boolean(ok), detalle, tipo });
const fuente = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

mongoose.set('autoIndex', false);
mongoose.set('autoCreate', false);

const { default: Media } = await import(join(RAIZ, 'models', 'media.model.js'));
const { default: Genero } = await import(join(RAIZ, 'models', 'genero.model.js'));
const { default: Director } = await import(join(RAIZ, 'models', 'director.model.js'));
const { default: Productora } = await import(join(RAIZ, 'models', 'productora.model.js'));
const { default: Tipo } = await import(join(RAIZ, 'models', 'tipo.model.js'));

// --------------------------------------------------------------------------- estático
for (const campo of ['serial', 'url']) {
  const p = Media.schema.path(campo);
  anotar('R1', `esquema: ${campo} único y obligatorio`, p?.options?.unique === true && Boolean(p?.options?.required),
    p ? `unique=${p.options.unique} required=${Boolean(p.options.required)}` : 'el campo no existe', 'estatico');
}

const RELACIONES = [
  { campo: 'genero', modelo: Genero, activo: true },
  { campo: 'director', modelo: Director, activo: true },
  { campo: 'productora', modelo: Productora, activo: true },
  { campo: 'tipo', modelo: Tipo, activo: false },
];
for (const { campo, modelo } of RELACIONES) {
  const p = Media.schema.path(campo);
  anotar('R3', `esquema: media.${campo} es referencia obligatoria a ${modelo.modelName}`,
    p?.options?.ref === modelo.modelName && Boolean(p?.options?.required),
    p ? `ref=${p.options.ref} required=${Boolean(p.options.required)}` : 'el campo no existe', 'estatico');
}

const mediaCtrl = fuente('controllers/media.controller.js');
for (const { campo, activo } of RELACIONES) {
  const rx = new RegExp(`campo:\\s*['"]${campo}['"][^}]*requiereActivo:\\s*${activo}`);
  anotar('R2', `controlador: ${campo} ${activo ? 'exige estado Activo' : 'solo debe existir'}`, rx.test(mediaCtrl),
    rx.test(mediaCtrl) ? 'declarado en RELACIONES' : `no se encontró { campo: '${campo}', requiereActivo: ${activo} }`, 'estatico');
}
for (const fn of ['createMedia', 'actualizarMedia']) {
  const cuerpo = mediaCtrl.split(new RegExp(`export const ${fn}\\b`))[1]?.split(/export const /)[0] ?? '';
  anotar('R2', `controlador: ${fn} valida referencias antes de escribir`,
    /validarReferencias\(/.test(cuerpo) && cuerpo.indexOf('validarReferencias(') < cuerpo.search(/\.save\(|findByIdAndUpdate\(/),
    cuerpo ? 'orden de llamadas revisado' : `no se encontró ${fn}`, 'estatico');
}
anotar('R2', 'controlador: actualizarMedia corre los validadores del esquema',
  /runValidators:\s*true/.test(mediaCtrl), 'findByIdAndUpdate con runValidators', 'estatico');

for (const [archivo, campo, fn] of [
  ['controllers/genero.controller.js', 'genero', 'eliminarGenero'],
  ['controllers/director.controller.js', 'director', 'eliminarDirector'],
  ['controllers/productora.controller.js', 'productora', 'eliminarProductora'],
  ['controllers/tipo.controller.js', 'tipo', 'eliminarTipo'],
]) {
  const src = fuente(archivo);
  const cuerpo = src.split(new RegExp(`export const ${fn}\\b`))[1]?.split(/export const /)[0] ?? '';
  const guarda = new RegExp(`Media\\.(exists|countDocuments|findOne)\\(\\s*\\{\\s*${campo}\\s*:`);
  const ok = guarda.test(cuerpo) && /409/.test(cuerpo)
    && cuerpo.search(guarda) < cuerpo.search(/findByIdAndDelete|deleteOne|findOneAndDelete/);
  anotar('R3', `controlador: ${fn} bloquea si hay producciones asociadas`, ok,
    cuerpo ? (ok ? 'consulta Media antes de borrar y responde 409' : 'falta la guarda o va después del borrado') : `no se encontró ${fn}`, 'estatico');
}

// --------------------------------------------------------------------------- datos
let verificable = true;
if (!soloEstatico) {
  const uri = process.env.MONGODB_URI_LECTURA || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog_media_db';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, autoIndex: false, autoCreate: false });
  } catch (e) {
    verificable = false;
    anotar('BD', 'conexión de solo lectura a MongoDB', false, `No verificable: ${e.message}`, 'datos');
  }
  if (verificable) {
    const indices = await Media.collection.indexes().catch(() => []);
    for (const campo of ['serial', 'url']) {
      const ix = indices.find((i) => i.unique && Object.keys(i.key).length === 1 && i.key[campo] === 1);
      anotar('R1', `BD: índice único sobre media.${campo}`, Boolean(ix), ix ? ix.name : 'sin índice único en la colección', 'datos');
      const dup = await Media.aggregate([
        { $group: { _id: `$${campo}`, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }, { $limit: 10 },
      ]);
      anotar('R1', `BD: sin ${campo} duplicados`, !dup.length,
        dup.length ? `Duplicados: ${dup.map((d) => `${d._id} (×${d.n})`).join(', ')}` : 'ninguno', 'datos');
    }
    for (const { campo, modelo, activo } of RELACIONES) {
      const huerfanos = await Media.aggregate([
        { $lookup: { from: modelo.collection.name, localField: campo, foreignField: '_id', as: 'ref' } },
        { $match: { ref: { $size: 0 } } }, { $project: { serial: 1 } }, { $limit: 10 },
      ]);
      anotar('R3', `BD: ninguna producción con ${campo} inexistente`, !huerfanos.length,
        huerfanos.length ? `Huérfanas: ${huerfanos.map((h) => h.serial).join(', ')}` : 'ninguna', 'datos');
      if (activo) {
        // Desactivar un catálogo con producciones está permitido (no rompe R2, que aplica al crear/editar):
        // se informa como advertencia, no como incumplimiento.
        const inactivas = await Media.aggregate([
          { $lookup: { from: modelo.collection.name, localField: campo, foreignField: '_id', as: 'ref' } },
          { $match: { 'ref.estado': 'Inactivo' } }, { $count: 'n' },
        ]);
        if (inactivas[0]?.n) advertencias.push(`${inactivas[0].n} producción(es) asociadas a un ${campo} hoy Inactivo`);
      }
    }
    await mongoose.disconnect();
  }
}

const aprobados = chequeos.filter((c) => c.ok).length;
const resultado = {
  modo: soloEstatico ? 'solo-estatico' : 'completo',
  verificable,
  acierto: chequeos.length ? Math.round((aprobados / chequeos.length) * 10000) / 10000 : 0,
  aprobados,
  total: chequeos.length,
  incumplidos: chequeos.filter((c) => !c.ok),
  chequeos,
  advertencias,
};
console.log(JSON.stringify(resultado, null, 2));
process.exitCode = !verificable ? 2 : resultado.incumplidos.length ? 1 : 0;
