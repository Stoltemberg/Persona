# Persona Repository

Este repositório Git tem raiz em `C:\Users\tutor\OneDrive\Documentos\New project`.

## Estrutura oficial

- `Persona/`: aplicação principal web em React + Vite
- `Persona/src/`: frontend
- `Persona/supabase/`: migrations e Edge Functions
- `Persona/scripts/`: scripts operacionais
- `.codex/`: configurações locais da ferramenta, fora do escopo do produto

## Raiz de trabalho

A raiz do repositório continua sendo esta pasta, mas a raiz operacional da aplicação é [Persona](C:\Users\tutor\OneDrive\Documentos\New project\Persona).

Use esta convenção:

- comandos de Git: executar na raiz do repositório
- comandos de frontend: executar em `Persona/`
- operações do Supabase deste projeto: executar em `Persona/`

## Fluxos comuns

Instalar dependências do app:

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

## Documentação principal

- visão geral do app: [Persona/README.md](C:\Users\tutor\OneDrive\Documentos\New project\Persona\README.md)
- deploy e Edge Functions: [Persona/DEPLOY_INSTRUCTIONS.md](C:\Users\tutor\OneDrive\Documentos\New project\Persona\DEPLOY_INSTRUCTIONS.md)
