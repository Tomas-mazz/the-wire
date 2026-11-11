# Guía de estilo — The Wire

> Definida el 11/11/2026. Reemplaza al estilo anterior ("bolsa de antes", con cinta de papel y letra serif).
> Referencia: [starknet.io](https://www.starknet.io/), para tomar el espíritu, no para copiarlo.

## La idea en una frase
**Futurista, oscuro y limpio:** una pantalla casi negra, tipografía blanca grande, mucho espacio vacío y tarjetas suaves. Lo único con color son los números que suben (verde) o bajan (rojo).

## Principios
1. **Menos es más.** Al entrar se ve solo lo esencial: titulares y precios. Todo lo demás se abre al tocar ("ver más", pestañas, desplegables). Es lo contrario de Yahoo Finance, que muestra todo junto.
2. **El color tiene un significado.** No hay colores decorativos: blanco y grises para todo, y verde/rojo solo para indicar subas y bajas. Así un vistazo alcanza para leer el mercado.
3. **Espacio generoso.** Márgenes y separaciones amplios. Si algo se siente apretado, sobra contenido.
4. **Movimiento sutil.** Las animaciones acompañan y nunca distraen.
5. **Se lee en menos de 5 minutos.** Cada decisión de diseño tiene que ayudar a eso.

## Colores
Solo modo oscuro. En el código se definen como variables CSS (*design tokens*): un único lugar donde cambiar un color para toda la web.

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0B0B0B` | Fondo general (casi negro) |
| `--surface` | `#161616` | Tarjetas y paneles |
| `--surface-hover` | `#1F1F1F` | Tarjeta al pasar el mouse |
| `--border` | `rgba(255,255,255,0.08)` | Bordes finos, casi invisibles |
| `--border-strong` | `rgba(255,255,255,0.20)` | Botones con borde, foco |
| `--text` | `#FFFFFF` | Títulos |
| `--text-body` | `#CCCCCC` | Texto de lectura |
| `--text-muted` | `#8A8A8A` | Fechas, fuentes, etiquetas |
| `--up` | `#3DD68C` | Suba (precio y flecha ▲) |
| `--down` | `#FF5C5C` | Baja (precio y flecha ▼) |

No se usan degradés.

## Tipografía
- **Textos y títulos:** [Inter](https://fonts.google.com/specimen/Inter), sans-serif moderna y limpia.
- **Precios y números:** [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), monoespaciada. Así los números no "bailan" cuando cambian, porque todos los dígitos tienen el mismo ancho.

| Elemento | Tamaño (PC / celular) | Peso |
|---|---|---|
| Título de portada (H1) | 48px / 32px | 700 |
| Título de noticia principal | 24px / 20px | 700 |
| Título de noticia extra | 18px / 16px | 600 |
| Texto | 16px | 400, interlineado 1.6 |
| Etiquetas / metadatos | 13px | 500, en mayúsculas, con algo de espacio entre letras |

## Formas y espaciado
- **Bordes redondeados:** 24px en tarjetas grandes, 16px en tarjetas chicas, 12px en botones e inputs, y píldoras (totalmente redondeadas) en las etiquetas de tema.
- **Espaciado:** múltiplos de 8px (8, 16, 24, 32, 48, 64). Entre secciones, 64px o más.
- **Ancho máximo del contenido:** 1200px, centrado. En celular, 16px de margen a los costados.
- **Bordes:** siempre de 1px con `--border`. No se usan sombras fuertes.

## Elementos de la página

### Encabezado (header)
- Fijo arriba, fondo `--bg` semitransparente con desenfoque (efecto vidrio).
- Logo "THE WIRE" en mayúsculas con espacio entre letras, pestañas de temas, selector de idioma, país y moneda.
- En celular, los temas pasan a una fila que se desliza de costado.

### Portada (hero)
- Fecha del día y título corto, por ejemplo "Lo importante de hoy".
- **Fondo de tickers:** detrás del título, una grilla de símbolos y números (`AAPL 189.20 +1.2% · BTC 67,200 −0.4% · NVDA…`) en JetBrains Mono, gris muy tenue (opacidad de 5–8%). Se desplaza muy despacio y se desvanece hacia los bordes. Es la marca visual de la web.

### Carrusel de precios
- Una franja horizontal que se desliza sola, con ticker, precio y variación (▲ verde / ▼ rojo).
- Se pausa al pasar el mouse o al tocarla.
- Cuando cambia un precio, el número hace un destello breve del color correspondiente (0,6 s).

### Tarjetas de noticias
- **3 principales:** tarjetas grandes (`--surface`, radio de 24px) con etiqueta de tema, título, resumen de 2–3 líneas y botón "Ver más".
- **2 extras:** debajo, más chicas y compactas (solo título y una línea).
- **"Ver más":** la tarjeta se expande ahí mismo, con una animación suave, y muestra 1 párrafo, 3 puntos clave y "Leer en [fuente] →".
- Sin fotos. Cada tema se identifica con su **ícono de línea**.

### Íconos
- Íconos de línea finos (trazo de 1.5px) de la librería [Lucide](https://lucide.dev), en blanco o gris.
- Por tema: Bolsa → `trending-up`, Cripto → `bitcoin`, Programación → `code`, Economía/política → `landmark`.

### Botones
- **Principal:** fondo blanco, texto negro, radio de 12px.
- **Secundario:** transparente, borde `--border-strong` y texto blanco (como "Bridge" y "Earn" en Starknet).

## Animación (nivel: sutil)
- **Aparición al hacer scroll:** las tarjetas suben 8px y pasan de transparentes a visibles (0,4 s).
- **Hover en tarjetas:** el fondo pasa a `--surface-hover` y el borde se aclara un poco.
- **Carrusel:** se mueve de forma continua y lenta.
- **Fondo de tickers:** se desplaza muy lento.
- **Accesibilidad:** si el usuario activó "reducir movimiento" en su sistema (`prefers-reduced-motion`), se apaga todo lo que se mueve solo.

## Accesibilidad
- Contraste suficiente: el texto `#CCCCCC` sobre `#0B0B0B` pasa de sobra el estándar WCAG AA.
- Subas y bajas no se indican solo con color: también llevan flecha (▲/▼) y signo (+/−), para personas con daltonismo.
- Todo se puede usar con el teclado, y el foco se ve con un borde blanco.

## Qué NO hacer
- No usar degradés ni colores de acento.
- No usar fotos ni ilustraciones 3D.
- No llenar la pantalla de información: si hay dudas, se oculta detrás de "ver más".
- No usar animaciones llamativas que distraigan de la lectura.
