import { HorarioEscola } from "@/hooks/useHorarios";

export interface Horario {
  aula: number;
  turno: "manha" | "tarde";
  inicio: string;
  fim: string;
  label: string;
  isIntervalo: boolean;
}

export const horarios: Horario[] = [
  { aula: 1, turno: "manha", inicio: "07:30", fim: "08:20", label: "Aula 1", isIntervalo: false },
  { aula: 2, turno: "manha", inicio: "08:20", fim: "09:10", label: "Aula 2", isIntervalo: false },
  { aula: 0, turno: "manha", inicio: "09:10", fim: "09:30", label: "Intervalo", isIntervalo: true },
  { aula: 3, turno: "manha", inicio: "09:30", fim: "10:20", label: "Aula 3", isIntervalo: false },
  { aula: 4, turno: "manha", inicio: "10:20", fim: "11:10", label: "Aula 4", isIntervalo: false },
  { aula: 5, turno: "tarde", inicio: "13:00", fim: "13:50", label: "Aula 5", isIntervalo: false },
  { aula: 6, turno: "tarde", inicio: "13:50", fim: "14:40", label: "Aula 6", isIntervalo: false },
  { aula: 0, turno: "tarde", inicio: "14:40", fim: "15:00", label: "Intervalo", isIntervalo: true },
  { aula: 7, turno: "tarde", inicio: "15:00", fim: "15:50", label: "Aula 7", isIntervalo: false },
  { aula: 8, turno: "tarde", inicio: "15:50", fim: "16:40", label: "Aula 8", isIntervalo: false },
];

export const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export const mapHorarioToHorarioEscola = (h: Horario): Partial<HorarioEscola> => {
  return {
    nome: h.label,
    turno: h.turno as any,
    ordem: h.aula,
    hora_inicio: h.inicio,
    hora_fim: h.fim,
    tipo: h.isIntervalo ? "intervalo" : "aula",
    ativo: true
  };
};
