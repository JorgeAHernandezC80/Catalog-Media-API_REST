// se implementa el CRUD de géneros, con integridad referencial para no eliminar géneros que estén en uso por producciones

// 1. Importamos los modelos con los que vamos a trabajar, en este caso el modelo de Género y el modelo de Media (producciones)
import Genero from '../models/genero.model.js';
import Media from '../models/media.model.js';
// Types nos da ObjectId para convertir el ID antes de consultar el campo antiguo 'genero'
import { Types } from 'mongoose';

// 1. CREAR un nuevo género
export const crearGenero = async (req, res) => {
    try {
        const nuevoGenero = new Genero(req.body);
        await nuevoGenero.save();
        res.status(201).json(nuevoGenero);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Valores permitidos para filtrar por estado. Los tomamos del enum del esquema
// para no repetirlos aquí: si el modelo cambia, el filtro se actualiza solo.
const ESTADOS_PERMITIDOS = Genero.schema.path('estado').enumValues;

// 2. OBTENER todos los géneros (con filtro opcional por estado: ?estado=Activo)
export const obtenerGeneros = async (req, res) => {
    try {
        const { estado } = req.query;
        const filtro = {};

        // Solo filtramos si el cliente envió el parámetro. Sin él, se devuelven
        // todos los géneros, igual que antes, para no romper a quien ya usa la ruta.
        if (estado !== undefined) {
            // Validamos antes de consultar: un valor fuera del enum nunca daría
            // resultados y es mejor avisar con 400 que devolver una lista vacía.
            // También revisamos que sea texto, porque la query podría traer un arreglo.
            if (typeof estado !== 'string' || !ESTADOS_PERMITIDOS.includes(estado)) {
                return res.status(400).json({
                    message: `El parámetro estado no es válido. Valores permitidos: ${ESTADOS_PERMITIDOS.join(', ')}.`
                });
            }
            filtro.estado = estado;
        }

        const generos = await Genero.find(filtro);
        res.status(200).json(generos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. OBTENER un género por ID
export const obtenerGeneroPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const genero = await Genero.findById(id);
        if (!genero) {
            return res.status(404).json({ message: 'No se encontró el género con ese ID' });
        }
        res.status(200).json(genero);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 4. ACTUALIZAR un género por ID
export const actualizarGenero = async (req, res) => {
    try {
        const { id } = req.params;
        const generoActualizado = await Genero.findByIdAndUpdate(id, req.body, { 
            returnDocument: 'after',
            runValidators: true 
        });
        if (!generoActualizado) {
            return res.status(404).json({ message: 'No se encontró el género para actualizar' });
        }
        res.status(200).json(generoActualizado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 5. ELIMINAR un género por ID
export const eliminarGenero = async (req, res) => {
    try {
        const { id } = req.params;

        // Revisamos el ID antes de consultar. Lo necesitamos convertido a ObjectId
        // para la guarda de transición de abajo, y si no es válido es mejor avisar con 400.
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'El ID del género no es válido' });
        }
        const idObjeto = new Types.ObjectId(id);

        // Integridad referencial (R3): no se elimina si hay producciones que lo usan.
        // Primera guarda: busca el género en la lista nueva 'generos'.
        // Segunda guarda: es una guarda de transición hasta la migración de P9.
        // Algunas producciones viejas todavía guardan su género en el campo antiguo
        // 'genero' (uno solo). Cuando P9 migre los datos, esta segunda guarda se puede quitar.
        // Como el esquema ya no declara 'genero':
        // - forzamos strictQuery: false, para que Mongoose no quite ese filtro y la
        //   consulta nunca quede vacía (eso encontraría cualquier producción);
        // - pasamos el ID ya convertido a ObjectId, porque Mongoose no convierte los
        //   campos que no están en el esquema y un texto no coincidiría con el dato guardado.
        const enUso = await Media.exists({ generos: id })
            || await Media.exists({ genero: idObjeto }).setOptions({ strictQuery: false });
        if (enUso) {
            return res.status(409).json({ message: 'No se puede eliminar: hay producciones asociadas a este género. Cámbielo a Inactivo o reasigne las producciones.' });
        }

        const generoEliminado = await Genero.findByIdAndDelete(id);
        if (!generoEliminado) {
            return res.status(404).json({ message: 'No se encontró el género para eliminar' });
        }
        res.status(200).json({ message: 'Género eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};