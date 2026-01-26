# Fin.SYS — Plano de Evolução (v3)

> Este plano substitui/estende o **PLANO_FIN_SYS.md (v2)** e incorpora o workflow validado no **PLANO_CORRECOES_WORKFLOW_v3.md**.
>
> Objetivo: manter o Fin.SYS **extremamente simples de usar**, **bonito**, **mobile-first**, sem popups, com dados **100% persistentes** e sempre exportáveis via **Backup JSON**.
>
> Contexto: app pessoal (João Victor), com deploy no Vercel e repositório GitHub.

---

## 1) Estado atual do produto (o que já está implementado)

### 1.1 Stack e arquitetura
- **Next.js (App Router) + TypeScript + Tailwind**
- Estado: **Zustand**
- Persistência local: **localforage (IndexedDB)**
- Backup: export/import JSON versionado (`schemaVersion: 1`) via tela **Config → Backup**
- Deploy: Vercel (pronto)
- Auth/sync: estrutura Supabase já existe no repo (pode habilitar por env)

### 1.2 Domínio e dados
- **Transações**: despesas e entradas (em centavos)
- **Tags**: para despesas (e ainda podem ser “both”)
- **Fontes de renda**: sistema separado (`IncomeSource`) para entradas
- **Cartões v2**:
  - compras internas (`CardPurchase`) + parcelamentos (`InstallmentPlan`)
  - **pagamento da fatura** vira **despesa geral** com tag automática do cartão (`Cartão XXXX`)
- **Recorrências v2**:
  - templates mensais/semanais/anuais
  - **vencimento opcional** e tag automática `R - <Descrição>` para dar match com pagamento
- **Calendário**:
  - eventos do dia + projeção mensal
  - layout em **Caixas A/B/C/D** (despesas/recorrentes, entradas, cartões, projeção)

---

## 2) Regras de negócio (v3 — consolidado)

### 2.1 Sem popups (regra absoluta)
- Sem `alert()` / `confirm()`
- Ações destrutivas devem acontecer dentro da própria tela/modal.

### 2.2 Quatro fluxos de lançamento (Home)
A Home (Tela 1) é a tela “de corrida do dia a dia”. Por isso, o fluxo foi separado em **quatro modais específicos**:

1) **Nova despesa** (despesa normal)
- Não tem opções de recorrente/cartão.
- Campos: valor, data, descrição, tags.

2) **Nova entrada**
- Usa sistema separado de **Fontes de renda**.
- O modal explica a lógica (“Fonte” é usada nos gráficos).

3) **Nova despesa recorrente**
- Cria um `RecurringTemplate` mensal e cria automaticamente a tag **`R - <Descrição>`**.
- Campos: valor, descrição, tags, regra mensal (dia/último dia útil), vencimento opcional, início.

4) **Nova despesa no cartão**
- Lança compra interna do cartão:
  - **À vista** → `CardPurchase`
  - **Parcelado** → `InstallmentPlan`
- Explicação clara: compras do cartão **não entram** nos gastos gerais; entra apenas o pagamento da fatura.

### 2.3 Recorrência: vencimento vs pagamento
- O calendário mostra o **vencimento** do recorrente.
- Se existir uma despesa real no mesmo mês com a tag `R - <Descrição>`, o lembrete do recorrente **some**.

### 2.4 Cartões: conceito e impacto no financeiro geral
- Compras ficam dentro do módulo do cartão e no calendário (Caixa C).
- O impacto no “financeiro geral” é apenas o **pagamento da fatura**, registrado como despesa com a tag automática do cartão.

---

## 3) UX/UI (v3) — padrão visual e ergonomia

### 3.1 Princípios visuais
- Tema escuro com contraste alto
- Botões grandes (uso com uma mão)
- Formulários em **BottomSheet** (não fecha clicando fora)

### 3.2 Home — hierarquia recomendada
- Card de **Saldo atual** sempre no topo.
- Bloco **Lançamentos rápidos** com 4 botões, em ordem de uso:
  1) Nova despesa (primary)
  2) Despesa recorrente (secondary)
  3) Despesa no cartão (secondary)
  4) Nova entrada (ghost)

### 3.3 Calendário — caixas A/B/C/D
- A: Despesas (vermelho) + Recorrentes (laranja)
- B: Entradas (verde)
- C: Cartões (azul)
- D: Projeção numérica do mês

---

## 4) Persistência e segurança dos dados

### 4.1 Persistência local (obrigatória)
- Todo o estado é salvo em IndexedDB via `localforage`.
- O saldo atual é salvo em `Account.current_balance_cents` e deve ser refletido no input após reload.

### 4.2 Backup JSON
- Export: gera `fin-sys-backup-YYYY-MM-DD.json`
- Import: valida com Zod e substitui o snapshot local
- Schema é versionado e aceita campos novos como opcionais para não quebrar backups antigos.

### 4.3 Supabase (opcional / recomendado)
- Quando habilitado por env:
  - login obrigatório
  - sync multi-dispositivo
  - RLS por usuário

---

## 5) Configurações (Settings) — escopo v3

### 5.1 Botão voltar
- Todas as páginas de settings devem ter **Voltar** consistente.

### 5.2 Gerenciamento de tags
- Criar/editar/apagar tags com:
  - nome
  - tipo (despesa/entrada/ambos)
  - cor
  - ícone (texto)
- Ao apagar uma tag:
  - remover id da tag em `transactions.tags` e `recurringTemplates.tags` (regra já existente)

### 5.3 Sobre
- Texto curto, com autor, data e como usar.

---

## 6) Roadmap recomendado (próximos passos) — sem perder funcionalidades

### 6.1 Refinos de UI (alto impacto, baixo risco)
- Padronizar botões de CTA na Home e nos modais
- Melhorar o design do card de saldo (exibir “Última atualização”)
- Melhorar ícones (trocar placeholder por ícones reais, se quiser)

### 6.2 Gerenciar Fontes de renda (próxima configuração)
- Criar página `/settings/income` com CRUD de fontes
- (opcional) permitir “fundir” duas fontes

### 6.3 Melhorias de cartão
- Tags internas de cartão (`CardTag`) com UI
- Histórico de faturas (lista)
- (futuro) pagamentos parciais

### 6.4 Insights avançados
- Mais gráficos e filtros por tags/cartões/fontes
- Export de relatórios

---

## 7) Checklist de aceite (manual)

1) **Modal Nova despesa** não mostra opções “Recorrente” nem “Cartão”.
2) **Modal Nova entrada** explica o conceito de “Fonte”.
3) Home possui 4 botões e abre os 4 modais corretos.
4) Settings tem botão **Voltar**.
5) CRUD de tags funciona (criar/editar/apagar) e reflete nas transações.
6) Página Sobre contém autor e data.
7) Saldo atual persiste após atualizar/reabrir a página.

---

## 8) Arquivos e módulos importantes (onde mexer)

- Home: `src/app/(tabs)/home/page.tsx`
- Modais:
  - Despesa/Entrada: `src/features/transactions/components/TransactionFormSheet.tsx`
  - Recorrente: `src/features/recurring/components/RecurringFormSheet.tsx`
  - Cartão: `src/features/credit-cards/components/CardPurchaseFormSheet.tsx`
- Tags:
  - Picker: `src/components/tags/TagPicker.tsx`
  - Settings: `src/app/settings/tags/page.tsx`
- Persistência: `src/state/utils/localPersistence.ts`
- Store: `src/state/useAppStore.ts`
- Backup: `src/features/backup/*`

---

## 9) Observações de coerência com o v2

O `PLANO_FIN_SYS.md` (v2) ainda é válido como “visão macro” do produto.
O v3 foca na **organização do workflow real** (sem misturar conceitos):
- Despesa normal ≠ recorrente ≠ cartão ≠ entrada.

Isso reduz bugs, acelera o uso e melhora a confiabilidade dos gráficos.
