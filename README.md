# Market Price Information Service - Backend

This is the backend repository for the Market Price Information Service, a system designed to collect, store, analyze, and distribute market prices for essential goods across multiple cities. It serves as the central source of truth for market data, user preferences, and authentication, supporting various clients including Web, Mobile, and WhatsApp.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express
- **API:** GraphQL (Apollo Server)
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Authentication:** Supabase Auth
- **Data Ingestion:** n8n (External)

## ✨ Features

- **GraphQL API:** Flexible and efficient data fetching for all clients.
- **Authentication & Authorization:** Secure user management using Supabase Auth with Role-Based Access Control (RBAC).
- **Market Data Management:** Comprehensive modeling for Countries, Cities, Commodities, Brands, and Price Observations.
- **User Preferences:** Granular control over notification channels (WhatsApp, SMS, Email) and frequencies.
- **Approval Workflows:** Systems for reviewing and approving data changes.
- **Audit Logging:** Track critical actions and data modifications.
- **External API Access:** Token-based access for third-party consumers.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (or yarn/pnpm)
- [PostgreSQL](https://www.postgresql.org/) (or a Supabase project)

## 🏁 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tz_backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory based on the `.env.example` template:

```bash
cp .env.example .env
```

Fill in the required environment variables:

- `PORT`: Server port (default: 4000)
- `DATABASE_URL`: Connection string for your PostgreSQL database (Prisma).
- `SUPABASE_URL`: URL of your Supabase project.
- `SUPABASE_ANON_KEY`: Supabase Anonymous Key.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key.
- `WHATSAPP_API_URL`: URL for the WhatsApp API integration.
- `WHATSAPP_API_TOKEN`: Token for WhatsApp API authentication.

### 4. Database Setup

Run the Prisma migrations to set up your database schema:

```bash
npx prisma migrate dev --name init
```

Generate the Prisma Client:

```bash
npx prisma generate
```

### 5. Running the Application

**Development Mode:**

```bash
npm run dev
```
This starts the server with `nodemon` for auto-reloading.

**Production Build:**

```bash
npm run build
npm start
```

## 📜 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the compiled application.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run format`: Formats code using Prettier.

## 📂 Project Structure

```
tz_backend/
├── prisma/              # Prisma schema and migrations
├── src/
│   ├── graphql/         # GraphQL type definitions and resolvers
│   ├── lib/             # Shared libraries and utilities (Auth, Prisma Client)
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Application entry point
├── .env.example         # Environment variables template
├── PROJECT_DOCUMENTATION.md # Detailed project documentation
└── package.json         # Project dependencies and scripts
```

## 📚 API Documentation

The API is built using GraphQL. Once the server is running (default: `http://localhost:4000`), you can access the GraphQL Playground (if enabled) or query the endpoint at `/graphql`.

Key entities include:
- `User`: User profiles and settings.
- `Commodity`: Goods and products.
- `PriceObservation`: Market price records.
- `City`: Locations for price tracking.

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the ISC License.
