// Pruebas del hook de separación de poderes:  node --test ".claude/organismo/pruebas/*.test.mjs"
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'hooks', 'separacion-poderes.mjs');
const CLI = 'node ../../../../../organismo/node/src/cli.js --trabajo ./organismo_trabajo';

function proyecto(activo) {
  const dir = mkdtempSync(join(tmpdir(), 'hook-'));
  if (activo) {
    mkdirSync(join(dir, 'organismo_trabajo'), { recursive: true });
    writeFileSync(join(dir, 'organismo_trabajo', 'ACTIVO.json'), JSON.stringify(activo));
  }
  return dir;
}
const DESARROLLO = { objetivo_id: 'OBJ-1', estado: 'ACTIVO', paso_actual: { id: 'P1', herramienta: 'desarrollo', archivos: ['controllers/media.controller.js', 'test/**'], aprobado: false } };
const DESPLIEGUE_OK = { objetivo_id: 'OBJ-1', estado: 'ACTIVO', paso_actual: { id: 'P2', herramienta: 'despliegue', archivos: [], aprobado: true } };

function hook({ agente, herramienta, input, activo = DESARROLLO }) {
  const dir = proyecto(activo);
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: herramienta, tool_input: input, cwd: dir, ...(agente ? { agent_type: agente } : {}) }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, encoding: 'utf8',
  });
  if (r.status === 2) return 'deny';
  return r.stdout.includes('"deny"') ? 'deny' : 'pass';
}
const bash = (command) => ({ command });
const archivo = (file_path) => ({ file_path, content: 'x' });

const casos = [
  // planificador
  ['planificador', 'Read', archivo('models/media.model.js'), 'pass'],
  ['planificador', 'Grep', { pattern: 'serial' }, 'pass'],
  ['planificador', 'Edit', archivo('models/media.model.js'), 'deny'],
  ['planificador', 'Bash', bash('ls'), 'deny'],
  ['planificador', 'WebFetch', { url: 'https://x.y' }, 'deny'],
  // ejecutor
  ['ejecutor', 'Edit', archivo('controllers/media.controller.js'), 'pass'],
  ['ejecutor', 'Write', archivo('test/media.test.js'), 'pass'],
  ['ejecutor', 'Edit', archivo('server.js'), 'deny'],
  ['ejecutor', 'Write', archivo('organismo_trabajo/ACTIVO.json'), 'deny'],
  ['ejecutor', 'Read', archivo('organismo_trabajo/estado/OBJ-1.json'), 'deny'],
  ['ejecutor', 'Read', archivo('.claude/organismo/validar-reglas.js'), 'deny'],
  ['ejecutor', 'Bash', bash('node .claude/organismo/validar-reglas.js'), 'deny'],
  ['ejecutor', 'Bash', bash(`${CLI} estado OBJ-1`), 'deny'],
  ['ejecutor', 'Bash', bash('echo hola > organismo_trabajo/x'), 'deny'],
  ['ejecutor', 'Bash', bash('git push origin main'), 'deny'],
  ['ejecutor', 'Bash', bash('rm -rf node_modules'), 'deny'],
  ['ejecutor', 'Bash', bash('mongosh catalog_media_db --eval "db.media.drop()"'), 'deny'],
  ['ejecutor', 'Bash', bash('node --check controllers/media.controller.js'), 'pass'],
  ['ejecutor', 'Bash', bash('npm test'), 'pass'],
  ['ejecutor', 'Edit', archivo('controllers/media.controller.js'), 'deny', null],
  ['ejecutor', 'Bash', bash('git push origin feature/serial'), 'pass', DESPLIEGUE_OK],
  ['ejecutor', 'Edit', archivo('controllers/media.controller.js'), 'deny', DESPLIEGUE_OK],
  // inmune
  ['inmune', 'Read', archivo('controllers/media.controller.js'), 'pass'],
  ['inmune', 'Edit', archivo('controllers/media.controller.js'), 'deny'],
  ['inmune', 'Bash', bash('node .claude/organismo/validar-reglas.js'), 'pass'],
  ['inmune', 'Bash', bash('node .claude/organismo/validar-reglas.js --solo-estatico'), 'pass'],
  ['inmune', 'Bash', bash(`${CLI} estado OBJ-1`), 'pass'],
  ['inmune', 'Bash', bash(`${CLI} verificar`), 'pass'],
  ['inmune', 'Bash', bash('node ..\\..\\..\\..\\..\\organismo\\node\\src\\cli.js --trabajo .\\organismo_trabajo verificar'), 'pass'],
  ['inmune', 'Bash', bash('git diff controllers/media.controller.js'), 'pass'],
  ['inmune', 'Bash', bash('npm test'), 'pass'],
  ['inmune', 'Bash', bash(`${CLI} externo aplicar OBJ-1`), 'deny'],
  ['inmune', 'Bash', bash('npm test && rm -rf x'), 'deny'],
  ['inmune', 'Bash', bash('git push'), 'deny'],
  ['inmune', 'Bash', bash('sed -i s/a/b/ server.js'), 'deny'],
  // guardia
  ['guardia', 'Bash', bash(`${CLI} externo registrar OBJ-1 --meta "Validar serial único en media" <<'JSON'\n{"meta":"x"}\nJSON`), 'pass'],
  ['guardia', 'Bash', bash(`${CLI} externo siguiente OBJ-1`), 'pass'],
  ['guardia', 'Bash', bash(`${CLI} externo aplicar OBJ-1 <<'JSON'\n{"salida":{},\n"veredicto":{}}\nJSON`), 'pass'],
  ['guardia', 'Bash', bash(`${CLI} estado OBJ-1`), 'pass'],
  ['guardia', 'Bash', bash(`${CLI} externo aplicar OBJ-1 <<'JSON'\n{}\nJSON\nrm -rf .\nJSON`), 'deny'],
  ['guardia', 'Bash', bash(`${CLI} externo aplicar OBJ-1; rm -rf .`), 'deny'],
  ['guardia', 'Bash', bash(`${CLI} aprobar OBJ-1 P2 --aprobador "Guardia"`), 'deny'],
  ['guardia', 'Bash', bash(`${CLI} rearmar OBJ-1 P2 --responsable g --motivo m`), 'deny'],
  ['guardia', 'Bash', bash('node ../../../../../organismo/node/src/cli.js --trabajo /tmp/otro externo siguiente OBJ-1'), 'deny'],
  ['guardia', 'Bash', bash('sqlite3 organismo_trabajo/hipocampo.db "DELETE FROM pasos"'), 'deny'],
  ['guardia', 'Write', archivo('organismo_trabajo/ACTIVO.json'), 'deny'],
  ['guardia', 'Bash', bash('cat server.js'), 'deny'],
  // hilo principal y otros agentes
  [null, 'Bash', bash(`${CLI} externo aplicar OBJ-1`), 'deny'],
  [null, 'Bash', bash(`${CLI} aprobar OBJ-1 P2 --aprobador Jorge`), 'deny'],
  [null, 'Bash', bash(`${CLI} estado OBJ-1`), 'pass'],
  [null, 'Edit', archivo('controllers/media.controller.js'), 'deny'],
  [null, 'Edit', archivo('controllers/media.controller.js'), 'pass', null],
  [null, 'Bash', bash('rm -rf organismo_trabajo'), 'deny', null],
  [null, 'Read', archivo('organismo_trabajo/hipocampo.db'), 'deny', null],
  ['general-purpose', 'Write', archivo('server.js'), 'deny'],
  ['Explore', 'Read', archivo('server.js'), 'pass'],
];

for (const [agente, herramienta, input, esperado, activo] of casos) {
  const nombre = `${agente ?? 'principal'} · ${herramienta} · ${JSON.stringify(input).slice(0, 70)}${activo === null ? ' · sin objetivo' : activo ? ' · despliegue aprobado' : ''}`;
  test(nombre, () => {
    assert.equal(hook({ agente, herramienta, input, activo: activo === undefined ? DESARROLLO : activo }), esperado);
  });
}

test('entrada ilegible: se bloquea', () => {
  const r = spawnSync(process.execPath, [HOOK], { input: 'no-json', encoding: 'utf8' });
  assert.equal(r.status, 2);
});
