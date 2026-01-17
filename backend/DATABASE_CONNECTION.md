# Database Connection Configuration

## Your Database Connection String

```
postgres://bb7904ec0c03ca3c933fd8b77b049763bbe05102f3ba567b62db8d71b4a6013b:sk_jtxbnemKXfFL3De_r7osG@db.prisma.io:5432/postgres?sslmode=require
```

## Setup

### 1. Add to `backend/.env`

Make sure your `backend/.env` file contains:

```env
DATABASE_URL="postgres://bb7904ec0c03ca3c933fd8b77b049763bbe05102f3ba567b62db8d71b4a6013b:sk_jtxbnemKXfFL3De_r7osG@db.prisma.io:5432/postgres?sslmode=require"
```

### 2. Test Connection

```bash
cd backend
npm run test-db-connection
```

### 3. Run Migrations (if needed)

```bash
cd backend
npx prisma migrate dev
```

### 4. Setup Admin User

```bash
cd backend
npm run create-clerk-user
```

This will create the admin user in both:
- ✅ Prisma database (using the connection string above)
- ✅ Clerk (for frontend authentication)

## Database Info

- **Host:** `db.prisma.io`
- **Port:** `5432`
- **Database:** `postgres`
- **SSL:** Required (`sslmode=require`)
- **Platform:** Prisma Data Platform

## Verify Tables

After migrations, you should have these tables:
- `users`
- `activities`
- `applications`
- `notifications`
- `attendance`
- `admins`
- `coordinators`
- `_prisma_migrations`

## Next Steps

1. ✅ Database connection configured
2. ⏳ Create admin user: `npm run create-clerk-user`
3. ⏳ Start backend: `npm run start:dev`
4. ⏳ Start frontend: `npm run dev`
5. ⏳ Login and test
