-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerificationCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerificationCodeHash" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;
