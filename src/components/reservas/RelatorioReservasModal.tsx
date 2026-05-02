import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Reserva, Recurso, Escola } from '../data/mockData';
import { horarios } from '../data/horarios';
import { X, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RelatorioReservasModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservas: Reserva[];
  recursos: Recurso[];
  escolas: Escola[];
  selectedEscolaId?: string | null;
  periodo?: { start: Date; end: Date };
}

const RelatorioReservasModal: React.FC<RelatorioReservasModalProps> = ({
  isOpen,
  onClose,
  reservas,
  recursos,
  escolas,
  selectedEscolaId,
  periodo
}) => {
  if (!isOpen) return null;

  const escola = escolas.find(e => e.id === selectedEscolaId);
  
  const filteredReservas = useMemo(() => {
    return reservas
      .filter(r => !selectedEscolaId || r.escola_id === selectedEscolaId)
      .sort((a, b) => {
        // Sort by date, then by aula
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.aula - b.aula;
      });
  }, [reservas, selectedEscolaId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col print:shadow-none print:max-h-none print:rounded-none print:w-full">
        {/* Header - Hidden on print */}
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h2 className="text-xl font-bold text-slate-900">Relatório de Agendamentos</h2>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="default" size="sm" className="gap-2">
              <Printer size={16} /> Imprimir / PDF
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-slate-500">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Content - Scrollable on screen, full on print */}
        <div className="overflow-auto p-8 print:p-0 print:overflow-visible">
          <div className="print-container">
            {/* Report Header */}
            <div className="mb-8 border-b-2 border-slate-200 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Relatório de Agendamentos</h1>
                  <p className="text-slate-600 font-medium">{escola?.nome || 'Todas as Escolas'}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
                  {periodo && (
                    <p>Período: {format(periodo.start, 'dd/MM/yyyy')} - {format(periodo.end, 'dd/MM/yyyy')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="py-3 px-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 w-24">Data</th>
                  <th className="py-3 px-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 w-20">Aula</th>
                  <th className="py-3 px-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Recurso</th>
                  <th className="py-3 px-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Professor</th>
                  <th className="py-3 px-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Disciplina</th>
                  <th className="py-3 px-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Turma</th>
                  <th className="py-3 px-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservas.length > 0 ? (
                  filteredReservas.map((reserva) => {
                    const recurso = recursos.find(r => r.id === reserva.recurso_id);
                    const horario = horarios.find(h => h.aula === reserva.aula);
                    
                    return (
                      <tr key={reserva.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-2 text-xs font-medium text-slate-900">
                          {format(parseISO(reserva.data), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-3 px-2 text-xs text-slate-600">
                          {reserva.aula}ª Aula
                          <div className="text-[10px] text-slate-400">{horario?.inicio}</div>
                        </td>
                        <td className="py-3 px-2 text-xs font-semibold text-slate-900">
                          {recurso?.nome || 'N/A'}
                        </td>
                        <td className="py-3 px-2 text-xs text-slate-700">
                          {reserva.nome_professor}
                        </td>
                        <td className="py-3 px-2 text-xs text-slate-600">
                          {reserva.disciplina}
                        </td>
                        <td className="py-3 px-2 text-xs text-slate-600 font-medium">
                          {reserva.turma}
                        </td>
                        <td className="py-3 px-2 text-xs text-slate-500 italic max-w-[150px] truncate" title={reserva.observacoes}>
                          {reserva.observacoes || '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                      Nenhum agendamento encontrado para o filtro selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Print Footer */}
            <div className="mt-12 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center hidden print:block">
              <p>Agenda Escolar Digital - Relatório de Uso de Recursos</p>
              <p>Este documento é para fins de conferência e planejamento escolar.</p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed.inset-0, .print-container, .print-container * {
            visibility: visible;
          }
          .fixed.inset-0 {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            background: white;
          }
          .print-container {
            width: 100%;
          }
          @page {
            margin: 1.5cm;
            size: landscape;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default RelatorioReservasModal;
