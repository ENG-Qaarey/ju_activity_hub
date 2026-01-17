# Admin Credentials

## Admin User

- **Email:** `jamiila@gmail.com`
- **Password:** `Jamiila@JU2024Secure!`
- **Role:** `admin`

## Setup Instructions

### 1. Create Admin User in Clerk

Run this command to create/update the admin user in Clerk:

```bash
cd backend
npm run create-clerk-user
```

This will:
- Create the admin user in Clerk
- Set the password
- Remove MFA methods if they exist
- Set admin role in metadata

### 2. Create Admin User in Prisma Database

Run this command to create/update the admin user in your database:

```bash
cd backend
npm run setup-admin
```

This will:
- Create the admin user in your Prisma database
- Set admin role
- Create admin profile with full permissions

### 3. Disable MFA in Clerk Dashboard

**IMPORTANT:** To prevent MFA requirements, disable it in Clerk Dashboard:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to: **Settings** → **Multi-factor Authentication**
3. Set **"Require MFA"** to **"Optional"** or **"Disabled"**
4. Save changes

OR remove MFA for this specific user:

1. Go to: **Users** → `jamiila@gmail.com`
2. Click on the user
3. Remove any MFA methods (TOTP, SMS, etc.)
4. Save changes

### 4. Login

After setup, you can login with:
- Email: `jamiila@gmail.com`
- Password: `Jamiila@JU2024Secure!`

## Troubleshooting

### "MFA Required" Error

If you still see MFA required:
1. Make sure MFA is disabled in Clerk Dashboard (see step 3 above)
2. Remove any MFA methods from the user in Clerk Dashboard
3. Try logging in again

### "Session already exists" Error

The login screen will automatically handle this by clearing the old session. If it persists:
1. Clear browser cache and cookies
2. Try logging in again
3. Or manually sign out from Clerk Dashboard

### Database Connection Issues

If Prisma Studio can't connect:
1. Check your `DATABASE_URL` in `backend/.env`
2. Run: `npm run test-db-connection` to test connection
3. See `backend/DATABASE_FIX.md` for detailed instructions

## Verification

After setup, verify everything works:

1. **Check Clerk:**
   ```bash
   npm run create-clerk-user
   ```
   Should show: "User already exists" or "User created successfully"

2. **Check Database:**
   ```bash
   npm run check-admin
   ```
   Should show: "User found" or "Admin user created"

3. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   Navigate to `users` table and verify the admin user exists

4. **Test Login:**
   - Go to login page
   - Enter email: `jamiila@gmail.com`
   - Enter password: `Jamiila@JU2024Secure!`
   - Should login successfully without MFA

