// Se implementa el controlador para manejar las operaciones CRUD de la colección "Media" (Películas y Series) 
// en la base de datos MongoDB, utilizando Mongoose como ODM. Este controlador incluye funciones para crear, leer, 
// actualizar y eliminar registros de medios, así como para validar referencias a otras colecciones relacionadas 
// (Género, Director, Productora y Tipo). Además, se manejan errores comunes de Mongoose y se proporcionan respuestas claras al cliente.

// 1. Importamos las dependencias y modelos con su respectiva validación de ID
import { isValidObjectId } from 'mongoose';
import Media from '../models/media.model.js';
import Genero from '../models/genero.model.js';
import Director from '../models/director.model.js';
import Productora from '../models/productora.model.js';
import Tipo from '../models/tipo.model.js';

// Definición de las relaciones de Media según el caso de estudio:
// Género, Director y Productora deben estar ACTIVOS (IX, X, XI).
// Tipo no tiene estado, solo debe existir (XII).
const RELACIONES = [
    { campo: 'genero', modelo: Genero, etiqueta: 'El Género', requiereActivo: true },
    { campo: 'director', modelo: Director, etiqueta: 'El Director', requiereActivo: true },
    { campo: 'productora', modelo: Productora, etiqueta: 'La Productora', requiereActivo: true },
    { campo: 'tipo', modelo: Tipo, etiqueta: 'El Tipo', requiereActivo: false }
];

// Valida las referencias enviadas en el body.
// - esCreacion = true: las 4 referencias son obligatorias.
// - esCreacion = false (PUT): solo se validan las que vengan en el body.
// Devuelve null si todo está bien, o { status, message } si hay un error.
const validarReferencias = async (body, esCreacion) => {
    for (const { campo, modelo, etiqueta, requiereActivo } of RELACIONES) {
        const id = body[campo];

        if (id === undefined || id === null || id === '') {
            if (esCreacion) {
                return { status: 400, message: `${etiqueta} es obligatorio (campo '${campo}').` };
            }
            continue;
        }

        if (!isValidObjectId(id)) {
            return { status: 400, message: `${etiqueta} no tiene un ID válido.` };
        }

        const registro = await modelo.findById(id);
        if (!registro) {
            return { status: 404, message: `${etiqueta} especificado no existe.` };
        }

        if (requiereActivo && registro.estado !== 'Activo') {
            return { status: 400, message: `${etiqueta} especificado está Inactivo y no se puede asignar.` };
        }
    }
    return null;
};

// Traduce los errores de MongoDB/Mongoose a respuestas claras
const manejarError = (res, error) => {
    if (error.code === 11000) {
        const campo = Object.keys(error.keyValue || {})[0] || 'campo';
        return res.status(409).json({
            message: `Ya existe una producción con ese ${campo}: '${error.keyValue?.[campo]}'. Debe ser único.`
        });
    }
    if (error.name === 'ValidationError') {
        const errores = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ message: 'Error de validación', errores });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ message: `Valor inválido para '${error.path}'.` });
    }
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
};

// 1. CREAR una nueva producción (Película o Serie)
export const createMedia = async (req, res) => {
    try {
        const errorReferencia = await validarReferencias(req.body, true);
        if (errorReferencia) {
            return res.status(errorReferencia.status).json({ message: errorReferencia.message });
        }

        const nuevaMedia = new Media(req.body);
        await nuevaMedia.save();

        res.status(201).json(nuevaMedia);
    } catch (error) {
        manejarError(res, error);
    }
};

// 2. OBTENER todo el catálogo con población de datos relacionales
export const obtenerCatalogo = async (req, res) => {
    try {
        const catalogo = await Media.find()
            .populate('genero', 'nombre estado')
            .populate('director', 'nombres estado')
            .populate('productora', 'nombre eslogan estado')
            .populate('tipo', 'nombre');

        res.status(200).json(catalogo);
    } catch (error) {
        manejarError(res, error);
    }
};

// 3. OBTENER el detalle completo de una producción por su ID
export const obtenerMediaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'El ID de la producción no es válido' });
        }

        const contenido = await Media.findById(id)
            .populate('genero')
            .populate('director')
            .populate('productora')
            .populate('tipo');

        if (!contenido) {
            return res.status(404).json({ message: 'No se encontró ninguna producción con ese ID' });
        }

        res.status(200).json(contenido);
    } catch (error) {
        manejarError(res, error);
    }
};

// 4. ACTUALIZAR una producción por ID (valida las referencias que se envíen)
export const actualizarMedia = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'El ID de la producción no es válido' });
        }

        const errorReferencia = await validarReferencias(req.body, false);
        if (errorReferencia) {
            return res.status(errorReferencia.status).json({ message: errorReferencia.message });
        }

        const mediaActualizada = await Media.findByIdAndUpdate(id, req.body, {
            returnDocument: 'after', // Devuelve el documento ya modificado
            runValidators: true // Aplica las validaciones del modelo (URL, año, etc.)
        });

        if (!mediaActualizada) {
            return res.status(404).json({ message: 'No se encontró la producción para actualizar' });
        }

        res.status(200).json(mediaActualizada);
    } catch (error) {
        manejarError(res, error);
    }
};

// 5. ELIMINAR una producción por ID
export const eliminarMedia = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'El ID de la producción no es válido' });
        }

        const mediaEliminada = await Media.findByIdAndDelete(id);
        if (!mediaEliminada) {
            return res.status(404).json({ message: 'No se encontró la producción para eliminar' });
        }

        res.status(200).json({ message: 'Producción eliminada correctamente del catálogo' });
    } catch (error) {
        manejarError(res, error);
    }
};