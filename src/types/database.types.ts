export type Role = 'admin' | 'vendedor'
export type Marca = 'Natura' | 'Boticário'
export type TipoProduto = 'Masculino' | 'Feminino' | 'Unissex'
export type TipoMovimentacao = 'entrada' | 'saida_manual' | 'venda' | 'ajuste' | 'estoque_inicial'
export type FormaPagamento = 'a_vista' | 'cartao' | 'fiado'
export type StatusVenda = 'pago' | 'pendente' | 'cancelada'

export interface Database {
  public: {
    Tables: {
      catalogo_produtos: {
        Row: {
          id: number
          ean: string | null
          marca: string
          nome: string
          fragrancia_linha: string | null
          tipo: string | null
          tamanho: string | null
          formato: string | null
          categoria: string | null
          confianca: string | null
          criado_em: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          role: Role
          ativo: boolean
          criado_em: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          role: Role
          ativo?: boolean
        }
        Update: Partial<{
          nome: string
          email: string
          role: Role
          ativo: boolean
        }>
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          id: number
          nome_loja: string
          endereco: string | null
          telefone_loja: string | null
          mensagem_aniversario_template: string
          logo_url: string | null
          imagem_fundo_url: string | null
          cor_primaria: string
        }
        Insert: {
          id?: number
        }
        Update: Partial<{
          nome_loja: string
          endereco: string | null
          telefone_loja: string | null
          mensagem_aniversario_template: string
          logo_url: string | null
          imagem_fundo_url: string | null
          cor_primaria: string
        }>
        Relationships: []
      }
      produtos: {
        Row: {
          id: string
          nome: string
          marca: Marca
          fragrancia_linha: string | null
          codigo_barras: string | null
          preco_custo: number
          preco_venda: number
          preco_promocional: number | null
          estoque_atual: number
          estoque_minimo: number
          foto_url: string | null
          tamanho: string | null
          tipo: TipoProduto | null
          formato: string | null
          ativo: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          nome: string
          marca: Marca
          fragrancia_linha?: string | null
          codigo_barras?: string | null
          preco_custo?: number
          preco_venda: number
          preco_promocional?: number | null
          estoque_minimo?: number
          foto_url?: string | null
          tamanho?: string | null
          tipo?: TipoProduto | null
          formato?: string | null
          ativo?: boolean
        }
        Update: Partial<{
          nome: string
          marca: Marca
          fragrancia_linha: string | null
          codigo_barras: string | null
          preco_custo: number
          preco_venda: number
          preco_promocional: number | null
          estoque_minimo: number
          foto_url: string | null
          tamanho: string | null
          tipo: TipoProduto | null
          formato: string | null
          ativo: boolean
        }>
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          id: string
          produto_id: string
          tipo: TipoMovimentacao
          quantidade: number
          motivo: string | null
          fornecedor: string | null
          venda_id: string | null
          responsavel_id: string
          positivo: boolean | null
          criado_em: string
        }
        Insert: {
          produto_id: string
          tipo: TipoMovimentacao
          quantidade: number
          motivo?: string | null
          fornecedor?: string | null
          venda_id?: string | null
          responsavel_id: string
          positivo?: boolean | null
        }
        Update: Partial<{
          motivo: string | null
          fornecedor: string | null
        }>
        Relationships: [
          {
            foreignKeyName: 'movimentacoes_estoque_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'produtos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'movimentacoes_estoque_responsavel_id_fkey'
            columns: ['responsavel_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      clientes: {
        Row: {
          id: string
          nome: string
          telefone: string
          cpf: string | null
          data_aniversario: string | null
          criado_em: string
        }
        Insert: {
          nome: string
          telefone: string
          cpf?: string | null
          data_aniversario?: string | null
        }
        Update: Partial<{
          nome: string
          telefone: string
          cpf: string | null
          data_aniversario: string | null
        }>
        Relationships: []
      }
      vendas: {
        Row: {
          id: string
          vendedor_id: string
          cliente_id: string | null
          forma_pagamento: FormaPagamento
          status: StatusVenda
          valor_total: number
          vencimento_boleto: string | null
          assinatura_url: string
          desconto: number
          valor_entrada: number
          combinacao: string | null
          criado_em: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'vendas_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendas_vendedor_id_fkey'
            columns: ['vendedor_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      itens_venda: {
        Row: {
          id: string
          venda_id: string
          produto_id: string
          quantidade: number
          preco_unitario: number
          subtotal: number
          valor_pago: number
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'itens_venda_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'produtos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'itens_venda_venda_id_fkey'
            columns: ['venda_id']
            isOneToOne: false
            referencedRelation: 'vendas'
            referencedColumns: ['id']
          },
        ]
      }
      boletos_compra: {
        Row: {
          id: string
          fornecedor: string
          descricao: string | null
          valor: number
          vencimento: string
          status: 'pendente' | 'pago'
          data_pagamento: string | null
          criado_por: string
          criado_em: string
        }
        Insert: {
          fornecedor: string
          descricao?: string | null
          valor: number
          vencimento: string
        }
        Update: Partial<{
          status: 'pendente' | 'pago'
          data_pagamento: string | null
          vencimento: string
        }>
        Relationships: []
      }
      pagamentos_fiado: {
        Row: {
          id: string
          venda_id: string
          cliente_id: string
          valor_pago: number
          registrado_por: string
          item_id: string | null
          criado_em: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'pagamentos_fiado_venda_id_fkey'
            columns: ['venda_id']
            isOneToOne: false
            referencedRelation: 'vendas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pagamentos_fiado_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      saldo_fiado_cliente: {
        Row: {
          cliente_id: string
          nome: string
          telefone: string
          saldo_devedor: number
        }
        Relationships: []
      }
      vw_vendas_admin: {
        Row: Database['public']['Tables']['vendas']['Row'] & {
          vendedor_nome: string
          cliente_nome: string | null
          cliente_telefone: string | null
        }
        Relationships: []
      }
      vw_itens_venda_admin: {
        Row: Database['public']['Tables']['itens_venda']['Row'] & {
          criado_em: string
          status: StatusVenda
          forma_pagamento: FormaPagamento
          vendedor_id: string
          produto_nome: string
          produto_marca: Marca
          produto_preco_custo: number
        }
        Relationships: []
      }
      vw_historico_vendas_cliente: {
        Row: {
          venda_id: string
          cliente_id: string
          criado_em: string
          forma_pagamento: FormaPagamento
          status: StatusVenda
          valor_total: number
          desconto: number
          valor_entrada: number
          combinacao: string | null
          vendedor_nome: string
          item_id: string
          produto_id: string
          produto_nome: string
          quantidade: number
          preco_unitario: number
          subtotal: number
          valor_pago: number
        }
        Relationships: []
      }
      vw_itens_fiado_pendente: {
        Row: {
          item_id: string
          venda_id: string
          cliente_id: string
          produto_id: string
          produto_nome: string
          produto_marca: Marca
          quantidade: number
          preco_unitario: number
          subtotal: number
          valor_pago: number
          restante: number
          venda_criado_em: string
          combinacao: string | null
        }
        Relationships: []
      }
      vw_pagamentos_fiado_admin: {
        Row: Database['public']['Tables']['pagamentos_fiado']['Row'] & {
          produto_marca: Marca | null
        }
        Relationships: []
      }
    }
    Functions: {
      criar_produto_com_estoque_inicial: {
        Args: {
          p_nome: string
          p_marca: Marca
          p_preco_venda: number
          p_estoque_inicial?: number
          p_fragrancia_linha?: string | null
          p_codigo_barras?: string | null
          p_preco_custo?: number
          p_preco_promocional?: number | null
          p_estoque_minimo?: number
          p_foto_url?: string | null
          p_tamanho?: string | null
          p_tipo?: TipoProduto | null
          p_formato?: string | null
        }
        Returns: Database['public']['Tables']['produtos']['Row']
      }
      cancelar_venda: {
        Args: {
          p_venda_id: string
          p_motivo?: string | null
        }
        Returns: Database['public']['Tables']['vendas']['Row']
      }
      registrar_ajuste_estoque: {
        Args: {
          p_produto_id: string
          p_estoque_real: number
          p_motivo?: string | null
        }
        Returns: Database['public']['Tables']['produtos']['Row']
      }
      registrar_movimentacao_estoque: {
        Args: {
          p_produto_id: string
          p_tipo: 'entrada' | 'saida_manual' | 'ajuste'
          p_quantidade: number
          p_motivo?: string | null
          p_fornecedor?: string | null
        }
        Returns: Database['public']['Tables']['movimentacoes_estoque']['Row']
      }
      finalizar_venda: {
        Args: {
          p_venda_id: string
          p_itens: { produto_id: string; quantidade: number }[]
          p_forma_pagamento: FormaPagamento
          p_cliente_id?: string | null
          p_vencimento_boleto?: string | null
          p_assinatura_url?: string | null
          p_desconto?: number
          p_valor_entrada?: number
          p_combinacao?: string | null
        }
        Returns: Database['public']['Tables']['vendas']['Row']
      }
      registrar_pagamento_fiado_itens: {
        Args: {
          p_pagamentos: { item_id: string; valor: number }[]
        }
        Returns: Database['public']['Tables']['pagamentos_fiado']['Row'][]
      }
    }
  }
}
