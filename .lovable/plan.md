# Plano de Implementação: Tela "Saúde do Sistema"

Criarei uma página exclusiva para o Admin Plataforma monitorar a integridade da aplicação Agenda Escolar Digital, focada em diagnóstico técnico seguro.

## 1. Estrutura de Rotas e Navegação
- Criar a rota `/admin/monitoramento` em `src/App.tsx`, protegida pelo papel `admin_plataforma`.
- Atualizar `src/hooks/useNavigation.ts` para exibir o item de menu "Saúde do Sistema" apenas para `admin_plataforma`.

## 2. Página Saúde do Sistema (`src/pages/AdminSaudePage.tsx`)
- **Dashboard Técnico**: Cards com status geral (Online/Atenção/Crítico).
- **Monitoramento de Banco (Supabase)**: Teste de conexão e tabelas (`profiles`, `escolas`, `reservas`, `recursos`, `horarios_escola`, `avisos_laboratorio`).
- **Verificação de Auth**: Validação de sessão e papel de usuário.
- **Permissões (RLS)**: Exibição amigável de erros comuns (`42P17` recursão, `42501` permissão).
- **Ações**: 
    - "Atualizar diagnóstico" (executa testes novamente).
    - "Copiar relatório técnico" (copia para clipboard).
    - Toggle de atualização automática (30s).
- **Visual**: Design clean, administrativo, utilizando componentes de UI existentes.

## 3. Lógica de Diagnóstico
- Criar hook `useSaudeSistema.ts` para encapsular a lógica de verificação (consultas de leitura seguras, sem alterar dados).
- Utilizar `supabase.from(...).select(...)` com `.limit(1)` para validar tabelas.
- Testar disponibilidade de funções RPC chave sem disparar ações destrutivas.

## 4. Segurança
- Verificação rigorosa do papel `admin_plataforma` antes de renderizar qualquer conteúdo.
- Nenhuma exposição de chaves, tokens ou dados sensíveis.

## 5. Testes e Validação
- Validar acesso como `Admin Plataforma` (acesso liberado).
- Validar acesso como `Admin Lab` / `Professor` (rota bloqueada/redirecionada).
- Build garantido.

---

### Detalhes Técnicos
- Arquivos novos:
  - `src/pages/AdminSaudePage.tsx`
  - `src/hooks/useSaudeSistema.ts`
- Componentes: Card para status, Badge para cores de status (verde/amarelo/vermelho).
- Responsividade: Mobile-first.
