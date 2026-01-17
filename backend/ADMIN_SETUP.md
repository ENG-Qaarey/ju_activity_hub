# Admin User Setup Guide

## Admin Credentials

**Email:** `jamiila@gmail.com`  
**Password:** `Jamiila@JU2024Secure!`  
**Role:** `admin`

## Important Notes

1. **Email Format**: All emails are normalized to lowercase (`jamiila@gmail.com`) for consistency
2. **Password**: The password `Jamiila@JU2024Secure!` is secure and not found in data breaches
3. **Database**: User must exist in both Clerk (for frontend) and Prisma (for backend)

## Setup Scripts

### 1. Setup Admin in Prisma Database

```bash
cd backend
npm run setup-admin
```

This script will:
- Check if admin user exists in Prisma database
- Create or update the admin user with correct credentials
- Ensure admin profile exists with full permissions

### 2. Setup Admin in Clerk (for Frontend Login)

```bash
cd backend
npm run create-clerk-user
```

This script will:
- Check if user exists in Clerk
- Create or update the user in Clerk
- Set password and admin role metadata

## Database Seed

The seed file also creates the admin user:

```bash
cd backend
npm run seed
```

## Verification

After running the scripts, verify the user exists:

1. **In Prisma Database:**
   ```bash
   cd backend
   npm run check-admin
   ```

2. **Login Test:**
   - Use email: `jamiila@gmail.com`
   - Use password: `Jamiila@JU2024Secure!`
   - Should successfully login as admin

## Troubleshooting

- If login fails, ensure:
  1. User exists in Clerk (run `npm run create-clerk-user`)
  2. User exists in Prisma (run `npm run setup-admin`)
  3. Email is in lowercase format
  4. Password meets security requirements (no data breach warnings)

## Files Modified

- `backend/src/scripts/create-clerk-user.ts` - Creates/updates Clerk user
- `backend/src/scripts/setup-admin.ts` - Creates/updates Prisma admin user
- `backend/src/check-admin.ts` - Verifies admin user exists
- `backend/prisma/seed.ts` - Seeds admin user with secure password

