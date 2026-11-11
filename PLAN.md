# Plan de trabajo — The Wire

Decisiones: `PREGUNTAS.md`. Estilo: `ESTILO.md`. Cada paso termina en algo que se puede ver o probar, y se revisa en celular y PC antes de seguir.

**Stack:** Next.js (App Router) + TypeScript · Postgres en la nube (Supabase o Neon) · Vercel · GitHub (repo público) · Claude API (modelo barato, Haiku) para resumir.
**Límites:** menos de 5 h por semana · 0–5 USD por mes.

## Versión 1 — lo mínimo para usarla
1. **Preparar el proyecto:** repo en GitHub, proyecto Next.js con TypeScript, primer deploy en Vercel y `.env.example`.
2. **Diseño base (sin datos reales):** tokens de color en CSS, tipografías Inter + JetBrains Mono, header, portada con fondo de tickers y tarjetas 3+2 con "ver más", usando noticias de ejemplo (según `ESTILO.md`).
3. **Bilingüe:** textos ES/EN, detección del idioma del navegador y selector.
4. **Base de datos:** Postgres y tabla de noticias (fecha, tema, país, importancia, textos ES/EN, link a la fuente). El historial se guarda desde el día 1.
5. **Pipeline diario:** cron de Vercel (07:00 UTC ≈ 08:00 en Dinamarca) → leer RSS por tema y país → Claude elige 3+2 y resume en ES/EN → guardar en la base. Si Vercel no alcanza, GitHub Actions.
6. **Mostrar noticias reales:** pestañas por tema y selector de país.
7. **Carrusel propio:** cripto en vivo (WebSocket de Binance), acciones con demora (API gratis a evaluar) y conversión de moneda.
8. **Preferencias:** temas, país, moneda y criptos guardados en `localStorage`.
9. **Pulido y una semana de uso real.**

## Versión 2
10. Historial por fecha + buscador por palabra.

## Versión 3
11. Agenda de eventos de las próximas 1–2 semanas + exportar a calendario (.ics).
12. Chatbot con Claude sobre las noticias del día (20 mensajes por día por persona).

## Futuro
- IA local (Ollama) en una compu vieja, con Cloudflare Tunnel.
- Login con pago para un calendario propio. Dominio propio.
