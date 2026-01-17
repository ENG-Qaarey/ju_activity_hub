# Fix Database URL Error

## Error: "Authentication failed for user `USER`"

This means your `DATABASE_URL` in `backend/.env` has placeholder values instead of real credentials.

## Quick Fix

### Step 1: Open your `.env` file

Open `backend/.env` in a text editor.

### Step 2: Find and Fix DATABASE_URL

**Current (WRONG):**
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE?schema=public"
```

**Correct Format:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

### Step 3: Replace with Your Actual Values

**Example 1: Default PostgreSQL setup**
```env
DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/ju_activity_hub?schema=public"
```

**Example 2: Custom user**
```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/ju_activity_hub?schema=public"
```

**Example 3: No password (not recommended)**
```env
DATABASE_URL="postgresql://postgres@localhost:5432/ju_activity_hub?schema=public"
```

### Step 4: Special Characters in Password

If your password has special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Example:**
If password is `My@Pass#123`:
```env
DATABASE_URL="postgresql://postgres:My%40Pass%23123@localhost:5432/ju_activity_hub?schema=public"
```

## Test Your Connection

After fixing the `.env` file, test it:

```bash
cd backend
npm run setup-database-url
```

Or test directly:

```bash
npm run test-db-connection
```

## Create Database (if it doesn't exist)

If you get "database does not exist" error:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ju_activity_hub;

# Exit
\q
```

## After Fixing

Once the connection works, run migrations:

```bash
cd backend
npx prisma migrate dev
```

This will create all tables in your database.

## Common Issues

### 1. Wrong Password
- Check your PostgreSQL password
- Try connecting with psql: `psql -U postgres -d ju_activity_hub`

### 2. Database Doesn't Exist
- Create it: `CREATE DATABASE ju_activity_hub;`

### 3. PostgreSQL Not Running
- Windows: Check Services (services.msc) for PostgreSQL
- Start the PostgreSQL service

### 4. Wrong Port
- Default is `5432`
- Check your PostgreSQL port if different

## Complete .env Example

```env
# Database - REPLACE WITH YOUR ACTUAL VALUES
DATABASE_URL="postgresql://postgres:your_actual_password@localhost:5432/ju_activity_hub?schema=public"

# Clerk
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_secret_here

# Server
PORT=3001
FRONTEND_URL=http://localhost:8080
```
