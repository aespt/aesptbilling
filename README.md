---
name: Postgres + Drizzle Next.js Starter
slug: postgres-drizzle
description: Simple Next.js template that uses a Postgres database and Drizzle as the ORM.
framework: Next.js
useCase: Starter
css: Tailwind
database: Postgres
deployUrl: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fexamples%2Ftree%2Fmain%2Fstorage%2Fpostgres-drizzle&project-name=postgres-drizzle&repository-name=postgres-drizzle&demo-title=Vercel%20Postgres%20%2B%20Drizzle%20Next.js%20Starter&demo-description=Simple%20Next.js%20template%20that%20uses%20Vercel%20Postgres%20as%20the%20database%20and%20Drizzle%20as%20the%20ORM.&demo-url=https%3A%2F%2Fpostgres-drizzle.vercel.app%2F&demo-image=https%3A%2F%2Fpostgres-drizzle.vercel.app%2Fopengraph-image.png&products=%5B%7B%22type%22%3A%22integration%22%2C%22group%22%3A%22postgres%22%7D%5D
demoUrl: https://postgres-drizzle.vercel.app/
relatedTemplates:
  - postgres-starter
  - postgres-prisma
  - postgres-kysely
---

# Postgres + Drizzle Next.js Starter

Simple Next.js template that uses a Postgres database and [Drizzle](https://github.com/drizzle-team/drizzle-orm) as the ORM.

## Demo

https://postgres-drizzle.vercel.app/

## How to Use

You can choose from one of the following two methods to use this repository:

### One-Click Deploy

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fexamples%2Ftree%2Fmain%2Fstorage%2Fpostgres-drizzle&project-name=postgres-drizzle&repository-name=postgres-drizzle&demo-title=Vercel%20Postgres%20%2B%20Drizzle%20Next.js%20Starter&demo-description=Simple%20Next.js%20template%20that%20uses%20Vercel%20Postgres%20as%20the%20database%20and%20Drizzle%20as%20the%20ORM.&demo-url=https%3A%2F%2Fpostgres-drizzle.vercel.app%2F&demo-image=https%3A%2F%2Fpostgres-drizzle.vercel.app%2Fopengraph-image.png&products=%5B%7B%22type%22%3A%22integration%22%2C%22group%22%3A%22postgres%22%7D%5D)

### Clone and Deploy

Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [pnpm](https://pnpm.io/installation) to bootstrap the example:

```bash
pnpm create next-app --example https://github.com/vercel/examples/tree/main/storage/postgres-drizzle
```

Next, run Next.js in development mode:

```bash
pnpm dev
```

Deploy it to the cloud with [Vercel](https://vercel.com/new?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples) ([Documentation](https://nextjs.org/docs/deployment)).

# AESPT Project

This project uses PostgreSQL with Drizzle ORM for database management.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the PostgreSQL database using Docker:
   ```bash
   yarn docker:up
   ```
5. Generate database migrations:
   ```bash
   yarn db:generate
   ```
6. Run database migrations:
   ```bash
   yarn db:migrate
   ```
7. Start the development server:
   ```bash
   yarn dev
   ```

## Database Management

- **Start PostgreSQL**: `yarn docker:up`
- **Stop PostgreSQL**: `yarn docker:down`
- **Generate Migrations**: `yarn db:generate`
- **Run Migrations**: `yarn db:migrate`
- **Open Drizzle Studio**: `yarn db:studio`

## PostgreSQL Access

- **Database URL**: `postgres://postgres:postgres@localhost:5432/aespt_db`
- **PgAdmin**: Access at `http://localhost:5050`
  - Email: `admin@admin.com`
  - Password: `admin`

## Schema Structure

The database schema is defined in the `lib/drizzle.ts` file, with Zod validation schemas in the `lib/schemas` directory.

Each table has its own schema file:
- `userSchema.ts`: User table schema and validation
- `productSchema.ts`: Product table schema and validation
- `categorySchema.ts`: Category table schema and validation
- `orderSchema.ts`: Order table schema and validation
- `orderItemSchema.ts`: Order item table schema and validation

All schemas include common fields:
- `createdBy`: Who created the record
- `updatedBy`: Who last updated the record
- `createdAt`: When the record was created
- `updatedAt`: When the record was last updated
