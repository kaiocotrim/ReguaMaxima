<div align="center">
  <img src="./barber-cloud/public/LogoMComBorder3.png" alt="Logo da Régua Máxima" width="180" />

# Régua Máxima

Plataforma completa para gestão de barbearias, conectando clientes, barbeiros e proprietários em um único sistema.

O Régua Máxima permite descobrir barbearias, realizar agendamentos online, gerenciar serviços, equipe, caixa, avaliações, relatórios e a presença digital do estabelecimento.

## Arquitetura

```mermaid
flowchart LR
    subgraph Cliente
        USER[Cliente / Barbeiro / Proprietário]
    end

    subgraph ReguaMaxima
        APP[Next.js 16 - App Router]
        AUTH[NextAuth]
        PRISMA[Prisma 7]
    end

    subgraph Dados
        DB[(PostgreSQL - Neon)]
        STORAGE[Supabase Storage]
    end

    subgraph Serviços
        RESEND[Resend]
        OAUTH[Google / GitHub / Facebook]
    end

    USER <--> APP
    APP <--> AUTH
    APP <--> PRISMA
    PRISMA <--> DB
    APP <--> STORAGE
    APP --> RESEND
    AUTH <--> OAUTH
```

## Estrutura do repositório

```text
ReguaMaxima/
├── barber-cloud/              # Aplicação principal Next.js
│   ├── app/
│   │   ├── _actions/         # Server Actions e regras de negócio
│   │   ├── _components/      # Componentes da aplicação
│   │   ├── _emails/          # Templates de e-mail
│   │   ├── _hooks/           # Hooks reutilizáveis
│   │   ├── _lib/             # Banco, autenticação e serviços
│   │   ├── _providers/       # Providers globais
│   │   ├── admin/            # Administração de licenças
│   │   ├── api/              # Route Handlers
│   │   ├── dashboard/        # Painel da barbearia
│   │   └── barbershops/      # Descoberta e perfil das barbearias
│   │
│   ├── prisma/
│   │   ├── migrations/       # Migrações do banco
│   │   ├── schema.prisma     # Schema principal
│   │   └── seed.ts           # Dados iniciais
│   │
│   ├── public/               # Arquivos públicos
│   ├── prisma.config.ts
│   └── next.config.ts
│
├── ReguaMaximaApp/
├── README.md
└── LICENSE
```

## Principais tecnologias

| Parte | Tecnologias |
| --- | --- |
| Aplicação | Next.js 16, React 19, TypeScript |
| Interface | Tailwind CSS 4, Radix UI, Base UI, Lucide |
| Autenticação | NextAuth, Credentials, Google, GitHub e Facebook |
| Banco de dados | PostgreSQL hospedado no Neon |
| ORM | Prisma 7 com adapter Neon |
| Armazenamento | Supabase Storage |
| E-mail | Resend e React Email |
| Agenda | FullCalendar |
| Gráficos | Recharts |
| Planilhas | ExcelJS |
| Animações | Framer Motion, Motion e CSS |
| Segurança | bcrypt, autorização server-side e rate limiting |

## Funcionalidades

### Descoberta de barbearias

- Listagem de barbearias cadastradas.
- Perfil público de cada estabelecimento.
- Informações sobre serviços, equipe, localização e avaliações.
- Favoritos.
- Galeria de imagens.
- Reputação baseada em avaliações de clientes.

### Agendamentos

- Seleção de serviço.
- Seleção de barbeiro.
- Escolha de data e horário.
- Cálculo dos horários disponíveis com base na duração do serviço.
- Visualização por agenda e calendário.
- Pesquisa e filtros.
- Status de atendimento:
  - `EM_ANDAMENTO`
  - `CONCLUIDO`
  - `CANCELADO`
- Registro de comparecimento ou ausência.
- Observações do atendimento.
- Cancelamento mantendo o histórico.
- Notificações e lembretes por e-mail.
- Contato com o cliente pelo WhatsApp.

### Serviços

- Cadastro de serviços.
- Edição e exclusão.
- Nome e descrição.
- Preço.
- Duração.
- Imagem.
- Associação automática com a barbearia.

### Equipe

- Cadastro de perfil profissional.
- Busca por barbeiros.
- Convites para participar de uma barbearia.
- Aceite ou recusa de convite.
- Cancelamento de convites.
- Controle do vínculo entre barbeiro e estabelecimento.
- Portfólio individual.
- Agenda de atendimentos.
- Avaliações do profissional.

### Caixa

- Registro de entradas e saídas.
- Histórico financeiro.
- Associação de pagamentos aos atendimentos.
- Identificação do responsável pelo registro.

Formas de pagamento suportadas:

- Dinheiro.
- PIX.
- Crédito.
- Débito.
- Outras formas cadastradas.

### Avaliações

- Avaliação do barbeiro.
- Avaliação da barbearia.
- Nota.
- Comentário.
- Média das avaliações.
- Distribuição das notas.
- Exibição da reputação no perfil público.

### Perfil da barbearia

O proprietário pode configurar:

- Nome.
- Descrição.
- Endereço.
- Cidade.
- Telefone.
- Instagram.
- Horários de funcionamento.
- Logo.
- Imagem de capa.
- Galeria de fotos.
- Cor da marca.
- Latitude e longitude.
- Disponibilidade para novos agendamentos.

### Dashboard

O painel administrativo disponibiliza informações sobre:

- Agendamentos.
- Clientes.
- Barbeiros.
- Serviços.
- Caixa.
- Avaliações.
- Indicadores operacionais.
- Relatórios.

### Relatórios

- Indicadores de clientes.
- Indicadores da equipe.
- Dados de agendamentos.
- Análises operacionais.
- Exportação de agendamentos para planilhas.

### Planos e licenças

O Régua Máxima possui um sistema próprio de licenciamento.

Planos disponíveis:

- `BASIC`
- `PRO`
- `PREMIUM`

Estados possíveis de uma licença:

- `AVAILABLE`
- `CLAIMED`
- `ACTIVE`
- `REVOKED`

O sistema permite:

- Gerar licenças.
- Definir plano.
- Definir período de validade.
- Associar licença a um usuário.
- Associar licença a uma barbearia.
- Revogar licenças.
- Consultar status e vencimento.
- Armazenar as chaves protegidas por hash.

## Perfis do sistema

### Cliente

O cliente pode:

- Criar uma conta.
- Fazer login.
- Buscar barbearias.
- Visualizar serviços e profissionais.
- Agendar horários.
- Consultar os próprios agendamentos.
- Cancelar agendamentos.
- Favoritar estabelecimentos.
- Avaliar barbeiros.
- Avaliar barbearias.
- Configurar perfil e aparência.

### Barbeiro

O barbeiro pode:

- Criar perfil profissional.
- Participar de uma barbearia.
- Receber convites.
- Gerenciar portfólio.
- Consultar agenda.
- Visualizar avaliações recebidas.

### Proprietário

O proprietário possui acesso ao dashboard da barbearia e pode:

- Gerenciar agenda.
- Gerenciar serviços.
- Gerenciar barbeiros.
- Controlar o caixa.
- Consultar relatórios.
- Gerenciar o perfil público.
- Administrar imagens.
- Configurar horários.
- Controlar novos agendamentos.
- Consultar plano e licença.

### Administrador de licenças

Usuários autorizados podem:

- Gerar licenças.
- Escolher o plano.
- Definir validade.
- Consultar status.
- Revogar licenças.
- Associar licenças a usuários e barbearias.

## Banco de dados

O schema principal está localizado em:

```text
barber-cloud/prisma/schema.prisma
```

Entre as principais entidades do sistema estão:

- `User` — autenticação e dados da conta.
- `Client` — perfil do cliente.
- `Barber` — perfil profissional.
- `Barbershop` — estabelecimento.
- `BarbeshopService` — serviços da barbearia.
- `Booking` — agendamentos.
- `Payment` — pagamentos.
- `CashMovement` — movimentações do caixa.
- `Review` — avaliações dos barbeiros.
- `BarbershopReview` — avaliações das barbearias.
- `BarbershopInvite` — convites para a equipe.
- `PlanLicense` — planos e licenças.

## Pré-requisitos

Para executar o projeto localmente:

- Node.js compatível com Next.js 16.
- npm.
- PostgreSQL.
- Banco PostgreSQL no Neon ou serviço equivalente.
- Projeto Supabase para armazenamento de imagens.
- Conta no Resend.
- Credenciais OAuth dos provedores que serão utilizados.

## Variáveis de ambiente

Crie um arquivo `.env` dentro de:

```text
barber-cloud/.env
```

Nunca versione esse arquivo.

```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub OAuth
GITHUB_ID=""
GITHUB_SECRET=""

# Facebook OAuth
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""

# Supabase
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_URL=""
SUPABASE_SECRET_KEY=""

# Alternativa compatível
SUPABASE_SERVICE_ROLE_KEY=""

# Resend
RESEND_API_KEY=""

# Administração de licenças
LICENSE_ADMIN_EMAILS="administrador@exemplo.com"

# Apenas para desenvolvimento
LICENSE_PUBLIC_GENERATOR="false"
```

O `NEXTAUTH_SECRET` deve ser gerado utilizando uma fonte criptograficamente segura.

Nunca compartilhe:

- `DATABASE_URL`.
- `NEXTAUTH_SECRET`.
- Segredos OAuth.
- `SUPABASE_SECRET_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY`.
- `RESEND_API_KEY`.

## Rodando em desenvolvimento

Clone o repositório:

```bash
git clone https://github.com/kaiocotrim/ReguaMaxima.git
cd ReguaMaxima/barber-cloud
```

Instale as dependências:

```bash
npm install
```

O `postinstall` gera automaticamente o Prisma Client.

Configure o arquivo:

```text
.env
```

Depois prepare o banco de dados:

```bash
npx prisma generate
npx prisma migrate deploy
```

Opcionalmente, carregue os dados iniciais:

```bash
npx prisma db seed
```

Inicie o servidor:

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:3000
```

## Scripts principais

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera o Prisma Client e cria o build de produção |
| `npm run start` | Executa o build de produção |
| `npm run lint` | Executa o ESLint |
| `npm run postinstall` | Gera automaticamente o Prisma Client |
| `npm run prepare` | Configura os hooks do Husky |

## Rotas principais

| Rota | Descrição |
| --- | --- |
| `/` | Página inicial e descoberta |
| `/login` | Login |
| `/barbershops` | Lista de barbearias |
| `/barbershops/[id]` | Perfil público da barbearia |
| `/appointments` | Agendamentos do cliente |
| `/favorites` | Barbearias favoritas |
| `/perfil` | Perfil do usuário |
| `/configuracoes` | Configurações da conta |
| `/ajuda` | Central de ajuda |
| `/minha-barbearia` | Criação e ativação da barbearia |
| `/dashboard` | Dashboard do proprietário |
| `/dashboard/agendamentos` | Agenda e atendimentos |
| `/dashboard/servicos` | Gestão de serviços |
| `/dashboard/barbeiros` | Gestão da equipe |
| `/dashboard/caixa` | Controle financeiro |
| `/dashboard/relatorios` | Relatórios e indicadores |
| `/dashboard/perfil` | Perfil público e avaliações |
| `/dashboard/configuracoes` | Configurações da barbearia |
| `/admin/licencas` | Administração de licenças |

## Fluxo de agendamento

```mermaid
flowchart LR
    CLIENTE[Cliente]
    BARBEARIA[Barbearia]
    SERVICO[Serviço]
    BARBEIRO[Barbeiro]
    HORARIO[Data e horário]
    BOOKING[Agendamento]
    ATENDIMENTO[Atendimento]
    PAYMENT[Pagamento]
    REVIEW[Avaliação]

    CLIENTE --> BARBEARIA
    BARBEARIA --> SERVICO
    SERVICO --> BARBEIRO
    BARBEIRO --> HORARIO
    HORARIO --> BOOKING
    BOOKING --> ATENDIMENTO
    ATENDIMENTO --> PAYMENT
    PAYMENT --> REVIEW
```

O fluxo principal funciona da seguinte forma:

1. O cliente encontra uma barbearia.
2. Seleciona um serviço.
3. Escolhe um barbeiro.
4. Escolhe data e horário.
5. O sistema cria o agendamento.
6. O atendimento aparece na agenda da barbearia.
7. O profissional realiza o atendimento.
8. O proprietário registra o pagamento.
9. A movimentação é registrada no caixa.
10. O cliente pode avaliar o profissional e a barbearia.

## Segurança

O projeto utiliza diferentes mecanismos de proteção:

- Senhas armazenadas com hash usando `bcrypt`.
- Sessões protegidas pelo NextAuth.
- Autenticação validada no servidor.
- Autorização verificada novamente em Server Actions.
- Controle de acesso às informações da barbearia.
- Área administrativa de licenças protegida.
- Chaves de licença armazenadas por hash.
- Rate limiting em operações sensíveis.
- Credenciais armazenadas em variáveis de ambiente.
- Campos sensíveis omitidos em consultas do Prisma.

## Validação antes de publicar

Execute:

```bash
npm run lint
npm run build
```

Também valide:

- Login por credenciais.
- Login com Google.
- Login com GitHub.
- Login com Facebook.
- Criação de conta.
- Criação de barbearia.
- Upload de imagens.
- Cadastro de serviços.
- Convites de barbeiros.
- Criação de agendamentos.
- Cancelamento de agendamentos.
- Conclusão de atendimentos.
- Registro de pagamentos.
- Movimentações do caixa.
- Avaliações.
- Exportação de relatórios.
- Envio de e-mails.
- Ativação de licenças.
- Expiração de licenças.
- Tema claro e escuro.
- Responsividade em dispositivos móveis.

## Publicação

Antes de publicar:

1. Configure todas as variáveis de ambiente no provedor de hospedagem.
2. Utilize PostgreSQL com SSL.
3. Execute as migrations do Prisma.
4. Configure corretamente as URLs de OAuth.
5. Configure o domínio autorizado no Supabase.
6. Configure o domínio no Resend.
7. Valide os callbacks do NextAuth.
8. Execute o build de produção.

```bash
npm run build
npm run start
```

## Experiência da aplicação

O Régua Máxima possui:

- Interface responsiva.
- Tema claro e escuro.
- Componentes acessíveis.
- Feedback visual para ações.
- Toasts e notificações.
- Animações de interface.
- Suporte a `prefers-reduced-motion`.
- Central de ajuda integrada.

## Objetivo do projeto

O Régua Máxima foi criado para centralizar a operação de uma barbearia em uma única plataforma, reduzindo controles manuais e oferecendo uma experiência moderna tanto para clientes quanto para profissionais.

A plataforma busca simplificar:

- Agendamentos.
- Gestão de clientes.
- Gestão da equipe.
- Catálogo de serviços.
- Controle financeiro.
- Reputação digital.
- Relatórios.
- Presença online.

## Licença

Consulte o arquivo:

```text
LICENSE
```

para informações sobre os termos de uso do projeto.
