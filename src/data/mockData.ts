export interface Escola {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  status: "ativa" | "inativa";
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  escola_id: string;
  papel: "admin_plataforma" | "admin_lab" | "professor";
  status: "ativo" | "pendente" | "bloqueado";
  disciplinas?: string[]; // Added
}

export interface Recurso {
  id: string;
  escola_id: string;
  nome: string;
  tipo: string;
  cor_fundo: string;
  cor_texto: string;
  cor_borda: string;
  ativo: boolean;
}

export interface Reserva {
  id: string;
  escola_id: string;
  recurso_id: string;
  professor_id: string;
  nome_professor: string;
  disciplina: string;
  turma: string;
  data: string; // YYYY-MM-DD
  turno: "manha" | "tarde";
  aula: number;
  horario: string;
  observacao: string;
  criado_em: string;
}

export const escolas: Escola[] = [
  { id: "escola-1", nome: "E.E. 26 de Agosto", cidade: "Campo Grande", estado: "MS", status: "ativa" },
  { id: "escola-2", nome: "E.E. Maria Eliza Bocayuva Corrêa", cidade: "Campo Grande", estado: "MS", status: "ativa" },
];

// Mock users removed as we are migrating to Supabase Auth.
// Using an empty array to avoid breaking UI components that still reference it during transition.
export const usuarios: (Usuario & { senha: string })[] = [];

export const recursos: Recurso[] = [
  { id: "rec-1", escola_id: "escola-1", nome: "Laboratório de Informática", tipo: "laboratorio", cor_fundo: "#DBEAFE", cor_texto: "#1E40AF", cor_borda: "#93C5FD", ativo: true },
  { id: "rec-2", escola_id: "escola-1", nome: "Projetor", tipo: "projetor", cor_fundo: "#D1FAE5", cor_texto: "#065F46", cor_borda: "#6EE7B7", ativo: true },
  { id: "rec-3", escola_id: "escola-2", nome: "Laboratório 1", tipo: "laboratorio", cor_fundo: "#DBEAFE", cor_texto: "#1E40AF", cor_borda: "#93C5FD", ativo: true },
  { id: "rec-4", escola_id: "escola-2", nome: "Sala Maker", tipo: "sala", cor_fundo: "#FEF3C7", cor_texto: "#92400E", cor_borda: "#FCD34D", ativo: true },
];

function getWeekDates(): string[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

const week = getWeekDates();

export const reservas: Reserva[] = [
  { id: "res-1", escola_id: "escola-1", recurso_id: "rec-1", professor_id: "user-3", nome_professor: "Carlos Souza", disciplina: "Programação Web", turma: "3º A", data: week[0], turno: "manha", aula: 1, horario: "07:30 – 08:20", observacao: "Aula prática de HTML/CSS", criado_em: new Date().toISOString() },
  { id: "res-2", escola_id: "escola-1", recurso_id: "rec-1", professor_id: "user-3", nome_professor: "Carlos Souza", disciplina: "Programação Web", turma: "3º A", data: week[0], turno: "manha", aula: 2, horario: "08:20 – 09:10", observacao: "Continuação da aula prática", criado_em: new Date().toISOString() },
  { id: "res-3", escola_id: "escola-1", recurso_id: "rec-2", professor_id: "user-4", nome_professor: "Ana Oliveira", disciplina: "Matemática", turma: "2º A", data: week[1], turno: "manha", aula: 3, horario: "09:30 – 10:20", observacao: "Apresentação sobre geometria", criado_em: new Date().toISOString() },
  { id: "res-4", escola_id: "escola-1", recurso_id: "rec-1", professor_id: "user-4", nome_professor: "Ana Oliveira", disciplina: "Ciências", turma: "1º B", data: week[2], turno: "tarde", aula: 5, horario: "13:00 – 13:50", observacao: "Pesquisa sobre ecossistemas", criado_em: new Date().toISOString() },
  { id: "res-5", escola_id: "escola-1", recurso_id: "rec-2", professor_id: "user-3", nome_professor: "Carlos Souza", disciplina: "Redes", turma: "3º A", data: week[3], turno: "manha", aula: 1, horario: "07:30 – 08:20", observacao: "", criado_em: new Date().toISOString() },
  { id: "res-6", escola_id: "escola-1", recurso_id: "rec-1", professor_id: "user-4", nome_professor: "Ana Oliveira", disciplina: "Física", turma: "2º B", data: week[4], turno: "tarde", aula: 7, horario: "15:00 – 15:50", observacao: "Simulação de circuitos", criado_em: new Date().toISOString() },
  { id: "res-7", escola_id: "escola-2", recurso_id: "rec-3", professor_id: "user-7", nome_professor: "João Pedro", disciplina: "Robótica", turma: "2º A", data: week[0], turno: "manha", aula: 1, horario: "07:30 – 08:20", observacao: "Montagem de Arduino", criado_em: new Date().toISOString() },
];
