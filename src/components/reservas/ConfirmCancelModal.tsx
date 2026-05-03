import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ConfirmCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  loading?: boolean;
}

export const ConfirmCancelModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: ConfirmCancelModalProps) => {
  const [motivo, setMotivo] = useState("");

  const handleConfirm = async () => {
    await onConfirm(motivo);
    setMotivo("");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-slate-900">
            Confirmar cancelamento
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500">
            Tem certeza que deseja cancelar esta reserva? Ela será removida da agenda ativa, mas continuará no histórico.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-2">
          <Label htmlFor="motivo" className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Motivo do cancelamento (opcional)
          </Label>
          <Textarea
            id="motivo"
            placeholder="Ex: Aula cancelada, troca de laboratório..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="resize-none"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
            disabled={loading}
          >
            {loading ? "Cancelando..." : "Confirmar cancelamento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
