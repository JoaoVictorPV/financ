# Fin.SYS

Aplicativo pessoal de finanças (mobile-first) com foco em **registro rápido**, **tags**, **cartões**, **recorrências**, **investimentos**, **calendário** e **insights**.

## Rodar local

### Opção 1: via .bat (Windows)
Clique duas vezes em `RODAR_APLICATIVO.bat`.

### Opção 2: via terminal

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Deploy (Vercel)

1. Suba este repositório para o GitHub.
2. No Vercel, **Import Project** e selecione o repositório.
3. Build command: `npm run build`
4. Output: padrão do Next.js.

### Variáveis de ambiente (Supabase)

O projeto funciona offline-first sem Supabase (localforage/IndexedDB).

Para habilitar login e sincronização com Supabase, crie um `.env.local` baseado em `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Configuração no Supabase (Auth)

No seu projeto Supabase (`novofinancas`):

1. **Authentication → URL Configuration**
   - Site URL: `https://SEU-PROJETO.vercel.app`
   - Redirect URLs (adicione as duas):
     - `http://localhost:3000/auth/callback`
     - `https://SEU-PROJETO.vercel.app/auth/callback`

2. **Authentication → Providers**
   - Email: habilitado (Magic Link)

#### Variáveis no Vercel

Em **Vercel → Project → Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL` = URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon key
- `NEXT_PUBLIC_SITE_URL` = `https://SEU-PROJETO.vercel.app`

Depois clique em **Redeploy**.

## Backup

Configurações → Backup:
- Exportar JSON
- Importar JSON (substitui os dados locais)

## Planejamento completo

Veja: `PLANO_FIN_SYS.md`
