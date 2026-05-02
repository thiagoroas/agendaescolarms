import { Escola, Usuario, Recurso, Reserva, AvisoLaboratorio, escolas as initialEscolas, usuarios as initialUsuarios, recursos as initialRecursos, reservas as initialReservas } from "./mockData";

// Flag to prevent clearing localStorage unless explicitly asked
const INITIALIZED_KEY = "agenda_app_initialized";

const STORAGE_KEYS = {
  ESCOLAS: "agenda_mock_escolas",
  USUARIOS: "agenda_mock_usuarios",
  RECURSOS: "agenda_mock_recursos",
  RESERVAS: "agenda_mock_reservas",
  AVISOS: "agenda_mock_avisos",
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  const isInitialized = localStorage.getItem(INITIALIZED_KEY);
  const stored = localStorage.getItem(key);
  
  // Se ainda não inicializado no navegador e não existe dado salvo, persiste o mock inicial
  if (!isInitialized && !stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    // Marca como inicializado após processar os usuários (garante persistência futura)
    if (key === STORAGE_KEYS.USUARIOS) {
      localStorage.setItem(INITIALIZED_KEY, "true");
    }
    return defaultValue;
  }
  
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

export const getMockAvisos = () => getFromStorage<AvisoLaboratorio[]>(STORAGE_KEYS.AVISOS, []);
export const saveMockAvisos = (data: AvisoLaboratorio[]) => saveToStorage(STORAGE_KEYS.AVISOS, data);

export const createMockAviso = (aviso: Omit<AvisoLaboratorio, "id" | "criado_em">) => {
  const avisos = getMockAvisos();
  const novoAviso: AvisoLaboratorio = {
    ...aviso,
    id: `aviso-${Date.now()}`,
    criado_em: new Date().toISOString()
  };
  saveMockAvisos([...avisos, novoAviso]);
  return novoAviso;
};

export const updateMockAviso = (id: string, updates: Partial<AvisoLaboratorio>) => {
  const avisos = getMockAvisos();
  const novosAvisos = avisos.map(a => a.id === id ? { ...a, ...updates } : a);
  saveMockAvisos(novosAvisos);
};

export const deleteMockAviso = (id: string) => {
  const avisos = getMockAvisos();
  saveMockAvisos(avisos.filter(a => a.id !== id));
};

export const resetMockData = () => {
  localStorage.removeItem(INITIALIZED_KEY);
  localStorage.removeItem(STORAGE_KEYS.ESCOLAS);
  localStorage.removeItem(STORAGE_KEYS.USUARIOS);
  localStorage.removeItem(STORAGE_KEYS.RECURSOS);
  localStorage.removeItem(STORAGE_KEYS.RESERVAS);
  localStorage.removeItem(STORAGE_KEYS.AVISOS);
  window.location.reload();
};
