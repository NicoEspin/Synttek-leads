"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import Link from "next/link";

import { createLeadNote } from "@/features/leads/api/create-lead-note";
import { getClientsOverview } from "@/features/leads/api/get-clients-overview";
import { runDynamicEnrichment } from "@/features/leads/api/run-dynamic-enrichment";
import { getLeadHistory } from "@/features/leads/api/get-lead-history";
import { getLeadNotes } from "@/features/leads/api/get-lead-notes";
import { getMetricsOverview } from "@/features/leads/api/get-metrics-overview";
import { listClients } from "@/features/leads/api/list-clients";
import { listLeads } from "@/features/leads/api/list-leads";
import { runEnrichment } from "@/features/leads/api/run-enrichment";
import { searchLeads } from "@/features/leads/api/search-leads";
import { updateLeadStatus } from "@/features/leads/api/update-lead-status";
import type {
  LeadListItem,
  ClientsOverview,
  LeadMetricsOverview,
  LeadNoteItem,
  LeadStatusHistoryItem,
  ListLeadsResponse,
  SearchLeadsResponse,
} from "@/features/leads/types";
import { crmLeadStatuses, leadStatuses, type LeadStatus } from "@/lib/leads/status";
import { buildWhatsappChatUrl } from "@/lib/leads/whatsapp";

type SearchFormState = {
  rubroComercial: string;
  city: string;
  keywords: string;
  pageSize: number;
};

type ListFiltersState = {
  city: string;
  rubroComercial: string;
  status: "all" | LeadStatus;
  onlyWithoutWebsite: boolean;
  onlyWithPhone: boolean;
  sortBy: "updated_at" | "score" | "reviews_count" | "created_at";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
};

type PipelineTab = "leads" | "clients";

const viewedLeadsStorageKey = "synttek.leads.viewed.v1";

const statusLabel: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  revisado: "Revisado",
  contactado: "Contactado",
  respondio: "Respondio",
  en_proceso: "En proceso",
  descartado: "Descartado",
  ganado: "Ganado",
};

export function LeadsSearchView() {
  const [activeTab, setActiveTab] = useState<PipelineTab>("leads");
  const [searchForm, setSearchForm] = useState<SearchFormState>({
    rubroComercial: "Gastronomia",
    city: "Cordoba",
    keywords: "",
    pageSize: 10,
  });

  const [filters, setFilters] = useState<ListFiltersState>({
    city: "",
    rubroComercial: "",
    status: "all",
    onlyWithoutWebsite: false,
    onlyWithPhone: false,
    sortBy: "updated_at",
    sortDir: "desc",
    page: 1,
    pageSize: 12,
  });

  const [searchResult, setSearchResult] = useState<SearchLeadsResponse | null>(null);
  const [listResult, setListResult] = useState<ListLeadsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [isRunningEnrichment, setIsRunningEnrichment] = useState(false);
  const [isRunningDynamicEnrichment, setIsRunningDynamicEnrichment] = useState(false);
  const [enrichmentMessage, setEnrichmentMessage] = useState<string | null>(null);
  const [selectedHistoryLead, setSelectedHistoryLead] = useState<LeadListItem | null>(null);
  const [historyItems, setHistoryItems] = useState<LeadStatusHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [metrics, setMetrics] = useState<LeadMetricsOverview | null>(null);
  const [clientsOverview, setClientsOverview] = useState<ClientsOverview | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [notesLead, setNotesLead] = useState<LeadListItem | null>(null);
  const [leadNotes, setLeadNotes] = useState<LeadNoteItem[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [lastInteractedLeadId, setLastInteractedLeadId] = useState<string | null>(null);
  const [viewedLeadIds, setViewedLeadIds] = useState<Set<string>>(new Set());

  const historyModalOpen = Boolean(selectedHistoryLead);
  const notesModalOpen = Boolean(notesLead);

  const canGoPrev = (listResult?.page ?? 1) > 1;
  const canGoNext = (listResult?.page ?? 1) < (listResult?.totalPages ?? 1);
  const tableColumnCount = activeTab === "leads" ? 13 : 12;

  const subtitle = useMemo(() => {
    if (!listResult) {
      return "Sin resultados cargados todavia.";
    }

    if (activeTab === "clients") {
      return `Mostrando ${listResult.leads.length} de ${listResult.total} clientes en seguimiento.`;
    }

    return `Mostrando ${listResult.leads.length} de ${listResult.total} leads nuevos.`;
  }, [activeTab, listResult]);

  const statusOptions: readonly LeadStatus[] =
    activeTab === "clients" ? crmLeadStatuses : (["nuevo"] as const);

  async function loadPipeline(nextFilters?: Partial<ListFiltersState>, pipeline?: PipelineTab) {
    const targetPipeline = pipeline ?? activeTab;
    const resolvedFilters: ListFiltersState = {
      ...filters,
      ...nextFilters,
    };

    setIsLoadingTable(true);
    setError(null);

    try {
      const dataLoader = targetPipeline === "clients" ? listClients : listLeads;
      const data = await dataLoader({
        page: resolvedFilters.page,
        pageSize: resolvedFilters.pageSize,
        city: resolvedFilters.city || undefined,
        rubroComercial: resolvedFilters.rubroComercial || undefined,
        status: resolvedFilters.status === "all" ? undefined : resolvedFilters.status,
        onlyWithoutWebsite: resolvedFilters.onlyWithoutWebsite,
        onlyWithPhone: resolvedFilters.onlyWithPhone,
        sortBy: resolvedFilters.sortBy,
        sortDir: resolvedFilters.sortDir,
      });

      setListResult(data);
      setFilters(resolvedFilters);
    } catch (unknownError) {
      const fallbackMessage =
        targetPipeline === "clients" ? "No se pudieron cargar los clientes" : "No se pudieron cargar los leads";
      const message = unknownError instanceof Error ? unknownError.message : fallbackMessage;
      setError(message);
    } finally {
      setIsLoadingTable(false);
    }
  }

  async function loadMetrics() {
    setIsLoadingMetrics(true);

    try {
      const data = await getMetricsOverview();
      setMetrics(data);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudieron cargar metricas";
      setError(message);
    } finally {
      setIsLoadingMetrics(false);
    }
  }

  async function loadClientsMetrics() {
    setIsLoadingMetrics(true);

    try {
      const data = await getClientsOverview();
      setClientsOverview(data);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudieron cargar metricas de clientes";
      setError(message);
    } finally {
      setIsLoadingMetrics(false);
    }
  }

  useEffect(() => {
    void loadPipeline();
    void loadMetrics();
    void loadClientsMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(viewedLeadsStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }

      const safeLeadIds = parsed.filter((value): value is string => typeof value === "string");
      setViewedLeadIds(new Set(safeLeadIds));
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(viewedLeadsStorageKey, JSON.stringify(Array.from(viewedLeadIds)));
    } catch {
      // noop
    }
  }, [viewedLeadIds]);

  function markLeadAsInteracted(leadId: string) {
    setLastInteractedLeadId(leadId);
  }

  function setLeadViewed(leadId: string, isViewed: boolean) {
    setViewedLeadIds((prev) => {
      const next = new Set(prev);
      if (isViewed) {
        next.add(leadId);
      } else {
        next.delete(leadId);
      }

      return next;
    });
  }

  async function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    setError(null);

    try {
      const data = await searchLeads({
        rubroComercial: searchForm.rubroComercial,
        city: searchForm.city,
        keywords: searchForm.keywords || undefined,
        pageSize: searchForm.pageSize,
        languageCode: "es",
        regionCode: "AR",
      });

      setSearchResult(data);

      await loadPipeline({
        city: searchForm.city,
        rubroComercial: searchForm.rubroComercial,
        status: "all",
        page: 1,
      }, "leads");
      setActiveTab("leads");
      await loadMetrics();
      await loadClientsMetrics();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudo ejecutar la busqueda";
      setError(message);
    } finally {
      setIsSearching(false);
    }
  }

  async function onFiltersSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadPipeline({ page: 1 });
  }

  async function onStatusChange(lead: LeadListItem, status: LeadStatus) {
    markLeadAsInteracted(lead.id);
    setUpdatingLeadId(lead.id);
    setError(null);

    try {
      await updateLeadStatus(lead.id, status);
      await loadPipeline({ page: 1 });
      await loadMetrics();
      await loadClientsMetrics();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudo actualizar el estado";
      setError(message);
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function onRunEnrichment() {
    setIsRunningEnrichment(true);
    setError(null);
    setEnrichmentMessage(null);

    try {
      const result = await runEnrichment(10);
      setEnrichmentMessage(
        `Enrichment: procesados ${result.totalProcessed}, ok ${result.totalSucceeded}, fallidos ${result.totalFailed}`,
      );

      await loadPipeline();
      await loadMetrics();
      await loadClientsMetrics();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudo correr enrichment";
      setError(message);
    } finally {
      setIsRunningEnrichment(false);
    }
  }

  async function onRunDynamicEnrichment() {
    setIsRunningDynamicEnrichment(true);
    setError(null);
    setEnrichmentMessage(null);

    try {
      const result = await runDynamicEnrichment(5);
      setEnrichmentMessage(
        `Fallback JS: procesados ${result.totalProcessed}, ok ${result.totalSucceeded}, fallidos ${result.totalFailed}`,
      );

      await loadPipeline();
      await loadMetrics();
      await loadClientsMetrics();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudo correr fallback JS";
      setError(message);
    } finally {
      setIsRunningDynamicEnrichment(false);
    }
  }

  async function onViewHistory(lead: LeadListItem) {
    setSelectedHistoryLead(lead);
    setIsLoadingHistory(true);
    setError(null);

    try {
      const result = await getLeadHistory(lead.id, 20);
      setHistoryItems(result.items);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudo cargar historial";
      setError(message);
      setHistoryItems([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function onViewNotes(lead: LeadListItem) {
    setNotesLead(lead);
    setIsLoadingNotes(true);
    setError(null);

    try {
      const result = await getLeadNotes(lead.id, 30);
      setLeadNotes(result.items);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudieron cargar notas";
      setError(message);
      setLeadNotes([]);
    } finally {
      setIsLoadingNotes(false);
    }
  }

  async function onCreateNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!notesLead) {
      return;
    }

    const payload = newNote.trim();
    if (!payload) {
      return;
    }

    setIsSavingNote(true);
    setError(null);

    try {
      const created = await createLeadNote(notesLead.id, payload);
      setLeadNotes((prev) => [created, ...prev]);
      setNewNote("");
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudo guardar la nota";
      setError(message);
    } finally {
      setIsSavingNote(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dff7f5_0%,#f2f8ff_45%,#f8fafc_100%)] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-cyan-200/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Synttek Leads Engine</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Discovery operativo de leads locales</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            Busca por rubro y ciudad, guarda resultados en la base y gestiona estado comercial desde la misma tabla.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(activeTab === "clients"
            ? [
                {
                  label: "Total clientes",
                  value: clientsOverview?.totalClients ?? 0,
                },
                {
                  label: "Contactados",
                  value: clientsOverview?.contactado ?? 0,
                },
                {
                  label: "En proceso",
                  value: clientsOverview?.enProceso ?? 0,
                },
                {
                  label: "Ganados",
                  value: clientsOverview?.ganado ?? 0,
                },
              ]
            : [
                {
                  label: "Total leads",
                  value: metrics?.totalLeads ?? 0,
                },
                {
                  label: "Sin website",
                  value: metrics?.withoutWebsite ?? 0,
                },
                {
                  label: "Con WhatsApp",
                  value: metrics?.withWhatsapp ?? 0,
                },
                {
                  label: "Contactados",
                  value: metrics?.statusContactado ?? 0,
                },
              ]
          ).map((card) => (
            <article key={card.label} className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{isLoadingMetrics ? "..." : card.value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("leads");
                const nextFilters = { ...filters, status: "all" as const, page: 1 };
                setFilters(nextFilters);
                void loadPipeline(nextFilters, "leads");
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeTab === "leads" ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Leads nuevos
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("clients");
                const nextFilters = { ...filters, status: "all" as const, page: 1 };
                setFilters(nextFilters);
                void loadPipeline(nextFilters, "clients");
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeTab === "clients"
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Clientes CRM
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm md:p-6">
          <form className="grid gap-4 md:grid-cols-5" onSubmit={onSearchSubmit}>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Rubro comercial</span>
              <input
                value={searchForm.rubroComercial}
                onChange={(event) => setSearchForm((prev) => ({ ...prev, rubroComercial: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
                placeholder="Gastronomia"
                required
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Ciudad</span>
              <input
                value={searchForm.city}
                onChange={(event) => setSearchForm((prev) => ({ ...prev, city: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
                placeholder="Cordoba"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Resultados</span>
              <select
                value={searchForm.pageSize}
                onChange={(event) => setSearchForm((prev) => ({ ...prev, pageSize: Number(event.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </label>

            <label className="space-y-1 md:col-span-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Keywords adicionales</span>
              <input
                value={searchForm.keywords}
                onChange={(event) => setSearchForm((prev) => ({ ...prev, keywords: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
                placeholder="cafeteria, pizzeria, bar"
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-500"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Ejecutar busqueda
              </button>
            </div>
          </form>

          {searchResult ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Run: {searchResult.searchRunId.slice(0, 8)}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Found: {searchResult.totalFound}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Saved: {searchResult.totalSaved}</span>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {activeTab === "clients" ? "Clientes en seguimiento" : "Leads guardados"}
              </h2>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "leads" ? (
                <>
                  <button
                    type="button"
                    onClick={onRunEnrichment}
                    disabled={isRunningEnrichment || isRunningDynamicEnrichment || isLoadingTable}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRunningEnrichment ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Correr enrichment
                  </button>

                  <button
                    type="button"
                    onClick={onRunDynamicEnrichment}
                    disabled={isRunningDynamicEnrichment || isRunningEnrichment || isLoadingTable}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRunningDynamicEnrichment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Fallback JS (Playwright)
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => loadPipeline()}
                disabled={isLoadingTable}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingTable ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refrescar
              </button>
            </div>
          </div>

          {enrichmentMessage ? (
            <p className="mb-4 rounded-lg bg-cyan-50 px-3 py-2 text-sm text-cyan-800">{enrichmentMessage}</p>
          ) : null}

          <form className="grid gap-3 md:grid-cols-6" onSubmit={onFiltersSubmit}>
            <input
              value={filters.city}
              onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Filtrar ciudad"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            />

            <input
              value={filters.rubroComercial}
              onChange={(event) => setFilters((prev) => ({ ...prev, rubroComercial: event.target.value }))}
              placeholder="Filtrar rubro"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            />

            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value as ListFiltersState["status"],
                }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            >
              <option value="all">{activeTab === "clients" ? "Todos los estados CRM" : "Estado nuevo"}</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: event.target.value as ListFiltersState["sortBy"],
                }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            >
              <option value="updated_at">Orden: actualizado</option>
              <option value="score">Orden: score</option>
              <option value="reviews_count">Orden: resenas</option>
              <option value="created_at">Orden: creacion</option>
            </select>

            <select
              value={filters.sortDir}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  sortDir: event.target.value as ListFiltersState["sortDir"],
                }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>

            <button
              type="submit"
              disabled={isLoadingTable}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Aplicar filtros
            </button>

            <label className="inline-flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
              <input
                type="checkbox"
                checked={filters.onlyWithoutWebsite}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    onlyWithoutWebsite: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              Solo sin website
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
              <input
                type="checkbox"
                checked={filters.onlyWithPhone}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    onlyWithPhone: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              Solo con telefono
            </label>
          </form>

          {error ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1180px] border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Negocio</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rubro</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ciudad</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Website</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Telefono</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Instagram</th>
                  {activeTab === "leads" ? (
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Visto</th>
                  ) : null}
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Enrichment</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado CRM</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTable ? (
                  <tr>
                    <td colSpan={tableColumnCount} className="rounded-xl bg-slate-50 px-3 py-12 text-center text-sm text-slate-500">
                      {activeTab === "clients" ? "Cargando clientes..." : "Cargando leads..."}
                    </td>
                  </tr>
                ) : null}

                {!isLoadingTable && (listResult?.leads.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={tableColumnCount} className="rounded-xl bg-slate-50 px-3 py-12 text-center text-sm text-slate-500">
                      {activeTab === "clients"
                        ? "No hay clientes para estos filtros."
                        : "No hay leads para estos filtros."}
                    </td>
                  </tr>
                ) : null}

                {!isLoadingTable
                  ? listResult?.leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`rounded-xl ${
                          activeTab === "leads" && lead.id === lastInteractedLeadId
                            ? "bg-cyan-100/80 ring-1 ring-cyan-300"
                            : "bg-slate-50/70"
                        }`}
                      >
                        <td className="px-3 py-3 text-sm text-slate-700 first:rounded-l-xl">
                          <div>
                            <p className="font-semibold text-slate-900">{lead.businessName}</p>
                            <p className="text-xs text-slate-500">{lead.placeId}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">{lead.rubroComercial}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{lead.city}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          {lead.hasWebsite ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Con web</span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Sin web</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">{lead.phoneE164 ?? "-"}</td>
                        <td className="px-3 py-3 text-sm font-semibold text-slate-800">{lead.score}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{lead.rating ? lead.rating.toFixed(1) : "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          {(() => {
                            const waChatUrl = buildWhatsappChatUrl({
                              whatsappUrl: lead.whatsappUrl,
                              phoneE164: lead.phoneE164,
                            });

                            return waChatUrl ? (
                              <a
                                href={waChatUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => {
                                  markLeadAsInteracted(lead.id);
                                  if (activeTab === "leads") {
                                    setLeadViewed(lead.id, true);
                                  }
                                }}
                                className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                              >
                                Ir al chat
                              </a>
                            ) : (
                              "-"
                            );
                          })()}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          {lead.instagramUrl ? (
                            <a
                              href={lead.instagramUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => markLeadAsInteracted(lead.id)}
                              className="text-sm font-medium text-pink-700 hover:text-pink-900"
                            >
                              Abrir
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        {activeTab === "leads" ? (
                          <td className="px-3 py-3 text-sm text-slate-700">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={viewedLeadIds.has(lead.id)}
                                onChange={(event) => {
                                  markLeadAsInteracted(lead.id);
                                  setLeadViewed(lead.id, event.target.checked);
                                }}
                                className="h-4 w-4 rounded border-slate-300"
                              />
                              <span className="text-xs font-medium text-slate-600">
                                {viewedLeadIds.has(lead.id) ? "Visto" : "Pendiente"}
                              </span>
                            </label>
                          </td>
                        ) : null}
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                            {lead.enrichmentStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <select
                            value={lead.status}
                            onChange={(event) => onStatusChange(lead, event.target.value as LeadStatus)}
                            disabled={updatingLeadId === lead.id}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed"
                          >
                            {leadStatuses.map((status) => (
                              <option key={status} value={status}>
                                {statusLabel[status]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700 last:rounded-r-xl">
                          <div className="flex items-center gap-2">
                            {lead.mapsUrl ? (
                              <a
                                href={lead.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => markLeadAsInteracted(lead.id)}
                                className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
                              >
                                Ver Maps
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">Sin URL</span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                markLeadAsInteracted(lead.id);
                                void onViewHistory(lead);
                              }}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Historial
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                markLeadAsInteracted(lead.id);
                                void onViewNotes(lead);
                              }}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Notas
                            </button>

                            <Link
                              href={`/leads/${lead.id}`}
                              onClick={() => markLeadAsInteracted(lead.id)}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Detalle
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          {historyModalOpen ? (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
              <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Historial de estado - {selectedHistoryLead?.businessName}
                  </p>
                  <p className="text-xs text-slate-500">{selectedHistoryLead?.placeId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHistoryLead(null);
                    setHistoryItems([]);
                  }}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cerrar
                </button>
              </div>

              {isLoadingHistory ? (
                <p className="text-sm text-slate-500">Cargando historial...</p>
              ) : historyItems.length === 0 ? (
                <p className="text-sm text-slate-500">Este lead todavia no tiene cambios de estado registrados.</p>
              ) : (
                <ul className="space-y-2">
                  {historyItems.map((item) => (
                    <li key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{statusLabel[item.newStatus]}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="text-xs text-slate-500">
                        desde {item.previousStatus ? statusLabel[item.previousStatus] : "sin estado previo"}
                      </span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="text-xs text-slate-500">{new Date(item.changedAt).toLocaleString("es-AR")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>
          ) : null}

          {notesModalOpen ? (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
              <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Notas CRM - {notesLead?.businessName}</p>
                  <p className="text-xs text-slate-500">{notesLead?.placeId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotesLead(null);
                    setLeadNotes([]);
                    setNewNote("");
                  }}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cerrar
                </button>
              </div>

              <form className="mb-3 flex flex-col gap-2" onSubmit={onCreateNote}>
                <textarea
                  value={newNote}
                  onChange={(event) => setNewNote(event.target.value)}
                  placeholder="Escribi una nota comercial..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingNote || !newNote.trim()}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingNote ? "Guardando..." : "Guardar nota"}
                  </button>
                </div>
              </form>

              {isLoadingNotes ? (
                <p className="text-sm text-slate-500">Cargando notas...</p>
              ) : leadNotes.length === 0 ? (
                <p className="text-sm text-slate-500">Este lead todavia no tiene notas.</p>
              ) : (
                <ul className="space-y-2">
                  {leadNotes.map((item) => (
                    <li key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      <p>{item.note}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("es-AR")}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Pagina {listResult?.page ?? 1} de {listResult?.totalPages ?? 1}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadPipeline({ page: Math.max(1, filters.page - 1) })}
                disabled={!canGoPrev || isLoadingTable}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => loadPipeline({ page: filters.page + 1 })}
                disabled={!canGoNext || isLoadingTable}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
