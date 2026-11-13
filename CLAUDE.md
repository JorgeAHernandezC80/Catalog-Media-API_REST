# Catalog-Media-API_REST — trabajo con el Organismo ORG-01

Proyecto Node.js (ES Modules) + Express 5 + MongoDB/Mongoose. Las reglas de negocio están en la
sección 3 del README.

Los cambios de código se hacen con el **Organismo**: cuatro subagentes con separación de poderes
(`.claude/agents/`). Un hook (`.claude/hooks/separacion-poderes.mjs`) los hace cumplir. La CLI del
núcleo es la frontera de confianza:

```
..\..\..\..\..\organismo\node\src\cli.js     (en Bash: ../../../../../organismo/node/src/cli.js)
```

El Hipocampo vive en `./organismo_trabajo/` (ignorado por git) y solo lo escribe el subagente `guardia`.

## Ciclo (lo orquesta el hilo principal; no edita código mientras haya un objetivo en curso)

1. **planificador:** recibe el objetivo y devuelve el plan JSON.
2. **guardia:** `externo registrar OBJ-xxx --meta "…"` con el plan. Si se rechaza, vuelve al
   planificador con los chequeos fallidos.
3. **guardia:** `externo siguiente OBJ-xxx` devuelve el paso en curso.
   - `ESPERANDO_HUMANO`: pide al usuario que apruebe en su terminal y detente.
   - `COMPLETADO`, `ESCALADO` o `CONGELADO`: informa y detente.
4. **ejecutor:** recibe el paso completo y devuelve la salida JSON.
5. **inmune:** recibe el paso y la salida, y devuelve el veredicto JSON.
6. **guardia:** `externo aplicar OBJ-xxx` con `{ "salida": …, "veredicto": … }` **sin modificarlos**.
   Vuelve a 3.

Pasa los JSON entre subagentes tal cual los recibes. No resumas, no corrijas y no completes campos.

## Acciones solo humanas (en tu terminal, desde la raíz del repo)

```bash
node ../../../../../organismo/node/src/cli.js --trabajo ./organismo_trabajo aprobar OBJ-xxx P3 --aprobador "Jorge"
node ../../../../../organismo/node/src/cli.js --trabajo ./organismo_trabajo rearmar OBJ-xxx P2 --responsable "Jorge" --motivo "…"
```

## Validador de reglas de negocio

```bash
node .claude/organismo/validar-reglas.js                 # R1–R3 con datos (MongoDB)
node .claude/organismo/validar-reglas.js --solo-estatico # solo código y esquemas
```

Para garantizar solo lectura a nivel de servidor, define `MONGODB_URI_LECTURA` con un usuario de rol `read`.

## Pruebas del hook

```bash
node --test ".claude/organismo/pruebas/*.test.mjs"
```
