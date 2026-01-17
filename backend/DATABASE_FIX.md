# Fix Database Connection Error

## Error: "password authentication failed for user 'USER'"

This error means Prisma Studio can't connect to your PostgreSQL database. The `DATABASE_URL` in your `.env` file is incorrect or missing.

## Quick Fix

### Step 1: Check Your `.env` File

Open `backend/.env` and check the `DATABASE_URL`:

**Correct Format:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

**Example:**
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/ju_activity_hub?schema=public"
```

### Step 2: Common Issues

#### Issue 1: Using Placeholder Values
❌ **Wrong:**
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE?schema=public"
```

✅ **Right:**
```env
DATABASE_URL="postgresql://postgres:your_actual_password@localhost:5432/your_database_name?schema=public"
```

#### Issue 2: Missing Password
If your PostgreSQL user doesn't have a password:
```env
DATABASE_URL="postgresql://postgres@localhost:5432/ju_activity_hub?schema=public"
```

#### Issue 3: Wrong Port
Default PostgreSQL port is `5432`. Check if yours is different:
```env
DATABASE_URL="postgresql://postgres:password@localhost:YOUR_PORT/ju_activity_hub?schema=public"
```

#### Issue 4: Special Characters in Password
If your password contains special characters, URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `=` becomes `%3D`

Example:
```env
DATABASE_URL="postgresql://postgres:My%40Pass%23word@localhost:5432/ju_activity_hub?schema=public"
```

### Step 3: Test Database Connection

#### Option 1: Test with psql
```bash
psql -U postgres -h localhost -p 5432 -d your_database_name
```

#### Option 2: Create Test Script
Run the test script I created:
```bash
cd backend
npm run test-db-connection
```

## Default PostgreSQL Setup

If you haven't set up PostgreSQL yet:

### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user
4. Default port: `5432`

### Create Database:
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE ju_activity_hub;

-- Exit
\q
```

### Update .env:
```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/ju_activity_hub?schema=public"
```

## Run Prisma Migrations

After fixing the DATABASE_URL:

```bash
cd backend
npx prisma migrate dev
```

This will:
- Create tables in your database
- Apply all migrations
- Generate Prisma Client

## Verify Connection

1. Test connection:
   ```bash
   cd backend
   npx prisma db pull
   ```

2. Open Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```

3. You should now see your tables!

## Still Having Issues?

1. **Check PostgreSQL is running:**
   - Windows: Check Services (services.msc) for "postgresql-x64-XX"
   - Make sure it's running

2. **Check firewall:**
   - Allow PostgreSQL port 5432 through firewall

3. **Check credentials:**
   - Try connecting with psql directly
   - Verify username and password

4. **Check database exists:**
   ```sql
   psql -U postgres -l
   ```
   List all databases to verify yours exists

## Example .env Template

```env
# Database
DATABASE_URL="postgresql://postgres:your_password_here@localhost:5432/ju_activity_hub?schema=public"

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Server
PORT=3001
FRONTEND_URL=http://localhost:8080
```

