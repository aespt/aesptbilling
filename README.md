# AESPT Project

A modern Next.js application with PostgreSQL database and Drizzle ORM for database management.

## Features

- **Next.js**: React framework for building web applications
- **PostgreSQL**: Powerful, open-source relational database
- **Drizzle ORM**: TypeScript ORM for SQL databases with a focus on type safety
- **Zod Validation**: Runtime type validation for your data
- **Docker**: Containerized PostgreSQL database for development
- **Tailwind CSS**: Utility-first CSS framework

## Project Setup

1. Clone the repository
```bash
git clone https://github.com/akhilofficial4031/aespt.git
cd aespt
```

2. Install dependencies
```bash
yarn install
```

3. Copy the environment variables
```bash
cp .env.example .env
```

## Database Setup

This project uses PostgreSQL with Docker for easy setup and Drizzle ORM for database interactions.

### Starting the Database

1. Start the PostgreSQL database using Docker:
```bash
yarn docker:up
```

This will start:
- PostgreSQL database on port 5432
- PgAdmin (PostgreSQL admin tool) on port 5050

### Database Configuration

The database connection is configured in `.env` with these default settings:
```
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/aespt_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=aespt_db
```

### Database Schema & Migrations

The database schema is organized in the `lib/models` directory, with each table in its own file:
- `users.ts`: User accounts
- `customers.ts`: Customer information
- `products.ts`: Product catalog
- `invoices.ts`: Invoice records
- `invoice_items.ts`: Line items for invoices
- `vat_master.ts`: VAT rate reference data
- `gst_master.ts`: GST rate reference data

To create and update your database:

1. Generate migrations from your schema:
```bash
yarn db:generate
```

2. Apply migrations and seed initial data:
```bash
yarn db:migrate
```

3. (Optional) Browse your database with Drizzle Studio:
```bash
yarn db:studio
```

### Reset Database

If you need to reset your database to a clean state:
```bash
yarn db:reset
```

### Database Access

- **PostgreSQL**: Connect directly at `postgres://postgres:postgres@localhost:5432/aespt_db`
- **PgAdmin**: Access through your browser at `http://localhost:5050`
  - Email: `admin@admin.com`
  - Password: `admin`

## Development Workflow

1. Start the development server:
```bash
yarn dev
```

2. Run linting:
```bash
yarn lint
```

3. Format code:
```bash
yarn format
```

## Data Validation

The project uses Zod for schema validation. Schema files are in `lib/schemas/` directory:
- `baseSchema.ts`: Common fields for all entities
- `userSchema.ts`: User data validation
- `customerSchema.ts`: Customer data validation
- `productSchema.ts`: Product data validation
- And more...

## Available Commands

- **yarn dev**: Start the development server
- **yarn build**: Build for production
- **yarn start**: Run the production build
- **yarn lint**: Check code for errors
- **yarn lint:fix**: Fix linting errors
- **yarn format**: Format code with Prettier
- **yarn db:generate**: Generate database migrations
- **yarn db:push**: Push schema changes directly to database
- **yarn db:migrate**: Run migrations and seed initial data
- **yarn db:reset**: Reset database to clean state
- **yarn db:studio**: Open Drizzle Studio
- **yarn docker:up**: Start Docker containers
- **yarn docker:down**: Stop Docker containers
