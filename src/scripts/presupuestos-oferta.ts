import { BARRIOS_DATA, DIPLOMADOS_DATA, type BarrioInfo, type Diplomado } from "../data/presupuestos-data";
import { isLenientMatch } from "../lib/presupuestos-search";
import { setState, setVariant } from "./presupuestos-ui";

type ViewMode = "barrios" | "todos";

interface State {
  searchTerm: string;
  selectedBarrioId: string | null;
  selectedCategory: string;
  viewMode: ViewMode;
}

/** Valores derivados del estado (los `useMemo` del original). */
interface Derived {
  currentBarrio: BarrioInfo | null;
  detectedBarrios: BarrioInfo[];
  filtered: Diplomado[];
  hasActiveFilters: boolean;
}

function matchesBarrio(barrio: BarrioInfo, query: string): boolean {
  return (
    isLenientMatch(barrio.name, query) ||
    isLenientMatch(barrio.comuna, query) ||
    isLenientMatch(barrio.zone, query) ||
    isLenientMatch(barrio.description, query)
  );
}

function matchesDiplomado(dip: Diplomado, query: string, detectedBarrios: BarrioInfo[]): boolean {
  return (
    isLenientMatch(dip.name, query) ||
    isLenientMatch(dip.tagline, query) ||
    isLenientMatch(dip.description, query) ||
    isLenientMatch(dip.category, query) ||
    isLenientMatch(dip.kitDescription, query) ||
    dip.whatYouLearn.some((l) => isLenientMatch(l, query)) ||
    dip.barrios.some((b) => isLenientMatch(b, query)) ||
    detectedBarrios.some((b) => b.diplomadoIds.includes(dip.id))
  );
}

/** Misma lógica de filtrado que `SeccionOferta.tsx`: flexible, tolerante a errores y no restrictiva. */
function derive(state: State): Derived {
  const { searchTerm, selectedBarrioId, selectedCategory } = state;
  const currentBarrio = BARRIOS_DATA.find((b) => b.id === selectedBarrioId) ?? null;
  const trimmed = searchTerm.trim();
  const detectedBarrios = trimmed ? BARRIOS_DATA.filter((b) => matchesBarrio(b, trimmed)) : [];

  const filtered = DIPLOMADOS_DATA.filter((dip) => {
    if (selectedCategory !== "Todas" && dip.category !== selectedCategory) return false;
    // Con una búsqueda activa no se restringe al barrio seleccionado antes.
    if (trimmed !== "") return matchesDiplomado(dip, trimmed, detectedBarrios);
    if (selectedBarrioId && !currentBarrio?.diplomadoIds.includes(dip.id)) return false;
    return true;
  });

  const hasActiveFilters = Boolean(searchTerm || selectedCategory !== "Todas" || selectedBarrioId);
  return { currentBarrio, detectedBarrios, filtered, hasActiveFilters };
}

function barrioChipVariant(isSelected: boolean, isDetected: boolean): "on" | "alt" | "off" {
  if (isSelected) return "on";
  return isDetected ? "alt" : "off";
}

function barrioDotColor(isSelected: boolean, isDetected: boolean, base: string): string {
  if (isSelected) return "#000";
  return isDetected ? "#affc41" : base;
}

/**
 * Explorador de diplomados por barrio. Port de `SeccionOferta.tsx`: mismo
 * estado (`searchTerm`, `selectedBarrioId`, `selectedCategory`, `viewMode`) y
 * misma lógica de filtrado. Las tarjetas vienen renderizadas desde el
 * servidor (Oferta.astro); acá solo se muestran/ocultan y se actualizan sus
 * estados. Las tarjetas que vuelven a aparecer se re-animan solas: el
 * IntersectionObserver de presupuestos-reveal.ts las ve entrar de nuevo, igual
 * que React las re-montaba.
 */
export function attachOferta(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(selector: string): T | null => root.querySelector<T>(selector);
  const $$ = <T extends HTMLElement>(selector: string): T[] => Array.from(root.querySelectorAll<T>(selector));

  const search = $<HTMLInputElement>("[data-search]");
  const resetBtn = $<HTMLButtonElement>("[data-reset]");
  const grid = $("[data-grid]");
  if (!search || !resetBtn || !grid) return;

  const state: State = { searchTerm: "", selectedBarrioId: null, selectedCategory: "Todas", viewMode: "barrios" };
  // Barrios que coinciden con la búsqueda actual; también los usa "Ver este sector".
  let detectedBarrios: BarrioInfo[] = [];

  const setText = (selector: string, value: string): void => {
    const el = $(selector);
    if (el) el.textContent = value;
  };
  const setHidden = (selector: string, hidden: boolean): void => {
    const el = $(selector);
    if (el) el.hidden = hidden;
  };

  function renderControls(d: Derived): void {
    $$("[data-mode-btn]").forEach((btn) => setState(btn, btn.dataset.modeBtn === state.viewMode));
    if (search!.value !== state.searchTerm) search!.value = state.searchTerm;
    setHidden("[data-search-clear]", !state.searchTerm);

    $$("[data-cat-btn]").forEach((btn) => setState(btn, btn.dataset.catBtn === state.selectedCategory));
    setHidden("[data-cat-chip]", state.selectedCategory === "Todas");
    setText("[data-cat-chip]", state.selectedCategory);
    resetBtn!.disabled = !d.hasActiveFilters;
    setState(resetBtn!, d.hasActiveFilters);

    // Banner de barrio detectado mientras se escribe.
    setHidden("[data-detected]", d.detectedBarrios.length === 0);
    setText("[data-detected-title]", d.detectedBarrios.map((b) => `${b.name} (${b.comuna} · ${b.zone})`).join(", "));
    setText("[data-detected-count]", String(d.filtered.length));

    // Barra de resultados.
    setText("[data-results-count]", String(d.filtered.length));
    setText("[data-results-label]", d.filtered.length === 1 ? "diplomado" : "diplomados");
    setHidden("[data-results-in]", !d.currentBarrio);
    if (d.currentBarrio) setText("[data-results-in-name]", d.currentBarrio.name);
    setHidden("[data-reset-all]", !d.hasActiveFilters);
  }

  function renderBarrios(d: Derived): void {
    setHidden("[data-barrios-panel]", state.viewMode !== "barrios");
    setHidden("[data-barrios-clear]", !state.selectedBarrioId);

    $$("[data-barrio-btn]").forEach((btn) => {
      const id = btn.dataset.barrioBtn;
      const isSelected = state.selectedBarrioId === id;
      const isDetected = d.detectedBarrios.some((db) => db.id === id);
      setVariant(btn, barrioChipVariant(isSelected, isDetected));
      const dot = btn.querySelector<HTMLElement>("[data-barrio-dot]");
      if (dot) dot.style.backgroundColor = barrioDotColor(isSelected, isDetected, btn.dataset.color ?? "");
    });

    setHidden("[data-selected-banner]", !d.currentBarrio);
    if (d.currentBarrio) {
      setText("[data-sel-name]", d.currentBarrio.name);
      setText("[data-sel-comuna]", d.currentBarrio.comuna);
      setText("[data-sel-desc]", d.currentBarrio.description);
      setText("[data-sel-count]", String(d.currentBarrio.diplomadoIds.length));
    }
  }

  function renderCards(d: Derived): void {
    setHidden("[data-empty]", d.filtered.length > 0);
    grid!.hidden = d.filtered.length === 0;

    const visibleIds = d.filtered.map((dip) => dip.id);
    const barrioName = d.currentBarrio?.name.toLowerCase() ?? "";
    $$("[data-dip]").forEach((card) => {
      const id = card.dataset.dip ?? "";
      const idx = visibleIds.indexOf(id);
      card.hidden = idx === -1;
      if (idx === -1) return;

      // Retraso de entrada escalonado por columna: (idx % 3) * 0.1 s, como en el original.
      card.dataset.delay = String((idx % 3) * 0.1);
      setState(card, Boolean(d.currentBarrio?.diplomadoIds.includes(id)));

      // Los chips de barrio se resaltan solo con un barrio seleccionado
      // (quirk del original: comparación por substring en minúsculas).
      card.querySelectorAll<HTMLElement>("[data-dip-tag]").forEach((tag) => {
        setState(tag, Boolean(state.selectedBarrioId && (tag.dataset.dipTag ?? "").includes(barrioName)));
      });
    });
  }

  function render(): void {
    const d = derive(state);
    detectedBarrios = d.detectedBarrios;
    renderControls(d);
    renderBarrios(d);
    renderCards(d);
  }

  const resetFilters = (): void => {
    state.selectedBarrioId = null;
    state.selectedCategory = "Todas";
    state.searchTerm = "";
    render();
  };

  const selectBarrio = (id: string | null): void => {
    state.selectedBarrioId = id;
    render();
  };

  // --- Eventos ---
  $$("[data-mode-btn]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.viewMode = btn.dataset.modeBtn === "todos" ? "todos" : "barrios";
      if (state.viewMode === "todos") state.selectedBarrioId = null;
      render();
    }),
  );

  search.addEventListener("input", () => {
    state.searchTerm = search.value;
    render();
  });
  $("[data-search-clear]")?.addEventListener("click", () => {
    state.searchTerm = "";
    render();
  });

  $$("[data-cat-btn]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.selectedCategory = btn.dataset.catBtn ?? "Todas";
      render();
    }),
  );
  const scroller = $("[data-cat-scroller]");
  $$("[data-cat-scroll]").forEach((btn) =>
    btn.addEventListener("click", () => {
      scroller?.scrollBy({ left: Number(btn.dataset.catScroll) * 180, behavior: "smooth" });
    }),
  );

  resetBtn.addEventListener("click", resetFilters);
  $("[data-reset-all]")?.addEventListener("click", resetFilters);
  $("[data-reset-empty]")?.addEventListener("click", resetFilters);

  $("[data-detected-go]")?.addEventListener("click", () => {
    if (!detectedBarrios.length) return;
    state.viewMode = "barrios";
    selectBarrio(detectedBarrios[0].id);
  });

  $$("[data-barrio-btn]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.barrioBtn ?? null;
      selectBarrio(state.selectedBarrioId === id ? null : id);
    }),
  );
  $("[data-barrios-clear]")?.addEventListener("click", () => selectBarrio(null));
  $("[data-sel-clear]")?.addEventListener("click", () => selectBarrio(null));

  $$("[data-empty-barrio]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.searchTerm = "";
      state.viewMode = "barrios";
      selectBarrio(btn.dataset.emptyBarrio ?? null);
    }),
  );

  render();
}
