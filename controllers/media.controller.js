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
    { campo: 'generos', modelo: Genero, etiqueta: 'El Género', requiereActivo: true },
    { campo: 'director', modelo: Director, etiqueta: 'El Director', requiereActivo: true },
    { campo: 'productora', modelo: Productora, etiqueta: 'La Productora', requiereActivo: true },
    { campo: 'tipo', modelo: Tipo, etiqueta: 'El Tipo', requiereActivo: false }
];

// Campos de RELACIONES que son listas de referencias y no un solo ID.
// Los separamos aquí para que el arreglo RELACIONES conserve su forma.
const CAMPOS_LISTA = new Set(['generos']);

// Máximo de elementos en una lista de referencias (igual que en el modelo)
const MAX_ELEMENTOS_LISTA = 5;

// Valida una relación que es lista (por ejemplo 'generos').
// Revisa forma, IDs, repetidos, existencia y estado antes de tocar la base.
// Devuelve null si todo está bien, o { status, message } si hay un error.
const validarLista = async (lista, { campo, modelo, etiqueta, requiereActivo }) => {
    if (!Array.isArray(lista)) {
        return { status: 400, message: `El campo '${campo}' debe ser una lista de IDs.` };
    }
    if (lista.length === 0) {
        return { status: 400, message: `El campo '${campo}' debe tener al menos un elemento.` };
    }
    if (lista.length > MAX_ELEMENTOS_LISTA) {
        return { status: 400, message: `El campo '${campo}' no puede tener más de ${MAX_ELEMENTOS_LISTA} elementos.` };
    }

    for (const id of lista) {
        if (!isValidObjectId(id)) {
            return { status: 400, message: `${etiqueta} '${id}' no tiene un ID válido.` };
        }
    }

    // Comparamos como texto para detectar repetidos aunque vengan como ObjectId
    const textos = lista.map((id) => String(id));
    if (new Set(textos).size !== textos.length) {
        return { status: 400, message: `El campo '${campo}' tiene elementos repetidos.` };
    }

    // Una sola consulta para todos los IDs, en vez de una por cada uno
    const registros = await modelo.find({ _id: { $in: textos } });
    const encontrados = new Map(registros.map((r) => [String(r._id), r]));

    for (const id of textos) {
        const registro = encontrados.get(id);
        if (!registro) {
            return { status: 404, message: `${etiqueta} '${id}' no existe.` };
        }
        if (requiereActivo && registro.estado !== 'Activo') {
            return { status: 400, message: `${etiqueta} '${registro.nombre ?? id}' está Inactivo y no se puede asignar.` };
        }
    }
    return null;
};

// Valida las referencias enviadas en el body.
// - esCreacion = true: las 4 referencias son obligatorias.
// - esCreacion = false (PUT): solo se validan las que vengan en el body.
// Devuelve null si todo está bien, o { status, message } si hay un error.
const validarReferencias = async (body, esCreacion) => {
    // El campo antiguo 'genero' ya no existe. Si alguien lo sigue enviando,
    // le avisamos en vez de ignorarlo en silencio (Mongoose lo descartaría).
    if (body.genero !== undefined && body.generos === undefined) {
        return {
            status: 400,
            message: "El campo 'genero' ya no se usa. Ahora se llama 'generos' y debe ser una lista de IDs de género (de 1 a 5)."
        };
    }

    for (const relacion of RELACIONES) {
        const { campo, modelo, etiqueta, requiereActivo } = relacion;
        const id = body[campo];

        if (id === undefined || id === null || id === '') {
            if (esCreacion) {
                return { status: 400, message: `${etiqueta} es obligatorio (campo '${campo}').` };
            }
            continue;
        }

        // Las relaciones de tipo lista tienen su propia validación
        if (CAMPOS_LISTA.has(campo)) {
            const errorLista = await validarLista(id, relacion);
            if (errorLista) return errorLista;
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

// 2. OBTENER todo el catálogo con población de datos relacionales.
// Si llega ?genero=<id>, solo devolvemos las producciones que tienen
// ese género dentro de su lista 'generos'.
export const obtenerCatalogo = async (req, res) => {
    try {
        const id = req.query.genero;
        let consulta;

        if (id !== undefined) {
            // Debe ser un único texto con un ID válido. Si llega repetido
            // (?genero=a&genero=b) Express lo entrega como lista, y eso también es un error.
            if (typeof id !== 'string' || !isValidObjectId(id)) {
                return res.status(400).json({
                    message: "El parámetro 'genero' debe ser un ID de género válido."
                });
            }
            // Mongoose busca el id dentro de la lista 'generos'.
            // Si no hay producciones con ese género, devuelve una lista vacía (200).
            consulta = Media.find({ generos: id });
        } else {
            // Sin parámetro devolvemos todo el catálogo, como antes.
            consulta = Media.find();
        }

        const catalogo = await consulta
            .populate('generos', 'nombre estado')
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
            .populate('generos')
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