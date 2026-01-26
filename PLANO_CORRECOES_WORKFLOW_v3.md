#+#+#+#+
# Fin.SYS — Plano de Correções e Evolução de Workflow (v3)

> Documento: correções e melhorias solicitadas após uso real do app.
>
> Objetivo: corrigir bugs, melhorar o workflow e **preservar dados existentes**, mantendo alinhamento com `PLANO_FIN_SYS.md`.

---

## 1) Diagnóstico (o que está falhando hoje)

### 1.1 BottomSheet fechando ao clicar fora
- **Sintoma**: ao tocar fora do modal, ele fecha.
- **Impacto**: você perde o preenchimento, e o fluxo “rápido” vira um risco.
- **Causa técnica provável**: overlay do `BottomSheet` tem `onClick={onClose}`.

### 1.2 Saldo atual bugado
- **Sintoma**: às vezes aparece “Valor inválido” e não persiste.
- **Causa provável**:
  - o input inicia com `R$ 0,00` (string com prefixo), mas o parser atual pode falhar dependendo de formatos;
  - o salvamento é chamado no `onBlur` (pode salvar enquanto você ainda está digitando).

### 1.3 Cartões: mistura de conceitos (parcelas + transações)
- **Sintoma**: hoje “cartão” usa parcelas + marcação de fatura paga, mas compras à vista do cartão não são um módulo separado.
- **Problema de domínio**: você quer que **compras do cartão não entrem em gastos gerais**; somente o **pagamento da fatura** vira despesa geral.

### 1.4 Recorrência: comportamento atual não atende “lembrete + livro de pagamentos”
- **Sintoma**: marcar “Recorrente” na despesa só salva `is_recurring=true` (rótulo), não cria repetição futura.
- **Necessidade**:
  - criar uma recorrência que gera **lembretes por vencimento**;
  - quando você registrar o pagamento daquele mês, o lembrete deve sumir (“foi baixado”).

### 1.5 Entradas: tags e gráfico pizza
- **Sintoma**: entradas usam o mesmo TagPicker das despesas; você quer “fontes de renda” mais simples e semi-automáticas.

### 1.6 Calendário: mistura de tipos e layout desejado diferente
- **Sintoma**:
  - cores de income/expense não condizem;
  - eventos do cartão aparecem junto e você quer caixa separada;
  - recorrência deve ser **laranja**, despesas **vermelho**.

---

## 2) Regras de negócio fechadas (confirmadas por você)

### 2.1 BottomSheet
- **Nunca fecha clicando fora.**
- Fecha apenas:
  - botão “Fechar/Cancelar”; ou
  - após “Salvar”.

### 2.2 Cartões
- Compras do cartão serão **apenas internas do cartão** (não entram nos gráficos gerais).
- O impacto no financeiro geral ocorre apenas quando você registra **pagamento da fatura**, que vira uma **despesa** com a **tag do cartão**.
- A criação de compra do cartão será feita **somente dentro da área do cartão** (não pela Home).
- Tag automática do cartão: **“Cartão XXXX”** onde XXXX = últimos 4 dígitos.
- 1 tag por cartão.

### 2.3 Recorrências
- Ao marcar “Recorrente” na criação de despesa, o sistema deve criar:
  - um **template mensal**;
  - repetindo no **mesmo dia do mês**;
  - se não existir o dia (29/30/31), usar o **último dia do mês**.

#### Vencimento vs Pagamento
- Recorrentes terão **data de vencimento** (opcional; só recorrentes).
- O calendário deve exibir o evento no **vencimento**.
- Se no mês você registrar um pagamento (nova despesa) que “baixa” aquela recorrência, o lembrete (R) some e fica só o pagamento.
- Para isso, cada recorrência deve gerar uma **tag própria** (ex.: `R - Nome`) para permitir o match.

### 2.4 Entradas
- Terá um sistema de tags próprio (“fontes de renda”), separado.
- Cada nova entrada cria automaticamente uma “tag/fonte”.

### 2.5 Calendário
- Caixa A: Despesas (vermelho) + Recorrentes (laranja)
- Caixa B: Entradas (verde com variações por tag)
- Caixa C: Cartões (sempre presente):
  - lista de compras do cartão;
  - valor da última fatura
- Caixa D: Projeção numérica mantém como está.

---

## 3) Mudanças de arquitetura (para suportar o novo workflow)

### 3.1 Separar “tipos de lançamento” em 4 fluxos
Na Home, substituir o fluxo atual (2 botões + 1 modal genérico) por:

1) **Nova despesa** (tag system atual)
2) **Nova entrada** (tags de renda)
3) **Novo recorrente** (modal específico + vencimento)
4) **Cartão** (atalho para seleção do cartão; compras criadas dentro do cartão)

Cada um com modal específico para:
- reduzir campos desnecessários;
- evitar erros;
- manter clareza no que entra em gráficos gerais.

### 3.2 Modelo de dados — versão 2 (migrável)
Precisaremos evoluir o schema mantendo compatibilidade com backups atuais.

#### 3.2.1 Novas entidades (propostas)

**A) CardPurchase (novo)**
- compras do cartão (à vista e parceladas) ficam aqui.
- parcelas podem ser derivadas ou armazenadas; decidiremos pela forma mais simples.

Campos mínimos sugeridos:
- id
- credit_card_id
- date (data da compra)
- description
- amount_cents
- installments_total (opcional)
- installment_amount_cents (opcional)
- tags (tags internas de cartão)

**B) IncomeSourceTag (novo — tags de renda)**
- lista simples de “fontes” (Salário, Freelance, etc.).

**C) RecurringTemplate v2 (evolução)**
Adicionar:
- due_day_of_month (opcional)
- tag_id própria `recurring_tag_id` (ex.: `R - Aluguel`)

**D) RecurringPaymentLink (opcional)**
Para “baixar” lembrete quando um pagamento existir.
Alternativa mais simples: match por tag `R - Nome` + mês.

### 3.3 Estratégia de migração preservando dados
- Não apagar nada.
- Ao iniciar (bootstrap), aplicar migração:
  1) manter transactions existentes;
  2) para transactions com `is_recurring=true` e sem template correspondente, oferecer um “assistente de migração” (sem popup, como banner discreto) para criar templates.

---

## 4) Plano de implementação (ordem segura)

### Etapa 1 — Correções rápidas (sem quebrar domínio)
1. BottomSheet: impedir fechar ao clicar fora.
2. Saldo atual:
   - input aceitar `5000` e formatar para BRL;
   - salvar somente no botão (e opcionalmente no Enter), não no blur.
3. Configurações:
   - “Voltar” em todas as páginas de settings (incluindo Tags/Recorrências).

### Etapa 2 — Refatorar Entradas (tags próprias)
1. Criar fonte/tag automática pela descrição.
2. Pizza de entradas usar essas fontes.
3. Garantir que não mistura com tags de despesas.

### Etapa 3 — Cartões v2 (compras internas + pagamento como despesa)
1. Ao criar cartão: criar tag `Cartão XXXX` automaticamente.
2. Criar tela/modal “Detalhe do cartão” com:
   - listar compras;
   - adicionar compra;
   - ver “última fatura” e “pagar fatura”.
3. Pagamento da fatura:
   - cria uma **Transaction expense** com tag do cartão;
   - não duplica compras nos gastos gerais.

### Etapa 4 — Recorrências v2 (vencimento + baixa por pagamento)
1. Novo modal “Novo recorrente”
   - valor, descrição, tags, dia do mês, vencimento opcional.
2. Ao criar recorrência:
   - criar tag `R - Nome`.
3. Calendário:
   - mostrar vencimentos (laranja) quando não há pagamento.
   - quando existe pagamento do mês com tag `R - Nome`, ocultar o lembrete.

### Etapa 5 — Calendário (caixas e cores)
- Separar layout em caixas A/B/C/D.
- Ajustar cores.
- Tirar itens do cartão do box principal de despesas.

---

## 5) Critérios de aceite (testes manuais)

1) BottomSheet não fecha ao tocar fora.
2) Saldo:
   - digitar `5000` → vira `R$ 5.000,00` e salva.
   - reabrir app → saldo permanece.
3) Cartão:
   - criar cartão com last4 → tag `Cartão XXXX` aparece.
   - adicionar compras no cartão → não entram nos gastos do mês.
   - pagar fatura → aparece despesa com tag do cartão.
4) Recorrente:
   - criar recorrente → aparece no calendário (laranja) no vencimento.
   - criar pagamento do mês → recorrente some do calendário, fica só pagamento.
5) Entradas:
   - nova entrada cria fonte automaticamente.
   - pizza de entradas agrupa por fontes.

---

## 6) Próximos passos

1) Implementar Etapa 1 (bugs/UX) e publicar.
2) Implementar Etapa 2 (entradas).
3) Implementar Etapa 3 (cartões v2).
4) Implementar Etapa 4–5 (recorrências v2 + calendário).

> Observação: antes de qualquer migração automática de recorrências/cartões, o app deve sugerir (Config → Backup) um backup JSON manual para você ter segurança.
