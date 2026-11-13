#!/usr/bin/env node
// Hook PreToolUse: hace cumplir la separación de poderes del Organismo (CONTRATO.md) en Claude Code.
//
// Claude Code envía en stdin { tool_name, tool_input, agent_type?, cwd, ... }. agent_type es el
// `name` del subagente que llama a la herramienta (planificador, ejecutor, inmune, guardia) y no
// viene cuando llama el hilo principal. Este hook NIEGA lo que cada órgano no puede hacer; lo que
// sí puede hacer pasa al flujo normal de permisos (silencio ≠ aprobación).
//
// Es una barrera adicional. La barrera de fondo está en la CLI del Organismo, que recalcula los
// archivos realmente cambiados y verifica cada paso por su cuenta.
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

const CLI = String.raw`node\s+"?[^"\s]*organismo[\\/]+node[\\/]+src[\\/]+cli\.js"?`;
const CLI_RE = /organismo[\\/]+node[\\/]+src[\\/]+cli\.js/i;
const TRABAJO = 'organismo_trabajo';
const TRABAJO_ARG = String.raw`--trabajo\s+"?\.?[\\/]?organismo_trabajo"?`;
const SOLO_HUMANO = /\b(aprobar|rearmar)\b/;
const META = /[;&|`<>]|\$\(|\r|\n/; // encadenar, redirigir, sustituir

const ORGANOS = new Set(['planificador', 'ejecutor', 'inmune', 'guardia']);
const EDICION = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const LECTURA = new Set(['Read', 'Glob', 'Grep']);

// Acciones irreversibles: solo el ejecutor, en un paso 'despliegue' con aprobación humana registrada.
const IRREVERSIBLE = [
  /\bgit\s+(push|reset\s+--hard|clean\s+-[a-z]*f|rebase|filter-branch|tag\s+-d|branch\s+-D)\b/i,
  /\bgit\s+commit\b.*--amend/i,
  /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/i,
  /\b(npm|pnpm|yarn)\s+publish\b/i,
  /\b(mongosh|mongo)\b/i,
  /\b(dropDatabase|drop\(\)|deleteMany|remove\(\))/i,
  /\bcurl\b.*(-X\s*(POST|PUT|PATCH|DELETE)|--data|-d\s)/i,
  /\b(netlify|render|vercel|heroku|fly)\s+(deploy|up)\b/i,
  /\bgh\s+(pr\s+merge|release|repo\s+(delete|edit))\b/i,
];

function negar(motivo) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `[Organismo] ${motivo}` },
  }));
  process.exit(0);
}

function globARegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
const posix = (r) => r.replace(/\\/g, '/').replace(/^\.\//, '');

let entrada;
try {
  entrada = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.stderr.write('[Organismo] Entrada del hook ilegible: se bloquea por seguridad.');
  process.exit(2);
}

const herramienta = entrada.tool_name ?? '';
const ti = entrada.tool_input ?? {};
const agente = entrada.agent_type ?? null;
const proyecto = resolve(process.env.CLAUDE_PROJECT_DIR || entrada.cwd || '.');
const texto = JSON.stringify(ti);
const comando = herramienta === 'Bash' ? String(ti.command ?? '') : '';
const rutaArchivo = ti.file_path ?? ti.notebook_path ?? ti.path ?? null;
const rel = rutaArchivo ? posix(relative(proyecto, isAbsolute(rutaArchivo) ? rutaArchivo : resolve(entrada.cwd || proyecto, rutaArchivo))) : null;
const tocaTrabajo = texto.includes(TRABAJO);

let activo = null;
const rutaActivo = join(proyecto, TRABAJO, 'ACTIVO.json');
if (existsSync(rutaActivo)) {
  try { activo = JSON.parse(readFileSync(rutaActivo, 'utf8')); } catch { activo = { corrupto: true }; }
}
const paso = activo?.paso_actual ?? null;

// ---- Reglas para todos -----------------------------------------------------------------------
if (comando && CLI_RE.test(comando) && SOLO_HUMANO.test(comando)) {
  negar('Aprobar y rearmar son decisiones humanas: ejecútalas tú en tu terminal, no a través de un agente.');
}
if (/hipocampo\.db/i.test(texto) && !(agente === 'guardia' && CLI_RE.test(comando))) {
  negar('El Hipocampo solo se toca a través de la CLI del Organismo, y solo la Guardia puede escribirlo.');
}

// ---- Por órgano ------------------------------------------------------------------------------
switch (agente) {
  case 'planificador': {
    if (!LECTURA.has(herramienta)) negar(`El Planificador solo lee (Read, Glob, Grep). Intentó usar ${herramienta}.`);
    break;
  }

  case 'ejecutor': {
    if (tocaTrabajo || CLI_RE.test(texto)) {
      negar('El Ejecutor no puede leer ni tocar organismo_trabajo/ ni invocar la CLI del Organismo.');
    }
    if (rel && (rel === '.claude' || rel.startsWith('.claude/') || rel.startsWith('..'))) {
      negar(`El Ejecutor no puede acceder a ${rel}.`);
    }
    if (/["'\s=]\.claude[\\/]/.test(` ${comando}`)) negar('El Ejecutor no puede tocar .claude/.');
    if (EDICION.has(herramienta)) {
      if (!paso || activo?.estado !== 'ACTIVO') negar('No hay un paso en curso: el Ejecutor solo edita dentro de un objetivo activo.');
      if (paso.herramienta !== 'desarrollo') negar(`El paso ${paso.id} es '${paso.herramienta}': no autoriza editar archivos.`);
      const globs = (paso.archivos ?? []).map(posix);
      if (!rel || !globs.some((g) => globARegex(g).test(rel))) {
        negar(`${rel ?? 'Ese archivo'} no está entre los archivos del paso ${paso.id}: ${globs.join(', ') || '(ninguno)'}.`);
      }
    }
    if (comando && IRREVERSIBLE.some((rx) => rx.test(comando))) {
      const autorizado = paso?.herramienta === 'despliegue' && paso.aprobado === true && activo?.estado === 'ACTIVO';
      if (!autorizado) negar('Acción irreversible: solo en un paso de despliegue con aprobación humana registrada.');
    }
    break;
  }

  case 'inmune': {
    if (EDICION.has(herramienta)) negar('El Inmune audita: no edita archivos.');
    if (herramienta === 'Bash') {
      const permitidos = [
        new RegExp(`^${CLI}\\s+${TRABAJO_ARG}\\s+(estado|bitacora)\\s+[A-Za-z0-9_-]+\\s*$`),
        new RegExp(`^${CLI}\\s+${TRABAJO_ARG}\\s+verificar\\s*$`),
        /^node\s+\.?[\\/]?\.claude[\\/]organismo[\\/]validar-reglas\.js(\s+--solo-estatico)?\s*$/,
        /^npm\s+(test|run\s+[A-Za-z0-9:_-]+)\s*$/,
        /^git\s+(status|diff|log|show)(\s+[A-Za-z0-9_./:~^@=-]+)*\s*$/,
      ];
      if (META.test(comando) || !permitidos.some((rx) => rx.test(comando.trim()))) {
        negar('Comando fuera de la lista del Inmune (CLI de lectura, validar-reglas, npm test, git de lectura).');
      }
    } else if (!LECTURA.has(herramienta)) negar(`El Inmune no usa ${herramienta}.`);
    break;
  }

  case 'guardia': {
    if (EDICION.has(herramienta)) negar('La Guardia escribe el Hipocampo solo a través de la CLI.');
    if (herramienta === 'Bash') {
      const lineas = comando.split(/\r?\n/);
      const primera = lineas[0].trim();
      const escritura = new RegExp(`^${CLI}\\s+${TRABAJO_ARG}(\\s+--proyecto\\s+"?\\.?"?)?\\s+externo\\s+(registrar|siguiente|aplicar|exportar)\\s+[A-Za-z0-9_-]+(\\s+--meta\\s+"[^"\`$\\\\]*")?(\\s*<<\\s*'?([A-Z_]+)'?)?\\s*$`);
      const lectura = new RegExp(`^${CLI}\\s+${TRABAJO_ARG}\\s+(estado\\s+[A-Za-z0-9_-]+|bitacora\\s+[A-Za-z0-9_-]+|verificar)\\s*$`);
      const m = primera.match(escritura);
      let ok = false;
      const delim = m?.[5];
      if (delim) {
        // Heredoc: el delimitador aparece una sola vez, al final; el cuerpo es solo datos (nada se ejecuta después).
        ok = lineas.length >= 3 && lineas.at(-1).trim() === delim && lineas.slice(1, -1).every((l) => l.trim() !== delim);
      } else if (lineas.length === 1) {
        ok = Boolean(m) || lectura.test(primera);
      }
      if (!ok || (!delim && META.test(primera))) {
        negar('La Guardia solo ejecuta la CLI del Organismo con --trabajo ./organismo_trabajo (externo registrar|siguiente|aplicar|exportar, estado, bitacora, verificar).');
      }
    } else if (!LECTURA.has(herramienta)) negar(`La Guardia no usa ${herramienta}.`);
    break;
  }

  default: {
    // Hilo principal y cualquier otro agente (Explore, general-purpose, …).
    if (comando && CLI_RE.test(comando) && !/\s(estado|bitacora|verificar|escenarios)\b/.test(comando)) {
      negar('Solo la Guardia escribe el Hipocampo. Delega en el subagente "guardia".');
    }
    if (EDICION.has(herramienta) && rel?.startsWith(`${TRABAJO}/`)) negar('organismo_trabajo/ solo lo escribe la Guardia vía CLI.');
    if (comando && tocaTrabajo && !CLI_RE.test(comando)) negar('organismo_trabajo/ solo se modifica con la CLI del Organismo.');
    if (activo && !activo.corrupto && ['ACTIVO', 'ESPERANDO_HUMANO'].includes(activo.estado)) {
      if (EDICION.has(herramienta)) {
        negar(`El objetivo ${activo.objetivo_id} está en curso: el código lo cambia el subagente "ejecutor", no ${agente ?? 'el hilo principal'}.`);
      }
      if (comando && IRREVERSIBLE.some((rx) => rx.test(comando))) {
        negar(`El objetivo ${activo.objetivo_id} está en curso: las acciones irreversibles van por un paso de despliegue aprobado.`);
      }
    }
    if (ORGANOS.has(agente)) negar('Órgano sin reglas definidas.'); // inalcanzable; cierre por defecto
  }
}
process.exit(0);
