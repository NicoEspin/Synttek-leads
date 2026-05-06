import type { LeadListItem } from "@/features/leads/types";

import { buildWhatsappChatUrl } from "@/lib/leads/whatsapp";

type LeadResearchPromptInput = LeadListItem &
  Partial<{
    notes: string | null;
    enrichmentSummary: string | null;
    summary: string | null;
    address: string | null;
    businessStatus: string | null;
  }>;

function safeString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  if (
    normalized === "undefined" ||
    normalized === "null" ||
    normalized === "[object object]" ||
    normalized === "-" ||
    normalized === "abrir"
  ) {
    return null;
  }

  return trimmed;
}

function formatNullable(value: unknown, fallback = "No disponible") {
  return safeString(value) ?? fallback;
}

function formatWebsite(lead: Pick<LeadResearchPromptInput, "websiteUrl" | "hasWebsite">) {
  const websiteUrl = safeString(lead.websiteUrl);
  if (websiteUrl) {
    return websiteUrl;
  }

  return lead.hasWebsite ? "Tiene web detectada, pero no hay URL disponible" : "No tiene web detectada";
}

function formatInstagram(value: unknown) {
  return safeString(value) ?? "No tiene Instagram detectado";
}

function buildGoogleMapsUrl(lead: Pick<LeadResearchPromptInput, "businessName" | "city" | "mapsUrl" | "placeId">) {
  const directUrl = safeString(lead.mapsUrl);
  if (directUrl) {
    return directUrl;
  }

  const query = [safeString(lead.businessName), safeString(lead.city)].filter(Boolean).join(" ").trim();
  const encodedQuery = encodeURIComponent(query || "Google Maps");
  const placeId = safeString(lead.placeId);

  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}&query_place_id=${encodeURIComponent(placeId)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
}

function formatRating(value: number | null) {
  return typeof value === "number" ? value.toFixed(1) : "No disponible";
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? String(value) : "No disponible";
}

function formatAdditionalContext(lead: LeadResearchPromptInput) {
  const details = [
    lead.address ? `- Direccion: ${lead.address}` : null,
    lead.businessStatus ? `- Estado del negocio en Google: ${lead.businessStatus}` : null,
    typeof lead.reviewsCount === "number" ? `- Cantidad de resenas: ${lead.reviewsCount}` : null,
    safeString(lead.notes) ? `- Notas internas: ${safeString(lead.notes)}` : null,
    safeString(lead.enrichmentSummary) ? `- Resumen de enrichment: ${safeString(lead.enrichmentSummary)}` : null,
    safeString(lead.summary) ? `- Resumen comercial: ${safeString(lead.summary)}` : null,
  ].filter(Boolean);

  if (details.length === 0) {
    return "";
  }

  return `\n${details.join("\n")}`;
}

export function buildLeadResearchPrompt(lead: LeadResearchPromptInput) {
  const whatsapp =
    buildWhatsappChatUrl({
      whatsappUrl: safeString(lead.whatsappUrl),
      phoneE164: safeString(lead.phoneE164),
    }) ?? formatNullable(lead.whatsappUrl);

  const mapsUrl = buildGoogleMapsUrl(lead);

  return `Quiero que actues como analista comercial senior de Synttek, una agencia de desarrollo web, software, automatizaciones, branding y diseno grafico ubicada en Cordoba, Argentina.

Necesito que investigues este lead y me prepares un analisis comercial completo para saber si vale la pena contactarlo, que oportunidad digital tiene y cual seria el mejor angulo de venta.

DATOS DEL LEAD:
- Negocio: ${formatNullable(lead.businessName)}
- Rubro: ${formatNullable(lead.rubroComercial)}
- Ciudad / ubicacion: ${formatNullable(lead.city)}
- Telefono: ${formatNullable(lead.phoneE164)}
- Website: ${formatWebsite(lead)}
- Instagram: ${formatInstagram(lead.instagramUrl)}
- WhatsApp: ${whatsapp}
- Google Rating: ${formatRating(lead.rating)}
- Score interno del lead: ${formatNumber(lead.score)}
- Estado CRM: ${formatNullable(lead.status)}
- Estado de enrichment: ${formatNullable(lead.enrichmentStatus)}
- Google Maps / Place ID: ${formatNullable(lead.placeId)}
- Link de Google Maps: ${mapsUrl}${formatAdditionalContext(lead)}

CONTEXTO:
Este lead fue detectado como posible oportunidad comercial para Synttek. Puede que tenga web o puede que no. Puede que tenga Instagram o puede que no. La idea es analizar su presencia digital actual y encontrar una forma inteligente, humana y concreta de contactarlo.

QUIERO QUE HAGAS LA INVESTIGACION EN ESTE ORDEN:

1. Resumen rapido del negocio
Explicame que parece ser este negocio, que vende, a que tipo de cliente apunta y que tan importante parece su presencia digital para vender mas.

2. Diagnostico de presencia digital
Analiza si tiene:
- sitio web
- Instagram
- WhatsApp
- Google Maps
- resenas
- coherencia visual
- facilidad para contactar
- facilidad para ver productos, servicios, menu, reservas o informacion clave

Si no encontras algun canal, aclara que no aparece disponible y no inventes informacion.

3. Problemas u oportunidades detectadas
Busca oportunidades concretas como:
- no tiene web
- la web se ve vieja, lenta o poco clara
- depende demasiado de Instagram o WhatsApp
- no tiene menu/catalogo claro
- no tiene sistema de reservas/pedidos
- no tiene buen SEO local
- no transmite confianza suficiente
- podria mejorar fotos, branding o comunicacion
- podria automatizar consultas frecuentes
- podria captar mas clientes turistas o locales

4. Nivel de oportunidad para Synttek
Clasifica el lead como:
- Alta oportunidad
- Media oportunidad
- Baja oportunidad

Justifica la clasificacion con argumentos concretos.

5. Servicio recomendado para ofrecer
Elegi una o varias opciones:
- Landing page profesional
- Sitio web institucional
- Web con catalogo/menu digital
- Sistema de reservas o pedidos por WhatsApp
- Automatizacion de WhatsApp
- Branding / rediseno visual
- Flyers y piezas para redes
- SEO local
- Sistema a medida
- Otro servicio si corresponde

Explica por que ese servicio seria util para este negocio.

6. Angulo de venta recomendado
Dame el mejor enfoque para contactarlo. Tiene que ser humano, especifico y no sonar como spam. Quiero un angulo basado en el problema real del negocio.

Ejemplos de enfoque:
- "Vi que tienen buena reputacion en Google, pero no encontre una web clara donde un turista pueda ver rapido la propuesta y contactarlos."
- "Note que trabajan mucho desde WhatsApp/Instagram, pero podrian ordenar mejor la experiencia para convertir mas consultas."
- "Tienen buena presencia local, pero podrian mejorar como aparecen ante personas que buscan desde Google."

7. Mensaje inicial sugerido por WhatsApp
Escribi un mensaje corto, natural y personalizado para contactar al negocio.
Reglas:
- No sonar vendedor agresivo
- No hablar primero de precios
- No decir "somos una agencia" como primera frase
- Empezar con una observacion concreta del negocio
- Maximo 4 lineas
- Tono argentino, cercano y profesional
- Que abra conversacion, no que cierre una venta

8. Version alternativa mas directa
Dame una segunda version del mensaje, un poco mas directa, pero sin ser pesada.

9. Objeciones posibles y respuestas
Lista posibles objeciones del lead y como responder:
- "Ya tenemos Instagram"
- "No necesitamos web"
- "Ahora no tenemos presupuesto"
- "Lo vemos mas adelante"
- "Ya tenemos alguien que nos maneja redes"
- "Mandame info"

10. Recomendacion final
Decime si conviene contactar este lead ahora, dejarlo para despues o descartarlo.
Inclui una explicacion breve y accionable.

IMPORTANTE:
- No inventes datos.
- Si usas informacion externa, cita las fuentes.
- Prioriza informacion actual.
- Si no podes verificar algo, decilo.
- El analisis tiene que estar pensado para vender servicios digitales de Synttek de forma inteligente y personalizada.`;
}
