# Persona

Aplicacao web de gestao financeira pessoal com frontend em React + Vite e backend operacional em Supabase.

## Stack

- React 19
- Vite 7
- React Router
- Framer Motion
- Tailwind CSS 4
- Supabase
- Mercado Pago

## Estrutura

- `src/`: frontend da aplicacao
- `src/app/`: composicao principal da aplicacao, router, layout e providers globais
- `src/features/auth/`: estado e regras de autenticacao
- `src/pages/`: telas e rotas principais
- `src/components/`: componentes reutilizaveis de UI e blocos de tela
- `src/lib/`: integracoes e helpers de infraestrutura
- `src/utils/`: utilitarios de formatacao e regras leves
- `public/`: arquivos publicos estaticos
- `scripts/`: scripts de apoio operacional
- `supabase/functions/`: Edge Functions
- `supabase/migrations/`: migrations SQL

## Como rodar

Instale as dependencias:

```powershell
npm install
```

Suba o ambiente de desenvolvimento:

```powershell
npm run dev
```

Build de producao:

```powershell
npm run build
```

Lint:

```powershell
npm run lint
```

## Variaveis de ambiente

Baseie seu arquivo local em [`.env.example`](C:\Users\tutor\OneDrive\Documentos\New project\Persona\.env.example).

Variaveis centrais do frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MP_PUBLIC_KEY`

Variaveis usadas em operacao, scripts e funcoes:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `MP_ACCESS_TOKEN`
- `MP_CLIENT_ID`
- `MP_CLIENT_SECRET`
- `MP_WEBHOOK_SECRET`

## Arquitetura de execucao

- O bootstrap da app acontece em [`src/main.jsx`](C:\Users\tutor\OneDrive\Documentos\New project\Persona\src\main.jsx).
- A composicao de providers fica em [`src/app/providers/AppProviders.jsx`](C:\Users\tutor\OneDrive\Documentos\New project\Persona\src\app\providers\AppProviders.jsx).
- O roteamento principal fica em [`src/app/router/AppRouter.jsx`](C:\Users\tutor\OneDrive\Documentos\New project\Persona\src\app\router\AppRouter.jsx), com lazy loading, guardas de autenticacao e transicoes.
- O layout protegido fica em [`src/app/layout/AppLayout.jsx`](C:\Users\tutor\OneDrive\Documentos\New project\Persona\src\app\layout\AppLayout.jsx).
- O estado de autenticacao fica em [`src/features/auth/useAuth.jsx`](C:\Users\tutor\OneDrive\Documentos\New project\Persona\src\features\auth\useAuth.jsx).
- A conexao com Supabase fica em [`src/lib/supabase.js`](C:\Users\tutor\OneDrive\Documentos\New project\Persona\src\lib\supabase.js).

## Deploy

- O frontend estatico esta configurado em [`render.yaml`](C:\Users\tutor\OneDrive\Documentos\New project\Persona\render.yaml).
- O deploy das Edge Functions e das migrations nao e feito pelo Render.
- Instrucoes operacionais e de hardening estao em [DEPLOY_INSTRUCTIONS.md](C:\Users\tutor\OneDrive\Documentos\New project\Persona\DEPLOY_INSTRUCTIONS.md).

## Observacoes de manutencao

- `dist/` e artefato de build local e nao deve ser tratado como codigo-fonte.
- `node_modules/` e dependencia instalada localmente e nao faz parte da estrutura logica do projeto.
- A raiz Git do repositorio esta um nivel acima desta pasta. Veja o README da raiz para o fluxo correto de trabalho.
