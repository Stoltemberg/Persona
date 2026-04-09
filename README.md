# New project

Este repositorio Git tem raiz em `C:\Users\tutor\OneDrive\Documentos\New project`.

## Estrutura oficial

- `Persona/`: aplicacao principal web em React + Vite
- `Persona/src/`: frontend
- `Persona/supabase/`: migrations e Edge Functions
- `Persona/scripts/`: scripts operacionais
- `.codex/`: configuracoes locais da ferramenta, fora do escopo do produto

## Raiz de trabalho

A raiz do repositorio continua sendo esta pasta, mas a raiz da aplicacao e [`Persona/`](C:\Users\tutor\OneDrive\Documentos\New project\Persona).

Use esta convencao:

- comandos de Git: executar na raiz do repositorio
- comandos de frontend: executar em `Persona/`
- operacoes do Supabase deste projeto: executar em `Persona/`

## Fluxos comuns

Instalar dependencias do app:

```powershell
cd Persona
npm install
```

Rodar o frontend:

```powershell
cd Persona
npm run dev
```

Build local:

```powershell
cd Persona
npm run build
```

Lint:

```powershell
cd Persona
npm run lint
```

## Documentacao principal

- visao geral do app: [Persona/README.md](C:\Users\tutor\OneDrive\Documentos\New project\Persona\README.md)
- deploy e Edge Functions: [Persona/DEPLOY_INSTRUCTIONS.md](C:\Users\tutor\OneDrive\Documentos\New project\Persona\DEPLOY_INSTRUCTIONS.md)
