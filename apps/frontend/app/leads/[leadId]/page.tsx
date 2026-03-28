import Link from "next/link";
import { notFound } from "next/navigation";

import { getLeadDetail } from "@/features/leads/api/get-lead-detail";
import { getLeadHistory } from "@/features/leads/api/get-lead-history";
import { getLeadNotes } from "@/features/leads/api/get-lead-notes";
import { buildWhatsappChatUrl } from "@/lib/leads/whatsapp";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;

  const [lead, history, notes] = await Promise.all([
    getLeadDetail(leadId),
    getLeadHistory(leadId, 20).then((result) => result.items),
    getLeadNotes(leadId, 20).then((result) => result.items),
  ]);

  if (!lead) {
    notFound();
  }

  const waChatUrl = buildWhatsappChatUrl({
    whatsappUrl: lead.whatsappUrl,
    phoneE164: lead.phoneE164,
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dff7f5_0%,#f2f8ff_45%,#f8fafc_100%)] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-cyan-200/70 bg-white/90 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Lead detail</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{lead.businessName}</h1>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Volver al listado
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Estado CRM" value={lead.status} />
            <InfoCard label="Score" value={String(lead.score)} />
            <InfoCard label="Ciudad" value={lead.city} />
            <InfoCard label="Enrichment" value={lead.enrichmentStatus} />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Datos del negocio</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Place ID" value={lead.placeId} />
              <DetailItem label="Rubro comercial" value={lead.rubroComercial} />
              <DetailItem label="Rubro tecnico" value={lead.rubroTecnico ?? "-"} />
              <DetailItem label="Rating" value={lead.rating ? lead.rating.toFixed(1) : "-"} />
              <DetailItem label="Resenas" value={String(lead.reviewsCount)} />
              <DetailItem label="Telefono" value={lead.phoneE164 ?? "-"} />
              <DetailItem label="Website" value={lead.websiteUrl ?? "-"} />
              <DetailItem label="WhatsApp" value={lead.whatsappUrl ?? "-"} />
              <DetailItem label="Instagram" value={lead.instagramUrl ?? "-"} />
              <DetailItem label="Handle" value={lead.instagramHandle ?? "-"} />
              <DetailItem label="Business status" value={lead.businessStatus ?? "-"} />
              <DetailItem label="Address" value={lead.address ?? "-"} />
            </dl>

            {lead.mapsUrl ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={lead.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-100"
                >
                  Abrir en Google Maps
                </a>

                {waChatUrl ? (
                  <a
                    href={waChatUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                  >
                    Ir al chat de WhatsApp
                  </a>
                ) : null}

                {lead.instagramUrl ? (
                  <a
                    href={lead.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-medium text-pink-800 transition hover:bg-pink-100"
                  >
                    Abrir Instagram
                  </a>
                ) : null}
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Contactos enriquecidos</h2>
            {lead.contacts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Sin contactos trazados todavia.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {lead.contacts.map((contact) => (
                  <li key={contact.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <p className="font-medium text-slate-900">{contact.channel}</p>
                    <p className="break-all text-xs text-slate-600">{contact.value}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {contact.source} | {contact.confidence} | {contact.isConfirmed ? "confirmed" : "candidate"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Historial de estado</h2>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No hay cambios registrados.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <p className="font-medium text-slate-900">{item.newStatus}</p>
                    <p className="text-xs text-slate-500">
                      desde {item.previousStatus ?? "sin estado previo"} | {new Date(item.changedAt).toLocaleString("es-AR")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Notas CRM</h2>
            {notes.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No hay notas registradas.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {notes.map((note) => (
                  <li key={note.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <p>{note.note}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(note.createdAt).toLocaleString("es-AR")}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-800">{value}</dd>
    </div>
  );
}
