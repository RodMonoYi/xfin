# X-Fin - Controle Financeiro Pessoal

Sistema completo de controle financeiro pessoal com frontend React + Vite e backend Node.js + Express.

## 🚀 Como Rodar

### Pré-requisitos
- Docker e Docker Compose instalados

### Passo a Passo

1. **Clone o repositório** (se aplicável) ou certifique-se de estar no diretório do projeto

2. **Inicie os containers:**
   ```bash
   docker compose up --build
   ```

3. **Aguarde a inicialização:**
   - O MySQL será iniciado primeiro
   - O backend aguardará o MySQL estar pronto (healthcheck)
   - As migrations do Prisma serão aplicadas automaticamente
   - O seed será executado automaticamente
   - O frontend será iniciado

4. **Acesse a aplicação:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Credenciais de Demo

Após o seed, você pode fazer login com:

- **Email:** demo@xfin.com
- **Senha:** demo123

Este usuário já possui:
- Valor inicial configurado
- Transações de exemplo
- Dívidas e recebíveis de exemplo
- Itens na lista de desejos

### Comandos Úteis

#### Ver logs dos containers
```bash
docker compose logs -f
```

#### Ver logs apenas do backend
```bash
docker compose logs -f backend
```

#### Ver logs apenas do frontend
```bash
docker compose logs -f frontend
```

#### Parar os containers
```bash
docker compose down
```

#### Parar e remover volumes (limpar banco de dados)
```bash
docker compose down -v
```

#### Reconstruir apenas um serviço
```bash
docker compose up --build backend
```

#### Acessar o shell do MySQL
```bash
docker compose exec mysql mysql -u xfin_user -pxfin_password xfin
```

#### Executar migrations manualmente (se necessário)
```bash
docker compose exec backend npx prisma migrate deploy
```

#### Executar seed manualmente (se necessário)
```bash
docker compose exec backend npx prisma db seed
```

## 📁 Estrutura do Projeto

```
x-fin/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── config/
│       ├── modules/
│       ├── middlewares/
│       └── utils/
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        ├── auth/
        ├── pages/
        ├── components/
        ├── routes/
        └── styles/
```

## 🔌 Endpoints da API

### Autenticação

#### POST /api/v1/auth/register
Registra um novo usuário.

**Payload:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

#### POST /api/v1/auth/login
Faz login do usuário.

**Payload:**
```json
{
  "email": "demo@xfin.com",
  "password": "demo123",
  "rememberMe": true
}
```

#### POST /api/v1/auth/refresh
Renova o access token usando o refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

#### POST /api/v1/auth/logout
Faz logout e invalida o refresh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET /api/v1/me
Retorna informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Onboarding

#### POST /api/v1/onboarding/initial-balance
Define o valor inicial do usuário.

**Payload:**
```json
{
  "initialBalance": 1000.50
}
```

### Dashboard

#### GET /api/v1/dashboard/summary
Retorna resumo financeiro do usuário.

### Categorias

- GET /api/v1/categories - Lista categorias
- POST /api/v1/categories - Cria categoria
- PUT /api/v1/categories/:id - Atualiza categoria
- DELETE /api/v1/categories/:id - Deleta categoria

**Payload POST/PUT:**
```json
{
  "name": "Alimentação",
  "type": "EXPENSE"
}
```

### Transações

- GET /api/v1/transactions - Lista transações (suporta query params: startDate, endDate, categoryId, type, isImportant)
- POST /api/v1/transactions - Cria transação
- PUT /api/v1/transactions/:id - Atualiza transação
- DELETE /api/v1/transactions/:id - Deleta transação

**Payload POST/PUT:**
```json
{
  "type": "EXPENSE",
  "amount": 150.00,
  "date": "2024-01-15",
  "description": "Supermercado",
  "categoryId": 1,
  "isImportant": false,
  "paymentMethod": "CARD",
  "isInstallment": false
}
```

### Ganhos Fixos

- GET /api/v1/recurring-incomes - Lista ganhos fixos
- POST /api/v1/recurring-incomes - Cria ganho fixo
- PUT /api/v1/recurring-incomes/:id - Atualiza ganho fixo
- DELETE /api/v1/recurring-incomes/:id - Deleta ganho fixo

**Payload POST/PUT:**
```json
{
  "amount": 5000.00,
  "dayOfMonth": 5,
  "startDate": "2024-01-01",
  "endDate": null,
  "active": true
}
```

### Gastos Fixos

- GET /api/v1/recurring-expenses - Lista gastos fixos
- POST /api/v1/recurring-expenses - Cria gasto fixo
- PUT /api/v1/recurring-expenses/:id - Atualiza gasto fixo
- DELETE /api/v1/recurring-expenses/:id - Deleta gasto fixo

**Payload POST/PUT:**
```json
{
  "amount": 1200.00,
  "dayOfMonth": 10,
  "startDate": "2024-01-01",
  "endDate": null,
  "active": true
}
```

### Dívidas

- GET /api/v1/debts - Lista dívidas
- POST /api/v1/debts - Cria dívida
- PUT /api/v1/debts/:id - Atualiza dívida
- DELETE /api/v1/debts/:id - Deleta dívida
- PATCH /api/v1/debts/:id/mark-paid - Marca dívida como paga

**Payload POST/PUT:**
```json
{
  "creditorName": "Banco XYZ",
  "description": "Empréstimo pessoal",
  "totalAmount": 5000.00,
  "isRecurring": false,
  "recurrence": null,
  "startDate": "2024-01-01",
  "dueDate": "2024-02-01",
  "priority": "HIGH"
}
```

### Recebíveis

- GET /api/v1/receivables - Lista recebíveis
- POST /api/v1/receivables - Cria recebível
- PUT /api/v1/receivables/:id - Atualiza recebível
- DELETE /api/v1/receivables/:id - Deleta recebível
- PATCH /api/v1/receivables/:id/mark-received - Marca recebível como recebido

**Payload POST/PUT:**
```json
{
  "debtorName": "Cliente ABC",
  "description": "Pagamento de serviço",
  "totalAmount": 2000.00,
  "dueDate": "2024-02-15"
}
```

### Lista de Desejos

- GET /api/v1/wishlist - Lista itens da lista de desejos
- POST /api/v1/wishlist - Adiciona item
- PUT /api/v1/wishlist/:id - Atualiza item
- DELETE /api/v1/wishlist/:id - Remove item

**Payload POST/PUT:**
```json
{
  "name": "Notebook novo",
  "priority": 5,
  "estimatedPrice": 3500.00,
  "utilityNote": "Para trabalho",
  "targetDate": "2024-06-01",
  "status": "PLANNED"
}
```

## 🛠️ Tecnologias

- **Frontend:** React 18, Vite, TailwindCSS, React Router, React Hook Form, Zod, Axios
- **Backend:** Node.js, Express, Prisma ORM, MySQL
- **Autenticação:** JWT (Access + Refresh tokens)
- **Infraestrutura:** Docker, Docker Compose

## 📝 Notas

- Todas as rotas (exceto auth e onboarding) requerem autenticação via JWT
- O onboarding é obrigatório após o primeiro login
- O sistema calcula automaticamente o saldo atual baseado no valor inicial + transações
- As dívidas e recebíveis podem ser marcados como pagos/recebidos
- Status de dívidas e recebíveis é atualizado automaticamente para OVERDUE quando a data passa

