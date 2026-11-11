# Preguntas para arrancar el proyecto

Cada respuesta se anota debajo de su pregunta (→ Respuesta:).

## 1. Objetivo y uso
1. ¿Cómo se va a llamar la web?
   → Respuesta: **The Wire** (el nombre queda en inglés en los dos idiomas). Antes era "El Telegrama / The Wire", pero se simplificó al pasar al estilo futurista.
2. ¿Cuántas personas la van a usar, más o menos?
   → Respuesta: Yo y algunos amigos. Arranca básico, pero tiene que estar preparada para crecer si algún día tiene mucho tráfico.
3. ¿Desde dónde la vas a mirar más: celular, computadora o los dos?
   → Respuesta: Los dos por igual (diseño responsive).
4. ¿En qué idioma querés las noticias y la web: español, inglés o los dos?
   → Respuesta: Los dos, elegible. Por defecto, el idioma del navegador.
5. ¿En qué momento del día la pensás abrir (mañana, todo el día)?
   → Respuesta: Varias veces al día. Igual alcanza con que las noticias se actualicen una vez por día (los precios van en vivo).

## 2. Temas y noticias
6. ¿Qué temas querés en la primera versión? (bolsa, cripto, programación, ¿otros?)
   → Respuesta: Bolsa, Cripto, Programación y Economía/política.
7. ¿Cuántas noticias por tema por día te parecen ideales?
   → Respuesta: 5 por tema: las 3 más importantes, grandes y destacadas, y 2 extras más chicas debajo.
8. ¿Qué tan largo querés el resumen corto? ¿Y el "ver más"?
   → Respuesta: Resumen de 2–3 líneas. El "ver más" trae 1 párrafo, 3 puntos clave y el link a la fuente. Sin fotos.
9. ¿Hay fuentes que te gusten o que quieras evitar?
   → Respuesta: Sin preferencia. Fuentes confiables y gratuitas que se puedan leer automáticamente (RSS o APIs).
10. ¿Las noticias deberían ser globales, de Argentina, de Dinamarca/Europa, o una mezcla?
    → Respuesta: Globales para todos, más un país que elige cada usuario. Países en v1: Argentina, Estados Unidos y España/resto de Europa.
11. ¿Querés guardar noticias viejas (historial) o solo ver las del día?
    → Respuesta: Guardar todo. Se navega por fecha y con un buscador por palabra (el buscador llega en v2; los datos se guardan desde el día 1).
12. ¿Cada usuario elige sus temas o todos ven lo mismo?
    → Respuesta: Cada uno elige, sin cuenta. Se guarda en su navegador.

## 3. Precios en vivo (carrusel)
13. ¿Qué acciones o índices querés ver en el carrusel de bolsa?
    → Respuesta: Índices de EE.UU., grandes tech, Europa/Dinamarca y Argentina. También se adapta al país que elija cada usuario.
14. ¿Qué criptomonedas querés ver?
    → Respuesta: Bitcoin, Ethereum y el top 10 por defecto. Cada usuario puede armar su propia lista.
15. ¿Te sirve que las acciones tengan unos minutos de demora, o necesitás tiempo real exacto?
    → Respuesta: La demora está bien (APIs gratis). Las cripto van en tiempo real (Binance).
16. ¿En qué moneda querés ver los precios (USD, EUR, DKK, ARS)?
    → Respuesta: La elige cada usuario, con conversión automática.
17. ¿Te sirve un widget ya hecho (por ejemplo TradingView) o querés que el carrusel sea 100% diseño propio?
    → Respuesta: 100% diseño propio.

## 4. Calendario de charlas y eventos
18. ¿Qué tipo de eventos te interesan? (conferencias de tecnología, resultados de empresas, reuniones de bancos centrales, eventos cripto, ¿otros?)
    → Respuesta: Todos: resultados de empresas, bancos centrales/macro, conferencias tech y eventos cripto.
19. ¿Los eventos se cargan solos, los agregan ustedes a mano, o las dos cosas?
    → Respuesta: Solo automático (APIs, y la IA elige lo importante). No tiene que ser un calendario literal: una vista interactiva y fácil de leer con lo importante de esta semana y las próximas dos. Idea futura: login con pago para armar tu propio calendario.
20. ¿Querés recordatorios o avisos antes de un evento?
    → Respuesta: Un botón "agregar a mi calendario" (Google Calendar / archivo .ics).

## 5. Chatbot
21. ¿Qué querés que haga el chatbot: explicar noticias del día, responder dudas generales, o las dos?
    → Respuesta: Primero, preguntas sobre las noticias. En el futuro, que también explique conceptos.
22. ¿Con qué IA te gustaría hacerlo (Claude, otra)? ¿Estás dispuesto a pagar unos pocos dólares por mes por la API?
    → Respuesta: Claude por API; pago unos dólares por mes. Experimento futuro: una IA local (Ollama) en una compu vieja siempre prendida.
23. ¿El chatbot debería tener límite de mensajes por persona?
    → Respuesta: Sí, unos 20 por día.

## 6. Estilo visual
> **Cambio (11/11/2026):** el estilo "bolsa de antes" (cinta de papel, letra serif de diario) se reemplazó por un estilo **futurista y limpio**, inspirado en starknet.io. La guía completa está en `ESTILO.md`.

24. ¿Qué imagen tenés en la cabeza?
    → Respuesta: Futurista y limpio, como starknet.io (sin copiarlo).
25. ¿Gris y negro solamente, o algún color de acento?
    → Respuesta: Solo blanco y grises, sin degradé. El único color es el verde/rojo de las subas y bajas.
26. ¿Fondo claro tipo papel o fondo oscuro?
    → Respuesta: Solo oscuro (casi negro). Sin modo claro.
27. ¿Qué tipografía te imaginás?
    → Respuesta: Sans-serif moderna y limpia (tipo Inter), y monoespaciada para los precios y números.
28. ¿Querés detalles extra?
    → Respuesta: Un fondo sutil de tickers y números (AAPL, BTC, +1.2%…) en el encabezado, íconos de línea por tema y animaciones sutiles.
29. ¿Tenés alguna web o imagen de referencia que te guste?
    → Respuesta: starknet.io (estilo general). De Yahoo Finance le gusta el tipo de contenido, pero no lo saturada que está: la información se tiene que ir abriendo de a poco.

## 7. Acceso y usuarios
30. ¿La web es pública o con contraseña / login para tus amigos?
    → Respuesta: Pública.
31. ¿Cada uno necesita su propia cuenta (para guardar temas y favoritos)?
    → Respuesta: No en v1: las preferencias se guardan en el navegador. En el futuro, login con pago para el calendario propio.

## 8. Técnica
32. ¿Qué lenguajes o frameworks sabés o querés aprender con este proyecto? (HTML/CSS/JS, React, Next.js, Python…)
    → Respuesta: HTML/CSS/JS, React y Next.js, con TypeScript. Nivel intermedio.
33. ¿Preferís algo simple sin base de datos al principio, o armarlo completo desde el inicio?
    → Respuesta: Una base de datos simple desde el inicio (Postgres gratis en la nube: Supabase o Neon).
34. ¿Dónde querés publicarla? (Vercel, Netlify, otro) ¿Querés un dominio propio?
    → Respuesta: En Vercel. El dominio propio, más adelante.
35. ¿A qué hora querés que se actualicen las noticias cada día? (hora de Dinamarca)
    → Respuesta: A las 08:00.
36. ¿Usás GitHub? ¿Querés guardar el proyecto ahí?
    → Respuesta: Sí, en un repo público. Las claves de las APIs nunca se suben al repo.

## 9. Alcance y tiempos
37. ¿Qué es lo mínimo que tiene que tener la primera versión para que la empieces a usar?
    → Respuesta: Noticias resumidas por tema, el carrusel de precios propio y la elección de país, moneda y temas.
38. ¿Cuánto tiempo por semana le podés dedicar?
    → Respuesta: Menos de 5 horas.
39. ¿Cuánto estás dispuesto a gastar por mes (APIs, hosting, dominio)?
    → Respuesta: 0–5 USD.
40. ¿Cómo vas a saber que la web funciona bien para vos?
    → Respuesta: Me informo en menos de 5 minutos, la abro todos los días y anda sola sin tocarla.
