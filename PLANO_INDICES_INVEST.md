# Fin.SYS — Etapa: Índices Econométricos (Aba Investimentos)

> Base: `PROMPT.pdf` + implementação atual (`MarketPanel` / `GET /api/market`) + planos existentes.
>
> Objetivo: entregar um painel de **índices econométricos completo**, bonito e modular, contendo **todos os índices do PROMPT**, com **explicação longa (toggle)** e **alertas visuais** (sem popup).

## Resumo do que será feito

1. Expandir `GET /api/market` para retornar todos os índices (com cache e fallback).
2. Refatorar UI de índices na aba **Investimentos**:
   - Exibir resumo por grupos (Ouro / Moeda Global / Brasil / Digital / Bolsas)
   - Botão **Ver todos** abre um **BottomSheet** com todos os índices
   - Cada índice terá toggle com explicação longa: o que é, como interpretar e faixas.
3. Implementar **alertas visuais** (stress geopolítico) no modal.
4. Implementar **bolsas globais** (índices principais) + base para **top movers** (opcional com API key).

## Índices obrigatórios (PROMPT)

### Bloco Ouro
- XAU/USD (Gold Spot)
- SGE Gold 99.99 (Xangai) + Shanghai Premium (ágio vs XAU/USD)
- Gold/Silver Ratio
- Ouro em BRL + conversões (oz e g)

### Moeda Global
- DXY
- T10Y2Y
- M2 Money Supply

### Brasil
- USD/BRL
- Brazil CDS 5Y (bps) + faixas
- Selic Real (Selic + IPCA mês + IPCA 12m)

### Digital
- BTC/USD
- BTC Dominance

### Bolsas (extensão pedida)
- IBOV + principais índices: EUA, Inglaterra, Europa, Japão, China

## Critérios de aceite

- Modal de índices exibe todos os índices acima, agrupados, com explicações longas.
- Atualização automática + botão atualizar.
- App continua funcionando mesmo se uma fonte falhar (cache + parcial).
