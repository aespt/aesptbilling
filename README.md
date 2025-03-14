# AESPT Project

A modern Next.js application with PostgreSQL database and Drizzle ORM for database management.

## Features

- **Next.js**: React framework for building web applications
- **PostgreSQL**: Powerful, open-source relational database
- **Drizzle ORM**: TypeScript ORM for SQL databases with a focus on type safety
- **Zod Validation**: Runtime type validation for your data
- **Docker**: Containerized PostgreSQL database for development
- **Tailwind CSS**: Utility-first CSS framework
- **PWA Support**: Progressive Web App capabilities for offline use and mobile installation

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

### Managing Database Schema Changes

When you need to make changes to your database schema, follow these steps:

#### Altering a Table Column

1. **Modify the model definition** in the appropriate file in `lib/models/`.

   ```typescript
   // Example: Adding a new column to the customers table
   export const CustomersTable = pgTable('customers', {
     // Existing columns...
     // Add new column:
     company_name: varchar('company_name', { length: 255 }),
   });
   ```

2. **Generate a migration**:

   ```bash
   yarn db:generate
   ```

3. **Review the generated migration file** in `drizzle/migrations/` to ensure it will make the intended changes.

4. **Apply the migration**:

   ```bash
   yarn db:migrate
   ```

5. **Update any Zod schemas** in `lib/schemas/` to match your model changes:
   ```typescript
   // Example: Update the CustomerSchema in lib/schemas/customerSchema.ts
   export const CustomerSchema = BaseSchema.extend({
     // Existing fields...
     company_name: z.string().optional(),
   });
   ```

#### Considerations for Database Changes

- **Nullable vs. Not Null**: When adding a NOT NULL column to an existing table, you must either provide a default value or ensure the table is empty.
- **Data Type Changes**: Be cautious when changing column types as it may result in data loss or conversion errors.
- **Renaming Columns**: Drizzle might interpret renaming as dropping and adding a new column, which would lose data. Use the `renameColumn` helper:

  ```typescript
  // Example migration pseudo-code
  alter('customers', table => {
    return [renameColumn(table, 'old_name', 'new_name')];
  });
  ```

- **Foreign Key Constraints**: When adding foreign keys, ensure the referenced data exists, or the migration will fail.

- **Testing Migrations**: Always test migrations on a development database before applying to production.

- **Backup**: Always back up your production database before applying migrations.

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

## Progressive Web App (PWA) Support

This application is configured as a Progressive Web App (PWA), which enables:

- **Offline Access**: Basic functionality works without an internet connection
- **Install on Device**: Can be added to home screen on mobile devices or desktop
- **App-like Experience**: Runs in a standalone window without browser UI

### PWA Configuration

The PWA functionality is implemented with:

- **Web App Manifest**: Located at `/public/manifest.json`
- **Service Worker**: Handles caching and offline functionality
- **Next-PWA**: Integration with Next.js for seamless PWA experience

### Testing PWA Features

1. Build and start the production version:

```bash
yarn build
yarn start
```

2. Open in a supported browser (Chrome/Edge recommended)
3. Use browser developer tools > Application > Service Workers to verify registration
4. Test offline functionality by disconnecting from the internet
5. Install to device by:
   - Mobile: Tap "Add to Home Screen" prompt or use browser menu
   - Desktop: Look for install icon in address bar or browser menu

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

## Password Reset Feature

The application includes a password reset feature that allows users to reset their password if they forget it. Here's how it works:

1. User clicks "Forgot password?" on the login page
2. User enters their email address
3. A reset link with a secure token is sent to their email
4. User clicks the link and is taken to a password reset page
5. User enters a new password and submits the form
6. The password is updated and the user can log in with the new password

### Setting up Gmail for Password Reset Emails

To use Gmail for sending password reset emails, you need to:

1. Update the `.env` file with your Gmail credentials:

```
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. For `EMAIL_PASSWORD`, you need to use an "App Password" rather than your regular Gmail password:

   - Go to your Google Account settings: https://myaccount.google.com/
   - Enable 2-Step Verification if you haven't already
   - Go to "Security" > "App passwords"
   - Select "Mail" as the app and "Other" as the device (name it "AESPT")
   - Copy the generated 16-character password and use it as your `EMAIL_PASSWORD`

3. Make sure `NEXT_PUBLIC_APP_URL` is set to your application's URL (use `http://localhost:3000` for local development)

### Security Notes

- Password reset tokens expire after 7 days
- Tokens can only be used once
- Passwords are securely hashed using bcrypt before storing in the database
- The API returns the same response whether an email exists or not to prevent email enumeration attacks
