export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          role: string
          data_criacao: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          role?: string
          data_criacao?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          role?: string
          data_criacao?: string
        }
        Relationships: []
      }
      alunos: {
        Row: {
          id: number
          nome: string
          turma: string
          data_entrada: string
          mentor_responsavel: string
          imersao: string
          usuario_id: string | null
        }
        Insert: {
          id?: number
          nome: string
          turma: string
          data_entrada: string
          mentor_responsavel: string
          imersao: string
          usuario_id?: string | null
        }
        Update: {
          id?: number
          nome?: string
          turma?: string
          data_entrada?: string
          mentor_responsavel?: string
          imersao?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_alunos_usuario"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          }
        ]
      }
      dash: {
        Row: {
          id: number
          usuario_id: string | null
          nota_identidade_posicionamento: number
          nota_metodo_transformacao: number
          nota_produto_soleira: number
          nota_autoridade_conteudo: number
          nota_vendas_conversao: number
          nota_experiencia_cliente: number
          nota_operacao_equipe: number
          nota_recursos_indicadores: number
          score_final: number
          identidade_atual: string
          data_aplicacao: string
          status: string
        }
        Insert: {
          id?: number
          usuario_id?: string | null
          nota_identidade_posicionamento: number
          nota_metodo_transformacao: number
          nota_produto_soleira: number
          nota_autoridade_conteudo: number
          nota_vendas_conversao: number
          nota_experiencia_cliente: number
          nota_operacao_equipe: number
          nota_recursos_indicadores: number
          score_final: number
          identidade_atual: string
          data_aplicacao: string
          status: string
        }
        Update: {
          id?: number
          usuario_id?: string | null
          nota_identidade_posicionamento?: number
          nota_metodo_transformacao?: number
          nota_produto_soleira?: number
          nota_autoridade_conteudo?: number
          nota_vendas_conversao?: number
          nota_experiencia_cliente?: number
          nota_operacao_equipe?: number
          nota_recursos_indicadores?: number
          score_final?: number
          identidade_atual?: string
          data_aplicacao?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_dash_usuario"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          }
        ]
      }
      evento: {
        Row: {
          id: number
          nome_evento: string
          data_evento: string
          presenca: string
          participacao: string
          tarefas_realizadas: string
          feed_solicitacoes: string
          aluno_id: number | null
        }
        Insert: {
          id?: number
          nome_evento: string
          data_evento: string
          presenca: string
          participacao: string
          tarefas_realizadas: string
          feed_solicitacoes: string
          aluno_id?: number | null
        }
        Update: {
          id?: number
          nome_evento?: string
          data_evento?: string
          presenca?: string
          participacao?: string
          tarefas_realizadas?: string
          feed_solicitacoes?: string
          aluno_id?: number | null
        }
        Relationships: []
      }
      secao_mentoria: {
        Row: {
          id: number
          aluno_id: number | null
          nome_mentor: string
          data_sessao: string
          secao: number
          plano_acao: string
          tarefas: string
          objetivos_secao: string
        }
        Insert: {
          id?: number
          aluno_id?: number | null
          nome_mentor: string
          data_sessao: string
          secao: number
          plano_acao: string
          tarefas: string
          objetivos_secao: string
        }
        Update: {
          id?: number
          aluno_id?: number | null
          nome_mentor?: string
          data_sessao?: string
          secao?: number
          plano_acao?: string
          tarefas?: string
          objetivos_secao?: string
        }
        Relationships: []
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
