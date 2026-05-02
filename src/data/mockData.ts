import { addDays, startOfWeek, format } from "date-fns";

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
  disciplinas?: string[];
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

export type ReservaStatus = "confirmada" | "cancelada" | "finalizada" | "manutencao" | "bloqueada" | "pendente" | "aprovada" | "recusada";

export interface AvisoLaboratorio {
  id: string;
  escola_id: string;
  recurso_id?: string;
  titulo: string;
  mensagem: string;
  tipo: "informativo" | "atencao" | "urgente";
  ativo: boolean;
  data_inicio: string;
  data_fim: string;
  hora_inicio?: string;
  hora_fim?: string;
  exibir_na_agenda: boolean;
  exibir_no_modal_reserva: boolean;
  exibir_no_dashboard: boolean;
  exigir_confirmacao: boolean;
  criado_por: string;
  criado_em: string;
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
  objetivo_pedagogico?: string;
  status: ReservaStatus;
  motivo_recusa?: string;
  criado_por?: string;
  criado_em: string;
  aviso_confirmado_id?: string;
  aviso_confirmado_em?: string;
}

export const escolas: Escola[] = [
  { id: "escola-1", nome: "E.E. 26 de Agosto", cidade: "Campo Grande", estado: "MS", status: "ativa" },
  { id: "escola-2", nome: "E.E. Maria Eliza Bocayuva Corrêa", cidade: "Campo Grande", estado: "MS", status: "ativa" },
];

export const usuarios: (Usuario & { senha: string })[] = [
  {
    id: "user-admin-thiago",
    nome: "Thiago Roas",
    email: "thiagomroas@gmail.com",
    senha: "admin123",
    escola_id: "escola-1",
    papel: "admin_plataforma",
    status: "ativo"
  },
  {
    id: "user-admin-demo",
    nome: "Admin Plataforma",
    email: "admin@escola.com",
    senha: "admin123",
    escola_id: "escola-1",
    papel: "admin_plataforma",
    status: "ativo"
  },
  {
    id: "user-lab-26",
    nome: "Admin Laboratório 26",
    email: "lab@escola.com",
    senha: "lab123",
    escola_id: "escola-1",
    papel: "admin_lab",
    status: "ativo"
  },
  {
    id: "user-prof-carlos",
    nome: "Carlos Souza",
    email: "carlos@escola.com",
    senha: "prof123",
    escola_id: "escola-1",
    papel: "professor",
    status: "ativo",
    disciplinas: ["Programação Web", "Redes"]
  },
  {
    id: "user-fernanda",
    nome: "Fernanda - Maria Eliza",
    email: "fernanda@escola.com",
    senha: "lab123",
    escola_id: "escola-2",
    papel: "admin_lab",
    status: "ativo"
  }
];

export const recursos: Recurso[] = [
  { id: "rec-1", escola_id: "escola-1", nome: "Laboratório de Informática", tipo: "laboratorio", cor_fundo: "#DBEAFE", cor_texto: "#1E40AF", cor_borda: "#93C5FD", ativo: true },
  { id: "rec-2", escola_id: "escola-1", nome: "Projetor", tipo: "projetor", cor_fundo: "#D1FAE5", cor_texto: "#065F46", cor_borda: "#6EE7B7", ativo: true },
  { id: "rec-3", escola_id: "escola-2", nome: "Laboratório 1", tipo: "laboratorio", cor_fundo: "#DBEAFE", cor_texto: "#1E40AF", cor_borda: "#93C5FD", ativo: true },
  { id: "rec-4", escola_id: "escola-2", nome: "Sala Maker", tipo: "sala", cor_fundo: "#FEF3C7", cor_texto: "#92400E", cor_borda: "#FCD34D", ativo: true },
];

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const baseDate = (day === 0 || day === 6) ? addDays(today, (8 - day) % 7) : today;
  const monday = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 5 }, (_, i) => {
    const d = addDays(monday, i);
    return format(d, "yyyy-MM-dd");
  });
}

const week = getWeekDates();

export const reservas: Reserva[] = [
  { id: "res-1", escola_id: "escola-1", recurso_id: "rec-1", professor_id: "user-prof-carlos", nome_professor: "Carlos Souza", disciplina: "Programação Web", turma: "3º A", data: week[0], turno: "manha", aula: 1, horario: "07:30 – 08:20", observacao: "Aula prática de HTML/CSS", status: "confirmada", criado_em: new Date().toISOString() },
  { id: "res-7", escola_id: "escola-2", recurso_id: "rec-3", professor_id: "user-joao", nome_professor: "João Pedro", disciplina: "Robótica", turma: "2º A", data: week[0], turno: "manha", aula: 1, horario: "07:30 – 08:20", observacao: "Montagem de Arduino", status: "confirmada", criado_em: new Date().toISOString() },
];