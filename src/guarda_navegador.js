// src/utils/filtrosVisitas.js
const LS_KEY = 'filtrosVisitas';

const DEFAULTS = {
  sede: null,
  estado: 'todos',
  date: null,
  zona: 'TODAS',
  busca_p: ''
};

export function loadFiltros() {
  // Evita errores en SSR / tests sin window
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULTS };
  }
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    // Merge con defaults para garantizar todas las claves
    return { ...DEFAULTS, ...data };
  } catch (_) {
    return { ...DEFAULTS };
  }
}

export function saveFiltros(parciales = {}) {
  const next = { ...loadFiltros(), ...parciales };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LS_KEY, JSON.stringify(next));
    }
  } catch (_) {}
  return next;
}

export function resetFiltros() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LS_KEY, JSON.stringify(DEFAULTS));
    }
  } catch (_) {}
  return { ...DEFAULTS };
}

// Opcional: export por defecto como objeto util
export default { loadFiltros, saveFiltros, resetFiltros };
