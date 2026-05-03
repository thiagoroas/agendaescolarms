export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      avisos_laboratorio: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          criado_por: string | null
          data_fim: string
          data_inicio: string
          escola_id: string | null
          exibir_na_agenda: boolean | null
          exibir_no_dashboard: boolean | null
          exibir_no_modal_reserva: boolean | null
          exigir_confirmacao: boolean | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          mensagem: string
          recurso_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          data_fim: string
          data_inicio: string
          escola_id?: string | null
          exibir_na_agenda?: boolean | null
          exibir_no_dashboard?: boolean | null
          exibir_no_modal_reserva?: boolean | null
          exigir_confirmacao?: boolean | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          mensagem: string
          recurso_id?: string | null
          tipo?: string
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string
          data_inicio?: string
          escola_id?: string | null
          exibir_na_agenda?: boolean | null
          exibir_no_dashboard?: boolean | null
          exibir_no_modal_reserva?: boolean | null
          exigir_confirmacao?: boolean | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          mensagem?: string
          recurso_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_laboratorio_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_laboratorio_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
        ]
      }
      escolas: {
        Row: {
          cidade: string | null
          configuracoes: Json | null
          created_at: string | null
          estado: string | null
          id: string
          logo_url: string | null
          nome: string
          status: string | null
        }
        Insert: {
          cidade?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          status?: string | null
        }
        Update: {
          cidade?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          status?: string | null
        }
        Relationships: []
      }
      logs_auditoria: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          escola_id: string | null
          id: string
          profile_id: string | null
          registro_id: string | null
          tabela: string
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          escola_id?: string | null
          id?: string
          profile_id?: string | null
          registro_id?: string | null
          tabela: string
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          escola_id?: string | null
          id?: string
          profile_id?: string | null
          registro_id?: string | null
          tabela?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_auditoria_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          disciplinas: string[] | null
          email: string
          escola_id: string | null
          id: string
          nome: string
          papel: string
          status: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          disciplinas?: string[] | null
          email: string
          escola_id?: string | null
          id: string
          nome: string
          papel?: string
          status?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          disciplinas?: string[] | null
          email?: string
          escola_id?: string | null
          id?: string
          nome?: string
          papel?: string
          status?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos: {
        Row: {
          ativo: boolean | null
          capacidade: number | null
          cor_borda: string | null
          cor_fundo: string | null
          cor_texto: string | null
          created_at: string | null
          descricao: string | null
          escola_id: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          capacidade?: number | null
          cor_borda?: string | null
          cor_fundo?: string | null
          cor_texto?: string | null
          created_at?: string | null
          descricao?: string | null
          escola_id?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          capacidade?: number | null
          cor_borda?: string | null
          cor_fundo?: string | null
          cor_texto?: string | null
          created_at?: string | null
          descricao?: string | null
          escola_id?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "recursos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          aula: number
          created_at: string | null
          criado_por: string | null
          data: string
          disciplina: string
          escola_id: string | null
          horario: string | null
          id: string
          motivo_cancelamento: string | null
          nome_professor: string
          objetivo_pedagogico: string | null
          observacao: string | null
          profile_id: string | null
          recurso_id: string | null
          status: string
          turma: string
          updated_at: string | null
        }
        Insert: {
          aula: number
          created_at?: string | null
          criado_por?: string | null
          data: string
          disciplina: string
          escola_id?: string | null
          horario?: string | null
          id?: string
          motivo_cancelamento?: string | null
          nome_professor: string
          objetivo_pedagogico?: string | null
          observacao?: string | null
          profile_id?: string | null
          recurso_id?: string | null
          status?: string
          turma: string
          updated_at?: string | null
        }
        Update: {
          aula?: number
          created_at?: string | null
          criado_por?: string | null
          data?: string
          disciplina?: string
          escola_id?: string | null
          horario?: string | null
          id?: string
          motivo_cancelamento?: string | null
          nome_professor?: string
          objetivo_pedagogico?: string | null
          observacao?: string | null
          profile_id?: string | null
          recurso_id?: string | null
          status?: string
          turma?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
