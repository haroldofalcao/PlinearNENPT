# Nutri Flow Optimizer

Sistema de otimização de nutrição parenteral com programação linear para minimizar custos enquanto atende todos os requisitos nutricionais.

## 🚀 Funcionalidades

### ✅ Gerenciamento de Fórmulas
- Cadastro manual de fórmulas
- Importação/exportação em Excel e JSON
- Edição e exclusão de fórmulas
- Filtros avançados por fabricante, via de acesso e tipo de emulsão

### 🧮 Otimização Inteligente
- Algoritmo de programação linear (LP Solver)
- Minimização de custos
- Múltiplas restrições nutricionais (calorias, proteínas, volume)
- Filtros por tipo de emulsão e via de acesso
- Custos personalizados por instituição
- Limite de número de bolsas

### 📊 Analytics & Tracking
- Tracking completo com Firebase Analytics
- Monitoramento de eventos de exportação/importação
- Tracking de criação e edição de fórmulas
- Rastreamento de otimizações executadas
- Análise de navegação entre páginas

### 📝 Histórico de Otimizações
- Armazena últimas 50 otimizações
- Visualização detalhada de resultados anteriores
- Comparação de diferentes cenários
- Exportação de relatórios

### 🧪 Testes Unitários
- 38 testes automatizados com Vitest
- Cobertura completa da lógica de negócio
- Testes para optimizer, stores e hooks
- 100% de taxa de sucesso

## Project info

**URL**: https://lovable.dev/projects/185d875c-5ff7-4bd4-82b9-72f2f1f6dd0c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/185d875c-5ff7-4bd4-82b9-72f2f1f6dd0c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 🛠️ Tecnologias

### Core
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **React 18** - Framework UI
- **Bun** - Runtime e package manager

### UI/UX
- **shadcn/ui** - Componentes React
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes primitivos acessíveis
- **Lucide React** - Ícones
- **Recharts** - Visualização de dados

### Estado e Roteamento
- **Jotai** - Gerenciamento de estado
- **React Router** - Roteamento
- **TanStack Query** - Data fetching

### Otimização e Analytics
- **javascript-lp-solver** - Programação linear
- **Firebase** - Analytics e tracking
- **XLSX** - Manipulação de planilhas Excel

### Testes
- **Vitest** - Framework de testes
- **Happy DOM** - Ambiente DOM para testes
- **Testing Library** - Utilitários de teste

## 🧪 Testes

Execute os testes unitários:

```bash
# Executar todos os testes
bun test

# Modo watch (desenvolvimento)
bun test --watch

# Interface visual
bun test:ui

# Cobertura de código
bun test:coverage
```

Veja mais detalhes em [TESTING.md](./TESTING.md)

## 🔥 Firebase Analytics

O projeto utiliza Firebase Analytics para tracking de eventos. Para configurar:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Copie `.env.example` para `.env`
3. Preencha as variáveis de ambiente com suas credenciais

Veja o guia completo em [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### Eventos Rastreados

- **Navegação**: Page views em todas as páginas
- **Fórmulas**: Export, import, criação, edição e exclusão
- **Otimizações**: Início, conclusão, falhas e visualização de detalhes

## 📚 Documentação Adicional

- [INTEGRATION_NOTES.md](./INTEGRATION_NOTES.md) - Notas de integração do sistema
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Configuração do Firebase
- [TESTING.md](./TESTING.md) - Guia de testes

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes shadcn/ui
│   ├── Layout.tsx      # Layout principal
│   ├── FormulaDialog.tsx
│   └── OptimizationHistory.tsx
├── hooks/              # Custom hooks
│   └── useOptimizer.ts # Hook de otimização
├── lib/                # Bibliotecas e utilitários
│   ├── optimizer.ts    # Motor de otimização LP
│   ├── analytics.ts    # Firebase Analytics
│   ├── firebase.ts     # Configuração Firebase
│   └── utils.ts
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── Calculator.tsx
│   ├── Formulas.tsx
│   └── Guide.tsx
├── store/              # Estado global (Jotai)
│   ├── formulas.ts
│   └── optimizationHistory.ts
├── types/              # Definições TypeScript
│   └── formula.ts
└── test/               # Configuração de testes
    └── setup.ts
```

## 🚀 Deploy

### Via Lovable

Simply open [Lovable](https://lovable.dev/projects/185d875c-5ff7-4bd4-82b9-72f2f1f6dd0c) and click on Share -> Publish.

### Build Manual

```bash
# Build para produção
bun run build

# Preview do build
bun run preview
```

## 🌐 Custom Domain

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## 📝 Licença

Este projeto foi desenvolvido para otimização de nutrição parenteral em ambientes hospitalares.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para questões e suporte, abra uma issue no repositório.
# PlinearNENPT
