# Fin.SYS — Planejamento Completo (v2 — refinado)

> Objetivo: documentar um plano **extremamente detalhado**, modular e evolutivo para o aplicativo **Fin.SYS** (uso pessoal), com interface **mobile-first (iPhone)**, deploy no **Vercel**, repositório no GitHub e foco em **organização e interpretação de dados financeiros**.
>
> Princípios: **simples, robusto, bonito, rápido**, sem “popups de confirmação”, com dados sempre **exportáveis** e **auditáveis**.

---

## 0) Decisões já fechadas (com base no refinamento)

Estas decisões já estão confirmadas e guiam todo o resto do projeto:

1. **Login obrigatório:** Sim (Supabase Auth).
2. **Uso multi-dispositivo:** Sim (**iPhone + PC**) com sincronização.
3. **Backup:** **semanal**, via **download local** (arquivo JSON).
4. **Idioma/moeda:** **PT-BR** e **BRL** apenas (por enquanto).
5. **Precisão monetária:** valores em **centavos (inteiro)**.
6. **Tags/categorias:** **tags livres**, com um conjunto de **tags padrão pré-criadas**.
7. **Recorrência:** por enquanto **marcação/análise** (sem auto-criar lançamentos “definitivos”), mas o calendário terá **projeção** mensal/por periodicidade.
8. **Parcelamento:** você informará **total e/ou nº parcelas e/ou valor da parcela** e o app completa o que faltar.
9. **Cartão:** controlar **fechamento + vencimento + pagamento** (status pago/não pago, data, valor).
10. **Saldo em conta:** **apenas valor atual manual** (sem histórico, por enquanto).
11. **Import retroativo:** **manual** (digitação).
12. **Deleção:** **deletar de verdade** (hard delete).
13. **Calendário:** foco em **projeção do mês** (entradas previstas vs despesas totais/tag vs parcelas/faturas).
14. **Índices (MVP):** USD/BRL, BTC/BRL, EUR/BRL, IBOV + bolsas principais, Ouro.
15. **Insights (Top 5):**
    - (1) gastos por tag evolutivo (selecionando tags)
    - (2) total de gastos (12 meses)
    - (3) total de entradas (12 meses)
    - (4) faturas de cartões evolutivas + tabela de gastos
    - (5) entradas - (gastos + cartão) com **impostos** e percentuais

Decisões adicionais (pormenores):

16. **Cadastro rápido (Nova despesa):** campos sempre visíveis = **valor + tags + recorrente + cartão**.
17. **Comprovantes/anexos:** não no MVP.
18. **Estornos/reembolsos:** não no MVP.
19. **Pagamento de fatura:** no MVP você paga **sempre integral** (100%).
20. **Método de pagamento (pix/débito/dinheiro):** não será foco; o módulo **Cartão** é separado e os outros métodos podem ficar implícitos.
21. **Recorrências (templates):** suportar **mensal + semanal + anual** (inclui mensal por **último dia útil**).
22. **Investimentos com histórico real:** sim — registrar “atualizações” (snapshots) para gráfico.
23. **Insights (período):** deve ser muito rápido alternar entre **último mês**, **últimos 3 meses** e **últimos 12 meses** (presets).
24. **Segurança extra além do login:** não.

Decisões adicionais (fluxo/UX):

25. **Botão principal “Nova despesa”:** abre **bottom sheet**.
26. **Seleção de tags:** chips (mais usadas) + busca (todas).
27. **Criar tag nova:** escolher **cor/ícone** no próprio fluxo (sem popup separado).
28. **Editar transação:** abrir e editar tudo.
29. **Apagar transação:** hard delete via botão **Apagar** dentro da tela de edição.
30. **Saldo em conta:** campo **sempre visível** na Tela 1.
31. **Calendário (dia):** ao clicar, mostrar **lista de eventos do dia**.
32. **Calendário (projeção):** considerar recorrentes + parcelas + entradas previstas + **bloco de fatura** separado.
33. **Investimentos (snapshot):** atualização será via **editar investimento (valor atual)** e o sistema registra snapshot.
34. **Insights (cartões):** ter duas visões: por **fatura** e por **cartão**.

---

## 1) Resumo do Produto (o que é o Fin.SYS)

O Fin.SYS será um “painel” de finanças pessoais para:

1. **Registrar** despesas e entradas (inclusive retroativo).
2. **Organizar** por **tags inteligentes** e recorrências.
3. **Controlar** cartões de crédito (parcelas, fatura, fechamento).
4. **Cadastrar** investimentos e acompanhar evolução/projeções.
5. **Analisar** dados com muitos gráficos/tabelas e tendências.

O app terá **4 telas** principais (tabs inferiores):

1) **Início (Registro)**
2) **Calendário**
3) **Investimentos**
4) **Insights (Gráficos & Tabelas)**

---

## 1.1) Escopo do MVP (primeira versão utilizável)

MVP = “o mínimo MUITO bom que já resolve seu dia a dia”.

No MVP o Fin.SYS precisa entregar com excelência:

- Cadastro de **despesa** e **entrada** (com tags e recorrência marcada)
- Cadastro de **cartão** (fechamento/vencimento) e **parcelamentos**
- Registro de **pagamento de fatura** (pago/não pago)
- **Calendário trimestral** com **projeção do mês** (entradas x despesas x parcelas)
- Tela de **Insights** com seus **Top 5 gráficos**
- Tela de **Investimentos** (cadastro + tabela + projeção simples)
- **Histórico de investimentos** (registrar atualizações para gráfico)
- Quadro de **índices do mercado (Top 5)**
- **Login obrigatório** + **sync** (iPhone + PC)
- **Backup semanal** (download JSON)

---

## 2) Objetivos e Critérios de Sucesso

### 2.1 Objetivos

- Mobile-first impecável (uso rápido na correria).
- Dados com persistência confiável (não depender só de LocalStorage).
- Exportação/backup em JSON sempre disponível.
- UI moderna (tema escuro, alto contraste, botões/letras grandes).
- Arquitetura **muito modular**, com arquivos pequenos e fáceis de manter.

### 2.2 Critérios de sucesso (práticos)

- Registrar uma despesa em **< 10s** com 1 mão.
- Ver “Gastos do mês por tag” e “Entradas do mês por tag” em pizza na tela inicial.
- Ver lista de eventos ao clicar em um dia no calendário.
- Cadastrar investimento e ver projeções básicas.
- Abrir “Insights” e filtrar gráficos por período e tags.
- Dados persistem após fechar app, limpar cache parcial etc.
- Export JSON e Import JSON funcionam sem quebrar dados.

---

## 3) Stack Recomendada (pensando em Vercel e modularidade)

### 3.1 Frontend (Vercel-friendly)

**Next.js (App Router) + TypeScript + TailwindCSS**

Por quê:
- Next.js é o “padrão ouro” no Vercel (deploy simples, rápido).
- TypeScript melhora confiabilidade (evita bugs em cálculos e filtros).
- Tailwind acelera UI mobile e mantém consistência.

### 3.2 Gráficos

- **ECharts** (muito poderoso/bonito) ou **Recharts** (mais simples).
- Para “pizza” e séries temporais: ambos servem.

Recomendação: **ECharts** (visual mais “profissional”, muitos recursos).

### 3.2.1 PWA (instalável no iPhone)

Para experiência de “app de verdade”:

- PWA com `manifest.json` + ícones
- Service Worker (cache offline básico)
- Tela inicial no iPhone (“Adicionar à Tela de Início”)

Obs.: iOS tem algumas limitações em PWA, mas para o Fin.SYS funciona bem (principalmente se o foco for web + sincronização).

### 3.3 Estado e validação

- Zustand (estado leve e simples) ou Redux Toolkit.
- Zod para validar dados (import/export, API, forms).

Recomendação: **Zustand + Zod**.

### 3.4 Persistência (barata/grátis)

Você pediu dados **em JSON bem organizados** e também “algum banco barato/grátis”.

Ponto importante: **no Vercel não dá para salvar arquivos JSON no servidor** de forma persistente (filesystem é efêmero).

Então a arquitetura ideal é:

**Offline-first + Sync**

- Local (offline): **IndexedDB** (via `localforage` ou `dexie`)
- Nuvem (sync): **Supabase (Postgres) no free tier**
- Export/backup: gerar **JSON** a qualquer momento (download)

Alternativas viáveis:
- Firebase (free) — bom, mas mais “opinativo”.
- Cloudflare D1 (barato) — ótimo, mas exige mais infra.
- Apenas local + export — serve, porém sem segurança contra perda do aparelho.

Recomendação para você: **Supabase** (login simples, DB forte, free tier bom).

### 3.5 Autenticação (uso pessoal)

Opções:
- Sem login: apenas local (mais simples, menos seguro).
- Login por email (magic link) via Supabase.
- PIN local (apenas bloqueio de tela, sem backend).

Decisão: **login obrigatório no Supabase**.

Recomendação prática:
- **Magic link por e-mail** (menos fricção, sem senha para lembrar).

---

## 3.6) Requisitos não-funcionais (qualidade)

- **Rápido no celular**: carregamento inicial leve.
- **Sem bugs de data/horário**: datas de eventos salvas como `YYYY-MM-DD`.
- **Sem arredondamento errado**: dinheiro em centavos.
- **A prova de perda de dados**: sync + backup semanal + export manual.
- **Acessibilidade**: contraste alto, botões grandes, foco visível.

---

## 4) Estratégia de Dados (JSON como “verdade” + DB como espelho)

### 4.1 Conceito central

Mesmo usando DB (Supabase), o app sempre deve:

- Trabalhar com um **modelo de dados JSON** claro e versionado.
- Permitir **Export JSON** completo e **Import JSON**.
- Manter tudo consistente por IDs e timestamps.

Isso atende seu requisito: “todos os dados gerados e alimentados deverão constar em arquivos JSON perfeitamente atualizados”.

Na prática (versão refinada):

- **Fonte do dia a dia**: Banco remoto (Supabase) + cache local.
- **JSON**: é o formato de **backup/export/import** (auditoria e portabilidade).

> Observação importante: como você quer usar em iPhone e PC, e login é obrigatório, o Supabase será a “verdade principal”.
> Ainda assim, manteremos cache local para performance e “funcionar mesmo com internet instável”.

### 4.2 Organização do “JSON de backup”

Formato: um único arquivo exportável `fin-sys-backup.json`.

Exemplo (alto nível):

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-01-25T00:00:00.000Z",
  "profile": { "currency": "BRL", "timezone": "America/Sao_Paulo" },
  "tags": [],
  "accounts": [],
  "transactions": [],
  "creditCards": [],
  "installmentPlans": [],
  "cardStatements": [],
  "cardPayments": [],
  "investments": [],
  "recurringTemplates": [],
  "marketSnapshots": []
}
```

### 4.2.1 Backup semanal (requisito)

Como web app não consegue “baixar sozinho” sem você permitir, faremos assim:

- Tela **Configurações → Backup**
  - mostra “Último backup em: …”
  - botão **Gerar backup agora**
  - lembrete visual quando passar de 7 dias (badge discreto no header)

---

### 4.3 Entidades e campos (modelo recomendado)

#### 4.3.1 Convenções (para evitar bugs)

- **IDs**: `uuid`.
- **Datas de evento**: `YYYY-MM-DD`.
- **Dinheiro**: `amountCents: number` (inteiro).
- **Time** (criação/edição): `createdAt/updatedAt` em ISO UTC.

#### 4.3.2 Tags

```ts
Tag {
  id: string;            // uuid
  name: string;          // "Aluguel", "Internet"...
  type: "expense" | "income" | "both";
  color: string;         // hex (#A855F7)
  icon?: string;         // nome de ícone (ex: lucide)
  isSystem: boolean;     // tags padrão (pré-criadas)
  createdAt: string;
  updatedAt: string;
}
```

Tags padrão (system) — **pré-criadas automaticamente**:
- Imposto de Renda
- Aluguel
- Condomínio
- Luz
- Gás
- Internet
- Telefone
- Diarista
- Recorrentes (tag “genérica”)
- Mercado
- Transporte
- Saúde
- Lazer
- Educação

Observação: você pode criar tags livres adicionais quando quiser.

#### 4.3.3 Contas (referência de saldo)

Você quer um “valor em conta corrente atual” como referência.

```ts
Account {
  id: string;
  name: string;           // "Conta Corrente"
  type: "checking" | "wallet" | "other";
  currency: "BRL";
  currentBalanceCents: number; // valor informado por você
  balanceUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

Obs.: o saldo aqui é **manual** (não é “transação”).

#### 4.3.4 Transações (despesas/entradas)

```ts
Transaction {
  id: string;
  kind: "expense" | "income";
  amountCents: number;    // sempre positivo
  currency: "BRL";
  date: string;           // YYYY-MM-DD (dia do evento)
  description: string;

  tags: string[];         // ids de Tag
  isRecurring: boolean;

  paymentMethod: "cash" | "pix" | "debit" | "credit" | "transfer";
  accountId?: string;

  // cartão de crédito (se aplicável)
  creditCardId?: string;
  installmentPlanId?: string; // link para parcelas

  createdAt: string;
  updatedAt: string;
}
```

Decisão: **sem `deletedAt`** no MVP porque você quer **deleção real**.

Ainda assim, no UX podemos oferecer “Desfazer” apenas em memória (reinsere se você clicar em até 5–8s), sem manter uma lixeira permanente.

#### 4.3.5 Cartões, Parcelamentos e Faturas

Cartão:

```ts
CreditCard {
  id: string;
  name: string;              // "Nubank", "Itaú"...
  brand?: string;            // Visa/Master (opcional)
  last4?: string;            // opcional/seguro
  statementClosingDay: number; // 1..28 (recomendado limitar)
  statementDueDay?: number;    // 1..28
  createdAt: string;
  updatedAt: string;
}
```

Parcelamento:

```ts
InstallmentPlan {
  id: string;
  creditCardId: string;
  totalAmountCents: number;
  totalInstallments: number;
  installmentAmountCents: number;
  startDate: string;          // YYYY-MM-DD da compra
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

##### 4.3.5.1 Regras de parcelamento (do seu jeito)

Você pode preencher **qualquer combinação** e o app completa:

- total + nº parcelas → calcula valor parcela
- total + valor parcela → calcula nº parcelas (arredondando e avisando se sobrar diferença)
- nº parcelas + valor parcela → calcula total

Regra de robustez (sem popup):
- o app sempre mostrará um **Resumo do parcelamento** na própria tela antes de salvar, para você revisar rapidamente.

Regras estruturais:
- Cada compra parcelada gera **um plano**.
- As “parcelas” serão **derivadas** (calculadas) ao invés de salvas como eventos duplicados.
- Para calendário/insights, geramos “eventos de parcela” **virtualmente**.

##### 4.3.5.2 Fatura e pagamento (novo)

Para controlar **pago/não pago**, criamos o conceito de “Fatura do Cartão” e “Pagamento”.

```ts
CardStatement {
  id: string;
  creditCardId: string;
  year: number;
  month: number;                 // 1..12
  closingDate: string;           // YYYY-MM-DD
  dueDate: string;               // YYYY-MM-DD
  totalAmountCents: number;      // calculado
  status: "open" | "closed" | "paid";
  createdAt: string;
  updatedAt: string;
}

CardPayment {
  id: string;
  statementId: string;
  paidAt: string;                // YYYY-MM-DD
  paidAmountCents: number;
  method?: "pix" | "debit" | "transfer";
  notes?: string;
  createdAt: string;
}
```

No MVP, o total da fatura é:
- **derivado** das compras/parcelas atribuídas ao período da fatura.

No MVP, regras do pagamento:
- você paga **100% integral**;
- o app registra `CardPayment` (data e valor);
- ao registrar pagamento, a fatura muda para `status = "paid"`.

#### 4.3.6 Investimentos

```ts
Investment {
  id: string;
  type: "tesouro" | "cdb" | "bolsa" | "poupanca" | "consorcio" | "bonus" | "misc";
  name: string;
  currentValueCents: number;
  currency: "BRL";

  expectedMonthlyRate?: number; // ex: 0.01 = 1% a.m.
  expectedAnnualRate?: number;  // ex: 0.12 = 12% a.a.
  expectedIRRate?: number;      // ex: 0.15 = 15%

  startDate?: string;
  endDate?: string;
  monthlyContribution?: number;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

##### 4.3.6.1 Histórico real (novo)

Para permitir **gráfico real de evolução**, mesmo com valores manuais, criamos uma coleção de snapshots.

```ts
InvestmentSnapshot {
  id: string;
  investmentId: string;
  date: string;              // YYYY-MM-DD
  valueCents: number;
  notes?: string;
  createdAt: string;
}
```

Regras:
- você pode lançar snapshots em qualquer periodicidade (mensal, semanal etc);
- os gráficos de investimentos podem usar:
  - **linha real** = snapshots
  - **linha projeção** = fórmula (se você tiver taxa informada)

#### 4.3.7 Recorrências (para projeções, sem “auto-criar definitivo”)

Você quer recorrentes como “tag”, mas também quer que isso apareça mês a mês na projeção.

Solução robusta e simples:

- **Transaction** = lançamento real (o que aconteceu)
- **RecurringTemplate** = modelo de gasto/entrada recorrente (para projeção)

```ts
RecurringTemplate {
  id: string;
  kind: "expense" | "income";
  amountCents: number;
  currency: "BRL";
  description: string;
  tags: string[];                // incluir tag "Recorrentes" se você quiser
  frequency: "monthly" | "weekly" | "yearly";
  dayOfMonth?: number;           // 1..28 quando monthly
  monthlyRule?: "dayOfMonth" | "lastBusinessDay";
  dayOfWeek?: number;            // 0..6 quando weekly
  startDate: string;             // YYYY-MM-DD
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

##### 4.3.7.1 Regra “último dia útil” (mensal)

Quando `monthlyRule = "lastBusinessDay"`, o app calcula para cada mês:

- se o último dia cair em **sábado**, volta para **sexta**;
- se cair em **domingo**, volta para **sexta**.

> MVP: regra simples (fim de semana). Feriados nacionais/municipais ficam para uma etapa futura (mais complexa).

Isso permite:
- calendário projetar corretamente (“o que deve acontecer”) sem criar transações falsas;
- você confirma manualmente o que de fato aconteceu.

#### 4.3.8 Market Snapshots (índices)

```ts
MarketSnapshot {
  id: string;
  dateTime: string; // ISO
  baseCurrency: "BRL";
  values: {
    usdBrl?: number;
    eurBrl?: number;
    btcUsd?: number;
    btcBrl?: number;
    selic?: number;
    ibov?: number;
    goldUsd?: number;
    oilUsd?: number;
    // ... demais
  };
  sourceMeta?: Record<string, any>;
}
```

No MVP, vamos salvar e exibir principalmente:
- `usdBrl`
- `eurBrl`
- `btcBrl`
- `ibov` (ou equivalente disponível)
- `goldUsd` e derivar `goldBrl` via USD/BRL

### 4.4 Versionamento e migrações de dados

- `schemaVersion` no backup.
- Ao importar um JSON antigo, o app roda “migrações” para a versão atual.
- Nunca quebrar o backup do passado.

---

## 5) Persistência e Sincronização (offline-first)

### 5.1 Camadas

1) **Supabase (DB principal)**: persistência e sincronização real.
2) **Cache local (IndexedDB)**: para performance e para funcionar com internet instável.
3) **Camada de domínio**: serviços de negócio + cálculos.
4) **Export/Import JSON**: backup e portabilidade.

### 5.2 Estratégia de sync (multi-dispositivo, simples e robusta)

Como você usará **iPhone e PC**, precisamos de algo consistente:

- No Supabase cada linha tem `updated_at`.
- No app, quando você edita algo, enviamos para o Supabase.
- Quando o app abre, ele puxa as mudanças recentes e atualiza o cache local.

Conflitos (raros em uso pessoal) serão resolvidos por:
- **Last write wins** (última edição vence), com base em `updated_at`.

### 5.3 Estrutura de banco (Supabase) — visão prática

Tabelas principais (todas com `user_id` e RLS):

- `tags`
- `accounts`
- `transactions`
- `credit_cards`
- `installment_plans`
- `card_statements`
- `card_payments`
- `investments`
- `recurring_templates`
- `market_snapshots`

Regra de segurança (RLS):
- cada usuário só enxerga e altera linhas onde `user_id = auth.uid()`.

---

## 6) UX/UI (dark, bonito, sem popups)

### 6.1 Regras de ouro

- Sem `alert()`, sem `confirm()`.
- Ações destrutivas:
  - deletar “de verdade” (sua escolha)
  - e (opcional) “Desfazer” por poucos segundos (reinsere imediatamente)
- Nada deve travar seu fluxo.
- Botões grandes, espaçamento bom, tipografia legível.
- Contraste alto (WCAG).

### 6.2 Layout base

- **Header fixo** (topo)
  - esquerda: logo simples + “Fin.SYS”
  - direita: ícone de “Config/Backup/Conta”
- **(Opcional) Subheader**
  - filtros rápidos do mês/semana
  - busca
- **Conteúdo scrollável**
- **Tab bar fixa** (rodapé) com 4 botões

### 6.3 Design system (tokens)

- `--bg`, `--surface`, `--text`, `--muted`, `--primary`, `--danger`, `--success`.
- Cores escuras: fundo #0B0F14, surfaces #111827/#0F172A.
- Tipografia: Inter / SF Pro fallback.
- Componentes:
  - Button (primary/secondary/ghost)
  - Card
  - Input (com teclado numérico para valores)
  - Select
  - TagChip (com cor)
  - Toast/Snackbar
  - Modal “sheet” (bottom sheet) **sem confirmação**

### 6.4 Interações mobile

- “Novo gasto” como **botão principal** (CTA) na Tela 1.
- Formulários em **bottom sheet** (fica moderno e rápido).
- Máscara de moeda BRL e validação simples.

---

## 7) Telas (regras e componentes)

### 7.1 Tela 1 — Início (Registro)

#### Objetivo
Registrar rapidamente + visão do mês/semana.

#### Blocos principais

1) **CTA Novo Gasto** (destaque)
2) CTA **Nova Entrada**
3) **Saldo Atual (manual)**
4) **Cartões: lançar compra parcelada**
5) **Tags**: seleção inteligente e criação rápida
6) Demonstrativos:
   - Tabela: **Gastos da semana**
   - Pizza: **Gastos do mês por tag**
   - Pizza: **Entradas do mês por tag**

#### Form “Nova Despesa” (mínimo necessário)

Campos sempre visíveis (decisão):

- **Valor** (obrigatório)
- **Tags** (seleção rápida)
- **Recorrente** (toggle)
- **Cartão** (toggle/seleção — ver nota abaixo)

Campos padrão (visíveis, mas simples):

- **Data** (default hoje)
- **Descrição curta** (opcional)

Mais opções (colapsado):

- Observações (texto livre curto)

Nota importante — “Cartão é um módulo separado”:

- A transação pode estar vinculada ao cartão para fins de análise, mas os controles de **fatura/fechamento/pagamento** são do módulo **Cartões**.
- Compras **parceladas** devem ser lançadas preferencialmente pelo fluxo de “Compra parcelada” (abaixo).

#### Form “Compra no cartão (parcelada)”

- Cartão (obrigatório)
- Valor total (opcional se preencher valor parcela + nº)
- Nº parcelas (opcional se preencher total + valor parcela)
- Valor parcela (opcional se preencher total + nº)
- Data da compra (default hoje)
- Tags

Regra do MVP:
- você pode preencher qualquer combinação e o app completa e mostra o resumo.

#### Regras de consistência

- `amount` sempre positivo; `kind` define se é entrada/saída.
- Sem popups. Após salvar, toast “Salvo” + opção “Desfazer”.

---

### 7.2 Tela 2 — Calendário (trimestral)

#### Objetivo
Calendário trimestral + **projeção do mês** (o que entra, o que sai, o que “vai cair” de cartão/parcelas e recorrentes).

#### Comportamento

- Mostrar **3 meses**: mês atual + 2 anteriores.
- Dias clicáveis.
- Marcar dias com eventos (bolinha/indicador por tipo).

#### Painel do “Dia Selecionado”

- Lista de eventos (despesas, entradas, parcelas, aportes).
- Cada item mostra: valor, tags, origem (cartão/conta), descrição.

#### Painel “Projeção do mês” (prioridade)

Blocos sugeridos:

1) **Resumo do mês selecionado**
   - Entradas (reais + previstas)
   - Despesas (reais + previstas)
   - Cartões (faturas/parcelas previstas)
   - Resultado estimado do mês (entradas - saídas)

2) **Quebra por tags** (top tags do mês)

3) **Cartões**
   - valor estimado da fatura do mês
   - status (pago/não pago quando aplicável)

Entradas/Despesas previstas vêm de:
- `RecurringTemplate`
- Parcelas futuras (derivadas de `InstallmentPlan`)

#### Cálculo de “fatura” por cartão

Com `statementClosingDay`, o app consegue determinar a qual fatura cada compra pertence.

Exemplo (regra):
- Compra em 10/02 com fechamento dia 20 → entra na fatura que fecha 20/02.
- Compra em 25/02 → entra na fatura que fecha 20/03.

---

### 7.3 Tela 3 — Investimentos

#### Objetivo
Cadastrar investimentos + projeções + quadro de índices.

#### Blocos

1) **Cadastrar investimento** (bottom sheet)
2) **Tabela de investimentos**
3) **Projeções** (cards)
4) **Índices de economia (atualizados)**

#### Projeções (padrão)

- Se informado `expectedMonthlyRate`, usar:
  - `FV = PV * (1 + r)^n` (sem aporte)
  - com aporte mensal `PMT`:
    - `FV = PV*(1+r)^n + PMT * [((1+r)^n - 1)/r]`
- Se informado anual, converter para mensal:
  - `r_m = (1+r_a)^(1/12) - 1`
- Imposto (simples): aplicar `expectedIRRate` sobre **ganho** projetado.

> Observação: como investimento real tem regras específicas, o app mostrará projeções como “estimativas”.

#### Índices e fontes (free, sem key quando possível)

Sugestão de fontes:
- Cotações FX (USD/BRL, EUR/BRL etc): **Banco Central (PTAX)** ou `exchangerate.host`.
- Bitcoin: **CoinGecko**.
- Selic: API/endpoint do Banco Central.
- Ibovespa / bolsas: (pode exigir fonte alternativa; alguns endpoints gratuitos têm limites).
- Ouro/Prata/Petróleo/Soja: pode exigir provedor com rate limit.

Estratégia (MVP):
- Criar um “Market Service” que busca dados e faz **cache**.
- Atualizar automaticamente a cada X minutos, com botão “Atualizar”.
- Exibir **apenas os 5 índices do MVP** (os seus):
  - USD/BRL
  - EUR/BRL
  - BTC/BRL
  - IBOV + bolsas principais (se disponível)
  - Ouro

---

### 7.4 Tela 4 — Insights (Gráficos & Tabelas)

#### Objetivo
Ser o “centro de análise” com muitos gráficos, filtros e cruzamentos.

#### Filtros globais

- Período: mês atual, últimos 3 meses, últimos 12 meses, custom.
- Tags (multi-select)
- Cartões (multi-select)
- Tipo: despesas/entradas/ambos

Presets rápidos (decisão):
- **Último mês**
- **Últimos 3 meses**
- **Últimos 12 meses**

Obs.: por padrão, podemos abrir em “Último mês” e deixar botões grandes para trocar rapidamente.

#### Gráficos — prioridades (seu Top 5)

1) **Gastos por tag evolutivo**
   - gráfico de linhas com seleção de tags

2) **Total de gastos — evolução 12 meses**
   - linha/área

3) **Total de entradas — evolução 12 meses**
   - linha/área

4) **Cartões**
   - fatura por mês (linha/barra)
   - tabela detalhada de gastos por fatura (filtrável)

5) **Saúde financeira do período**
   - `entradas - (gastos + cartão)`
   - destacar “Impostos” (tag Imposto de Renda)
   - percentuais: quanto % foi imposto, quanto % foi recorrente, etc.

#### Nota importante (saldo sem histórico)

Como você escolheu “saldo atual manual sem histórico”, os gráficos de “saldo em conta ao longo do tempo” não entram no MVP.

Se no futuro você quiser, adicionamos `AccountBalanceSnapshots` facilmente.

---

## 8) Estrutura de Pastas (modular, arquivos pequenos)

Proposta (Next.js App Router):

```
src/
  app/
    (tabs)/
      home/page.tsx
      calendar/page.tsx
      investments/page.tsx
      insights/page.tsx
    layout.tsx
    globals.css

  components/
    layout/
      AppHeader.tsx
      TabBar.tsx
      PageContainer.tsx
    ui/
      Button.tsx
      Card.tsx
      Input.tsx
      Select.tsx
      Chip.tsx
      Toast.tsx
      BottomSheet.tsx

  features/
    transactions/
      components/
      domain/
      storage/
      services/
    calendar/
    credit-cards/
    investments/
    insights/
    tags/
    market/

  lib/
    dates/
    money/
    ids/
    validation/
    analytics/

  styles/
    tokens.css

docs/
  (futuro) screenshots, decisões, etc
```

Regras internas:
- `domain/` só regras e tipos (sem UI).
- `services/` usa storage e faz cálculos.
- `components/` só UI.
- Nada de “arquivo gigante”: cada componente/serviço focado.

---

## 8.1) Páginas e rotas (padrão)

Rotas (tabs):

- `/home`
- `/calendar`
- `/investments`
- `/insights`

Rotas auxiliares (fora dos tabs, mas acessíveis pelo header):

- `/settings` (configurações)
  - `/settings/backup`
  - `/settings/tags`
  - `/settings/cards`
  - `/settings/account`
  - `/settings/recurring`
  - `/settings/about`

---

## 9) Regras de Negócio e Cálculos (clareza e zero “surpresas”)

### 9.1 Datas

- Guardar datas de transação como `YYYY-MM-DD` (string) para evitar bugs de timezone.
- Converter para Date apenas para exibir.

### 9.2 Valores

Decisão: **sempre em centavos**.

- Exemplo: R$ 10,50 → `1050`.
- Ao exibir, convertemos para `R$ 10,50`.

### 9.3 Recorrentes

No MVP:
- transação pode ter `isRecurring=true` (para análise)
- projeções do calendário vêm de `RecurringTemplate`

### 9.4 Cartão e parcelas

- Parcelas “virtuais” para calendário/insights, geradas do `InstallmentPlan`.
- Permitir “quitar antecipado” (marcar plano como encerrado).

### 9.5 Regra de atribuição de compra à fatura

Definição:

- Cada cartão tem `statementClosingDay` (dia do fechamento).
- Uma compra (ou parcela) pertence à fatura cujo **período** contém a data do evento.

Regra prática (simples e consistente):

- Se o evento ocorre **até** o dia de fechamento do mês → entra na fatura que fecha naquele mês.
- Se ocorre **depois** do dia de fechamento → entra na fatura do próximo mês.

Isso vale para:
- compras à vista no cartão
- parcelas derivadas (cada parcela tem um mês)

---

## 10) Sem Popups: padrão de confirmação (Undo)

Decisão: **hard delete**.

Padrão de UX recomendado (sem popup):

- O apagar acontece via botão **Apagar** dentro da tela de **edição** (decisão sua).
- Depois de apagar, toast “Apagado” com botão **Desfazer** por 5–8s.
  - tecnicamente o item foi apagado do banco, mas o app mantém uma cópia em memória e reinsere se você apertar “Desfazer” imediatamente.

---

## 11) Fluxos detalhados por tela (passo a passo)

### 11.1 Tela 1 — Início (Registro)

#### 11.1.1 Fluxo: Nova despesa (bottom sheet)

1) Você toca em **Nova despesa**.
2) Abre um **bottom sheet** com os campos fixos:
   - Valor (R$)
   - Tags (chips + busca)
   - Recorrente (toggle)
   - Cartão (toggle/seleção do cartão)
3) Campos padrão no mesmo sheet:
   - Data (default hoje)
   - Descrição (opcional)
4) Você toca em **Salvar**.
5) App salva e mostra toast “Salvo” com **Desfazer**.

Observações importantes:
- Se “Cartão” estiver ativado e você informar compra parcelada, o app te direciona para o fluxo correto (Compra parcelada), para não misturar.

#### 11.1.2 Fluxo: Selecionar tags (chips + busca)

1) Topo do seletor: chips das **tags mais usadas** (ex.: últimas 8).
2) Campo de busca: ao digitar, filtra tags.
3) Se não existir, aparece ação **“Criar tag ‘X’”**.

#### 11.1.3 Fluxo: Criar tag (no próprio fluxo, sem popup)

1) Você escolhe “Criar tag”.
2) Na mesma tela/sheet abre uma área de criação com:
   - Nome (pré-preenchido)
   - Cor (paleta)
   - Ícone (grade)
3) Salvar → tag fica disponível e já selecionada.

#### 11.1.4 Fluxo: Atualizar saldo (sempre visível)

1) Na Tela 1 existe um card “Saldo atual” com input.
2) Você edita o valor.
3) Ao sair do campo (blur) ou tocar em “Salvar saldo”, o app persiste e mostra um toast discreto.

---

### 11.2 Tela 2 — Calendário

#### 11.2.1 Fluxo: Selecionar um dia

1) Você toca em um dia.
2) O painel de baixo mostra **lista de eventos do dia** (mais simples):
   - despesas
   - entradas
   - parcelas do cartão (derivadas)
   - recorrências previstas (templates)

#### 11.2.2 Fluxo: Projeção do mês (principal)

Para o mês selecionado, o app monta:

- **Entradas reais** (transactions kind=income)
- **Entradas previstas** (recurringTemplates kind=income)
- **Despesas reais** (transactions kind=expense)
- **Despesas previstas** (recurringTemplates kind=expense)
- **Parcelas futuras** (derivadas de installmentPlans)
- **Bloco fatura** (por cartão):
  - total estimado da fatura (derivado)
  - vencimento
  - status (paid/open)

---

### 11.3 Tela 3 — Investimentos

#### 11.3.1 Fluxo: Atualizar investimento (editar + snapshot)

1) Você abre um investimento.
2) Edita o **valor atual**.
3) Ao salvar:
   - atualiza `Investment.currentValueCents`
   - cria `InvestmentSnapshot` com data = hoje e valor informado

---

### 11.4 Tela 4 — Insights

#### 11.4.1 Fluxo: alternar períodos rapidamente

No topo, botões grandes:

- Último mês
- Últimos 3 meses
- Últimos 12 meses

#### 11.4.2 Fluxo: Cartões — duas visões

- Visão A: **Por fatura (mês)**
  - lista faturas (mês/ano)
  - ao abrir, tabela de compras/parcelas daquele ciclo

- Visão B: **Por cartão (período)**
  - seleciona cartão
  - filtra período
  - tabela de eventos

---

## 12) Regras de validação por formulário (para evitar erro e travamento)

> Regra de UX: validação sempre inline (mensagem pequena abaixo do campo), nunca `alert()`.

### 12.1 Nova despesa

- Valor:
  - obrigatório
  - > 0
  - máximo (opcional): exibir aviso se absurdamente alto (ex: > R$ 1.000.000)
- Data:
  - obrigatório
  - formato válido `YYYY-MM-DD`
- Tags:
  - opcional, mas recomendado
- Recorrente:
  - apenas marcação (não gera template automático no MVP)
- Cartão:
  - se selecionado, exige escolher um cartão existente

### 12.2 Compra parcelada

- Cartão: obrigatório
- Pelo menos **2** dos 3 campos precisam estar preenchidos:
  - total
  - nº parcelas
  - valor parcela
- Nº parcelas:
  - inteiro
  - >= 1
  - máximo recomendado: 36 (configurável)
- Datas:
  - data da compra obrigatória

### 12.3 Criar tag

- Nome:
  - obrigatório
  - único (não permitir duplicado exato)
- Cor:
  - obrigatória (seleção em paleta)
- Ícone:
  - obrigatório (grade)

### 12.4 Atualizar saldo

- Saldo: obrigatório
- >= 0 (recomendado)

### 12.5 Editar investimento

- Nome: obrigatório
- Valor atual: obrigatório e > 0
- Ao salvar, criar snapshot automaticamente

### 12.6 Recorrências (RecurringTemplate)

- Nome/descrição: obrigatório
- Valor: obrigatório e > 0
- Frequência: obrigatório
- Se mensal:
  - ou `monthlyRule=dayOfMonth` + `dayOfMonth` obrigatório
  - ou `monthlyRule=lastBusinessDay` (sem `dayOfMonth`)
- Se semanal:
  - `dayOfWeek` obrigatório
- `startDate` obrigatório

---

## 13) Roadmap em etapas (MVP → Evolução)

### Etapa 0 — Base do projeto

- Criar Next.js + Tailwind + estrutura modular
- Layout com Header + TabBar + 4 rotas
- Design tokens (tema escuro)

Critério de aceite:
- Navegação fluida no celular e layout consistente.

### Etapa 1 — Supabase (Auth + DB) + cache local + Tags

- Supabase Auth (login obrigatório)
- Tabelas com RLS
- CRUD de tags (incluindo tags do sistema)
- CRUD de transações (despesa/entrada)
- Cache local (IndexedDB) + hidratação
- Export JSON (backup) + Import JSON

Critério:
- Dados persistem offline.

### Etapa 2 — Tela 1 completa

- Form rápido “Nova despesa” e “Nova entrada”
- Saldo manual em conta
- Tabela gastos da semana
- 2 pizzas (gastos/entradas do mês)

### Etapa 3 — Cartões e parcelas

- CRUD cartões (fechamento + vencimento)
- Lançar compra parcelada (total/nº/valor parcela)
- Cálculo de fatura por mês
- Registrar pagamento (pago/não pago)

### Etapa 4 — Calendário trimestral

- UI 3 meses
- Eventos por dia
- **Projeção do mês** (entradas previstas vs despesas por tag vs parcelas)

### Etapa 5 — Investimentos + projeções

- CRUD investimentos
- Tabela + projeções
- CRUD de snapshots (histórico real)
- Gráfico real (snapshots) + projeção (linha pontilhada)

### Etapa 6 — Índices (market)

- Serviço de fetch + cache
- Cards de indicadores (Top 5 MVP)

### Etapa 7 — Insights (gráficos avançados)

- Filtros globais
- Gráficos principais (fluxo, tags, cartões, investimentos)

### Etapa 8 — Ajustes finais de sync e confiabilidade

- Refinar estratégia de cache local
- Indicador “online/offline” discreto
- Tela de “status do sync” (última sincronização)

---

## 14) Deploy (Vercel) e Ambiente

- Projeto no GitHub → conectar no Vercel.
- Variáveis de ambiente (se usar Supabase):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 15) Segurança e Privacidade (uso pessoal)

- Evitar armazenar dados sensíveis de cartão (número completo, CVV). Só `last4` opcional.
- Se tiver login, aplicar Row Level Security (Supabase) por usuário.
- Export JSON: avisar que contém dados pessoais.

### 15.1 RLS (Supabase) — regra simples

- `SELECT/INSERT/UPDATE/DELETE` somente quando `user_id = auth.uid()`.

---

## 16) Testes e Qualidade

Recomendação:
- Unit: Vitest (cálculos, filtros, fatura)
- E2E: Playwright (fluxo de registrar despesa)
- Lint/format: ESLint + Prettier

---

## 17) Onde criar e gerenciar Recorrências (templates)

Como recorrências alimentam a **projeção** do calendário, precisamos de um lugar claro para você gerenciar.

Decisão sugerida:

- Em **Configurações → Recorrências** (nova rota: `/settings/recurring`)

Funcionalidades:

- Criar recorrência (entrada ou despesa)
- Editar/pausar recorrência
- Definir regra:
  - mensal: dia fixo OU último dia útil
  - semanal: dia da semana
  - anual: dia/mês

> O app não cria transações automáticas “definitivas” no MVP; ele só usa esses templates para projeção.

---

## 18) Próximos passos imediatos (o que eu farei quando você mandar seguir)

1) Criar o projeto **Next.js** (App Router) com Tailwind + estrutura modular.
2) Conectar **Supabase Auth** (login obrigatório).
3) Criar tabelas + RLS + primeiros CRUDs (tags, transações).
4) Implementar Tela 1 (cadastro rápido) + pizzas + tabela semanal.

Quando isso estiver pronto, eu te passo:
- como rodar local (`npm install` / `npm run dev`)
- como fazer deploy no Vercel
- como criar seu primeiro backup
