-- CreateEnum
CREATE TYPE "AccioAudit" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN_OK', 'LOGIN_FAIL', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'USER_BLOCKED', 'USER_UNBLOCKED', 'ROLE_CHANGED', 'EXERCICI_TANCAT', 'EXERCICI_REOBERT', 'AMORTITZACIONS_GENERATED', 'AMORTITZACIONS_RETROCEDIDES');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "accio" "AccioAudit" NOT NULL,
    "entitat" TEXT,
    "entitatId" TEXT,
    "canvis" JSONB,
    "ip" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_entitat_entitatId_idx" ON "AuditLog"("entitat", "entitatId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
