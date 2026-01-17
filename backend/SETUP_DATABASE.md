# Database Setup with Prisma Data Platform

## Database Connection String

Your database is hosted on Prisma Data Platform. The connection string is:

```
postgres://bb7904ec0c03ca3c933fd8b77b049763bbe05102f3ba567b62db8d71b4a6013b:sk_jtxbnemKXfFL3De_r7osG@db.prisma.io:5432/postgres?sslmode=require
```

## Setup Steps

### 1. Add to `.env` file

Open `backend/.env` and add/update:

```env
DATABASE_URL="postgres://bb7904ec0c03ca3c933fd8b77b049763bbe05102f3ba567b62db8d71b4a6013b:sk_jtxbnemKXfFL3De_r7osG@db.prisma.io:5432/postgres?sslmode=require"
```

### 2. Test Connection

```bash
cd backend
npm run test-db-connection
```

### 3. Run Migrations

```bash
cd backend
npx prisma migrate dev
```

This will create all tables in your Prisma database.

### 4. Setup Admin User

```bash
cd backend
npm run create-clerk-user
```

This creates the admin user in both Prisma and Clerk.

## Important Notes

- ✅ SSL is required (`sslmode=require`)
- ✅ Database is hosted on `db.prisma.io`
- ✅ Port is `5432`
- ✅ Database name is `postgres`

## Verify Setup

1. **Test connection:**
   ```bash
   npm run test-db-connection
   ```

2. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   Should open at `http://localhost:5555`

3. **Check tables:**
   - Navigate to `users` table
   - Should see admin user after running `create-clerk-user`

## Troubleshooting

### Connection timeout
- Check internet connection
- Verify Prisma Data Platform is accessible
- Check firewall settings

### SSL errors
- The connection string already includes `sslmode=require`
- If issues persist, try `sslmode=prefer`

### Authentication failed
- Verify the connection string is correct
- Check if credentials are still valid in Prisma Dashboard
