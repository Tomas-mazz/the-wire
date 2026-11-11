# Instrucciones para la IA (Cursor)

**Estado (11/11/2026):** la etapa de definición terminó. Ya están respondidas todas las preguntas y el usuario aprobó empezar. Se programa siguiendo `PLAN.md`, paso a paso, respetando `ESTILO.md`. Ante decisiones nuevas, se le sigue preguntando al usuario.

(Proceso original de definición, ya completado:)

1. Leé `IDEA.md` para entender el proyecto.
2. Antes de crear cualquier archivo de código, hacele al usuario las preguntas de `PREGUNTAS.md`.
   - Hacelas de a pocas (3–5 por vez), por bloque, en español.
   - No asumas respuestas ni tomes decisiones por él: todo se pregunta.
   - Si una respuesta abre dudas nuevas, preguntá también eso.
   - Si el usuario no sabe qué elegir, explicale las opciones de forma simple (pros y contras) y dejá que decida él.
3. Anotá cada respuesta en `PREGUNTAS.md`, debajo de su pregunta.
4. Cuando estén todas respondidas, proponé un plan de trabajo por pasos y esperá su OK antes de programar.

El usuario está aprendiendo programación: explicá lo que hacés y por qué.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
