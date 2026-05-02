import { Escola, Usuario, Recurso, Reserva, escolas as initialEscolas, usuarios as initialUsuarios, recursos as initialRecursos, reservas as initialReservas } from "./mockData";

const STORAGE_KEYS = {
  ESCOLAS: "agenda_mock_escolas",
  USUARIOS: "agenda_mock_usuarios",
  RECURSOS: "agenda_mock_recursos",
  RESERVAS: "agenda_mock_reservas",
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const getMockEscolas = () => getFromStorage<Escola[]>(STORAGE_KEYS.ESCOLAS, initialEscolas);
export const saveMockEscolas = (data: Escola[]) => saveToStorage(STORAGE_KEYS.ESCOLAS, data);

export const getMockUsuarios = () => getFromStorage<(Usuario & { senha: string })[]>(STORAGE_KEYS.USUARIOS, initialUsuarios);
export const saveMockUsuarios = (data: (Usuario & { senha: string })[]) => saveToStorage(STORAGE_KEYS.USUARIOS, data);

export const getMockRecursos = () => getFromStorage<Recurso[]>(STORAGE_KEYS.RECURSOS, initialRecursos);
export const saveMockRecursos = (data: Recurso[]) => saveToStorage(STORAGE_KEYS.RECURSOS, data);

export const getMockReservas = () => getFromStorage<Reserva[]>(STORAGE_KEYS.RESERVAS, initialReservas);
export const saveMockReservas = (data: Reserva[]) => saveToStorage(STORAGE_KEYS.RESERVAS, data);

export const resetMockData = () => {
  localStorage.removeItem(STORAGE_KEYS.ESCOLAS);
  localStorage.removeItem(STORAGE_KEYS.USUARIOS);
  localStorage.removeItem(STORAGE_KEYS.RECURSOS);
  localStorage.removeItem(STORAGE_KEYS.RESERVAS);
  window.location.reload();
};
