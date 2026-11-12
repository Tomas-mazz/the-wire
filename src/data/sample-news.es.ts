import type { NewsItem } from "./types";

/*
 * SAMPLE DATA (Spanish) for design preview. Same made-up stories as sample-news.en.ts.
 * Source links point to each outlet's home page, not to real articles.
 */
export const SAMPLE_NEWS_ES: NewsItem[] = [
  // ── Stocks ────────────────────────────────────────────
  {
    id: "stocks-1",
    topic: "stocks",
    importance: "top",
    title: "Las tecnológicas de chips lideran una suba generalizada por la demanda de IA",
    summary:
      "Las acciones de semiconductores impulsaron a los principales índices de EE.UU. después de que varias empresas mejoraran sus previsiones de inversión en centros de datos.",
    details: {
      paragraph:
        "Los inversores volvieron a comprar acciones de chips tras una semana tranquila, apostando a que la demanda de hardware para IA seguirá fuerte. Los analistas advirtieron que las valuaciones ya son altas y que cualquier freno en el gasto en la nube podría revertir la suba rápidamente.",
      keyPoints: [
        "El índice de chips subió más de 2% en el día",
        "Mejoran las previsiones de gasto en centros de datos",
        "Los analistas alertan por valuaciones exigentes",
      ],
    },
    source: { name: "Reuters", url: "https://www.reuters.com" },
    publishedAt: "2026-11-12T06:30:00Z",
  },
  {
    id: "stocks-2",
    topic: "stocks",
    importance: "top",
    title: "Los mercados europeos cierran mixtos y caen las marcas de lujo",
    summary:
      "Las subas de bancos y energía se compensaron con la caída de las marcas de lujo, tras ventas más flojas en Asia.",
    details: {
      paragraph:
        "El índice paneuropeo terminó prácticamente sin cambios. Los grupos de lujo bajaron por temor a una demanda más débil en Asia, mientras que los bancos subieron ante la expectativa de tasas altas por más tiempo.",
      keyPoints: [
        "El sector lujo cae por ventas débiles en Asia",
        "Los bancos se benefician de las tasas",
        "El principal índice europeo, estable",
      ],
    },
    source: { name: "Financial Times", url: "https://www.ft.com" },
    publishedAt: "2026-11-12T06:10:00Z",
  },
  {
    id: "stocks-3",
    topic: "stocks",
    importance: "top",
    title: "Un gigante minorista supera las estimaciones y mejora su previsión",
    summary:
      "Las acciones saltaron antes de la apertura después de que la empresa informara mayores ventas online y elevara su pronóstico anual.",
    details: {
      paragraph:
        "La compañía atribuyó el resultado a entregas más rápidas y a un negocio publicitario en crecimiento. La dirección dijo que la demanda para las fiestas se ve sólida, pero advirtió por la presión de los costos logísticos.",
      keyPoints: [
        "Las ventas online crecieron a doble dígito",
        "Mejora la previsión para todo el año",
        "Los costos logísticos siguen siendo un riesgo",
      ],
    },
    source: { name: "CNBC", url: "https://www.cnbc.com" },
    publishedAt: "2026-11-12T05:45:00Z",
  },
  {
    id: "stocks-4",
    topic: "stocks",
    importance: "secondary",
    title: "Los ADRs argentinos extienden las subas por optimismo con las reformas",
    summary: "Los ADRs de bancos y energía subieron por tercera rueda seguida.",
    details: {
      paragraph:
        "Los inversores siguieron apostando a avances en las reformas económicas, lo que impulsó a las acciones argentinas que cotizan en Nueva York.",
      keyPoints: [
        "Tercera rueda consecutiva en alza",
        "Lideran bancos y energía",
        "La agenda de reformas mueve el ánimo",
      ],
    },
    source: { name: "Bloomberg", url: "https://www.bloomberg.com" },
    publishedAt: "2026-11-12T05:20:00Z",
  },
  {
    id: "stocks-5",
    topic: "stocks",
    importance: "secondary",
    title: "Las petroleras bajan por la caída del crudo",
    summary: "Las acciones de energía cedieron levemente con el petróleo en retroceso.",
    details: {
      paragraph:
        "El crudo bajó ante señales de mayor oferta, lo que pesó sobre las grandes productoras de petróleo.",
      keyPoints: [
        "El crudo baja cerca de 1%",
        "Se espera más oferta",
        "Sector energía levemente negativo",
      ],
    },
    source: { name: "Reuters", url: "https://www.reuters.com" },
    publishedAt: "2026-11-12T05:00:00Z",
  },

  // ── Crypto ────────────────────────────────────────────
  {
    id: "crypto-1",
    topic: "crypto",
    importance: "top",
    title: "Bitcoin se mantiene estable mientras se frenan las entradas a los ETF",
    summary:
      "Bitcoin operó en un rango estrecho y las entradas diarias a los ETF al contado cayeron a su nivel más bajo en semanas.",
    details: {
      paragraph:
        "Después de un mes fuerte, la demanda de los compradores de ETF se enfrió. Los traders dicen que el mercado espera señales más claras sobre las tasas de interés antes del próximo gran movimiento.",
      keyPoints: [
        "Precio sin dirección hace tres días",
        "Entradas a ETF en mínimos de varias semanas",
        "Las tasas son el próximo disparador",
      ],
    },
    source: { name: "CoinDesk", url: "https://www.coindesk.com" },
    publishedAt: "2026-11-12T06:40:00Z",
  },
  {
    id: "crypto-2",
    topic: "crypto",
    importance: "top",
    title: "La actualización de la red Ethereum entra en su prueba final",
    summary:
      "Los desarrolladores lanzaron la última red de prueba pública para la próxima actualización, que busca bajar los costos de las redes de capa 2.",
    details: {
      paragraph:
        "Si las pruebas salen bien, la actualización podría llegar a la red principal en pocos meses. Se pide a los operadores de nodos que actualicen su software con anticipación.",
      keyPoints: [
        "La red de prueba final ya funciona",
        "Comisiones más bajas para capa 2",
        "Todavía sin fecha para la red principal",
      ],
    },
    source: { name: "The Block", url: "https://www.theblock.co" },
    publishedAt: "2026-11-12T06:00:00Z",
  },
  {
    id: "crypto-3",
    topic: "crypto",
    importance: "top",
    title: "Los reguladores de la UE publican nuevas guías para emisores de stablecoins",
    summary:
      "Las guías aclaran los requisitos de reservas y las reglas de reporte para las empresas que emiten stablecoins respaldadas en euros y dólares.",
    details: {
      paragraph:
        "El documento completa vacíos de la regulación original y fija plazos para que los emisores se adecúen. Las cámaras del sector celebraron la claridad, pero advirtieron que algunas reglas pueden ser costosas para los jugadores chicos.",
      keyPoints: [
        "Reporte de reservas más estricto",
        "Plazos de adecuación definidos",
        "Preocupación por costos en emisores chicos",
      ],
    },
    source: { name: "CoinDesk", url: "https://www.coindesk.com" },
    publishedAt: "2026-11-12T05:30:00Z",
  },
  {
    id: "crypto-4",
    topic: "crypto",
    importance: "secondary",
    title: "El volumen de transacciones de Solana toca su máximo del mes",
    summary: "La actividad en la red creció gracias a nuevas apps de trading.",
    details: {
      paragraph:
        "Las transacciones diarias en Solana alcanzaron su nivel más alto del mes, impulsadas por apps de trading descentralizadas.",
      keyPoints: [
        "Máximo mensual de transacciones",
        "Impulsado por apps de trading",
        "Las comisiones siguen bajas",
      ],
    },
    source: { name: "Decrypt", url: "https://decrypt.co" },
    publishedAt: "2026-11-12T05:10:00Z",
  },
  {
    id: "crypto-5",
    topic: "crypto",
    importance: "secondary",
    title: "Un exchange importante suma nuevos pares en euros",
    summary: "Los usuarios europeos tienen más mercados directos en euros.",
    details: {
      paragraph:
        "El exchange amplió su oferta en euros, lo que reduce la necesidad de convertir a través de stablecoins en dólares.",
      keyPoints: [
        "Nuevos pares en EUR",
        "Pensado para usuarios europeos",
        "Menores costos de conversión",
      ],
    },
    source: { name: "The Block", url: "https://www.theblock.co" },
    publishedAt: "2026-11-12T04:50:00Z",
  },

  // ── Programming ───────────────────────────────────────
  {
    id: "programming-1",
    topic: "programming",
    importance: "top",
    title: "Un framework de JavaScript importante lanza renderizado en servidor más rápido",
    summary:
      "La nueva versión reduce el tiempo de renderizado en servidor y simplifica la caché de datos, con una herramienta automática para migrar apps existentes.",
    details: {
      paragraph:
        "El equipo se enfocó en el rendimiento y la experiencia de desarrollo. Las primeras pruebas muestran cargas de página notablemente más rápidas, y la herramienta de migración resuelve sola la mayoría de los cambios incompatibles.",
      keyPoints: [
        "Renderizado en servidor más rápido",
        "Modelo de caché más simple",
        "Incluye herramienta de migración automática",
      ],
    },
    source: { name: "The Verge", url: "https://www.theverge.com" },
    publishedAt: "2026-11-12T06:20:00Z",
  },
  {
    id: "programming-2",
    topic: "programming",
    importance: "top",
    title: "Encuesta a desarrolladores: TypeScript sigue ganando popularidad",
    summary:
      "Una gran encuesta anual muestra que la adopción de TypeScript vuelve a crecer y que la mayoría de los proyectos web nuevos ya arrancan con tipos estáticos.",
    details: {
      paragraph:
        "Los encuestados dijeron que detectar errores antes de ejecutar el código fue el principal motivo para cambiar. La encuesta también destacó el uso creciente de asistentes de IA para programar en todos los niveles de experiencia.",
      keyPoints: [
        "Vuelve a crecer la adopción de TypeScript",
        "La mayoría de los proyectos web nuevos usan tipos",
        "Los asistentes de IA ya son de uso masivo",
      ],
    },
    source: { name: "InfoQ", url: "https://www.infoq.com" },
    publishedAt: "2026-11-12T05:50:00Z",
  },
  {
    id: "programming-3",
    topic: "programming",
    importance: "top",
    title: "Una base de datos open source popular lanza una versión mayor",
    summary:
      "La actualización trae consultas más rápidas, mejor soporte para JSON y replicación mejorada para apps de mucho tráfico.",
    details: {
      paragraph:
        "Los mantenedores destacaron mejoras de rendimiento en grandes volúmenes de datos y nuevas herramientas de monitoreo. Se espera que los proveedores en la nube ofrezcan la nueva versión en pocas semanas.",
      keyPoints: [
        "Consultas más rápidas en tablas grandes",
        "Mejores funciones para JSON",
        "Los proveedores en la nube la sumarán pronto",
      ],
    },
    source: { name: "Ars Technica", url: "https://arstechnica.com" },
    publishedAt: "2026-11-12T05:15:00Z",
  },
  {
    id: "programming-4",
    topic: "programming",
    importance: "secondary",
    title: "Los navegadores acuerdan nuevas funciones de diseño en CSS",
    summary: "Las próximas funciones van a andar igual en todos los navegadores principales.",
    details: {
      paragraph:
        "Los equipos de los navegadores se alinearon para lanzar juntos un conjunto de funciones de CSS, lo que reduce los problemas de compatibilidad.",
      keyPoints: [
        "Acuerdo entre navegadores",
        "Nuevas posibilidades de diseño",
        "Menos parches de compatibilidad",
      ],
    },
    source: { name: "Smashing Magazine", url: "https://www.smashingmagazine.com" },
    publishedAt: "2026-11-12T04:40:00Z",
  },
  {
    id: "programming-5",
    topic: "programming",
    importance: "secondary",
    title: "Sale un parche de seguridad para una librería de logs muy usada",
    summary: "Los mantenedores piden actualizar lo antes posible.",
    details: {
      paragraph:
        "Se corrigió una vulnerabilidad en un paquete de logs popular. Los proyectos que dependen de él deberían actualizar a la última versión.",
      keyPoints: [
        "Vulnerabilidad corregida",
        "Se recomienda actualizar",
        "Sin ataques activos conocidos",
      ],
    },
    source: { name: "BleepingComputer", url: "https://www.bleepingcomputer.com" },
    publishedAt: "2026-11-12T04:30:00Z",
  },

  // ── Economy ───────────────────────────────────────────
  {
    id: "economy-1",
    topic: "economy",
    importance: "top",
    title: "La inflación de EE.UU. se modera y crecen las expectativas de baja de tasas",
    summary:
      "Los precios al consumidor subieron menos de lo esperado el mes pasado, lo que refuerza la idea de que el banco central baje las tasas a comienzos del año próximo.",
    details: {
      paragraph:
        "La baja de la energía y de los autos usados ayudó a moderar la inflación. Los economistas advirtieron que la inflación de servicios sigue firme, así que las autoridades probablemente se muevan con cautela.",
      keyPoints: [
        "Inflación por debajo de lo esperado",
        "Crecen las expectativas de recorte de tasas",
        "Los servicios siguen caros",
      ],
    },
    source: { name: "Reuters", url: "https://www.reuters.com" },
    publishedAt: "2026-11-12T06:50:00Z",
  },
  {
    id: "economy-2",
    topic: "economy",
    importance: "top",
    title: "El Banco Central Europeo anticipa una pausa en su política",
    summary:
      "Los funcionarios sugirieron que las tasas se mantendrán sin cambios por ahora, con un crecimiento de la eurozona débil pero estable.",
    details: {
      paragraph:
        "Varios miembros dijeron que quieren más datos antes de decidir el próximo paso. Los mercados ya esperan que no haya cambios en la próxima reunión.",
      keyPoints: [
        "Se espera que las tasas se mantengan",
        "Crecimiento de la eurozona débil pero estable",
        "La decisión depende de nuevos datos",
      ],
    },
    source: { name: "Financial Times", url: "https://www.ft.com" },
    publishedAt: "2026-11-12T06:05:00Z",
  },
  {
    id: "economy-3",
    topic: "economy",
    importance: "top",
    title: "Argentina informa un dato de inflación mensual más bajo",
    summary:
      "La inflación mensual volvió a desacelerarse y continúa una tendencia a la baja que el gobierno atribuye a la disciplina fiscal.",
    details: {
      paragraph:
        "El nuevo dato quedó por debajo de lo que esperaban los analistas. Los economistas dijeron que la tendencia es positiva, pero que los salarios y el consumo todavía se están recuperando.",
      keyPoints: [
        "Se desaceleró la inflación mensual",
        "Por debajo de lo esperado por analistas",
        "El consumo todavía se recupera",
      ],
    },
    source: { name: "Bloomberg", url: "https://www.bloomberg.com" },
    publishedAt: "2026-11-12T05:40:00Z",
  },
  {
    id: "economy-4",
    topic: "economy",
    importance: "secondary",
    title: "El desempleo en España cae a su nivel más bajo en años",
    summary: "El turismo y los servicios impulsaron la creación de empleo.",
    details: {
      paragraph:
        "España sumó empleos otro trimestre, liderado por el turismo y los servicios, y el desempleo bajó a su nivel más bajo en años.",
      keyPoints: [
        "Desempleo en mínimos de varios años",
        "El turismo lidera las contrataciones",
        "Sector servicios fuerte",
      ],
    },
    source: { name: "El País", url: "https://elpais.com" },
    publishedAt: "2026-11-12T05:05:00Z",
  },
  {
    id: "economy-5",
    topic: "economy",
    importance: "secondary",
    title: "El comercio mundial muestra una leve suba",
    summary: "Los datos de transporte marítimo indican una recuperación moderada.",
    details: {
      paragraph:
        "Los volúmenes de transporte en contenedores subieron levemente, lo que sugiere que el comercio mundial se estabiliza tras un período débil.",
      keyPoints: [
        "Suben levemente los volúmenes marítimos",
        "El comercio se estabiliza",
        "La recuperación todavía es moderada",
      ],
    },
    source: { name: "The Economist", url: "https://www.economist.com" },
    publishedAt: "2026-11-12T04:45:00Z",
  },
];
