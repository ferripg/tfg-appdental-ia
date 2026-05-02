-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'OPERARI');

-- CreateEnum
CREATE TYPE "EstatInventari" AS ENUM ('ACTIU', 'BAIXA', 'ELIMINAT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'OPERARI',
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveidor" (
    "id" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "codiBis" TEXT,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "adreca" TEXT,
    "codiPostal" TEXT,
    "poblacio" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "personaContacte" TEXT,
    "iban" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipusDespesa" (
    "id" TEXT NOT NULL,
    "codi" TEXT NOT NULL,
    "descripcio" TEXT NOT NULL,
    "deduible" BOOLEAN NOT NULL DEFAULT true,
    "grup" INTEGER,
    "concepte" TEXT,
    "esAmortitzable" BOOLEAN NOT NULL DEFAULT false,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipusDespesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "dataFactura" TIMESTAMP(3) NOT NULL,
    "dataPagament" TIMESTAMP(3),
    "import" DECIMAL(12,2) NOT NULL,
    "numFactura" TEXT,
    "descripcio" TEXT,
    "fitxerKey" TEXT,
    "tipusDespesaId" TEXT NOT NULL,
    "proveidorId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventari" (
    "id" TEXT NOT NULL,
    "dataAdquisicio" TIMESTAMP(3) NOT NULL,
    "descripcio" TEXT NOT NULL,
    "importAdquisicio" DECIMAL(12,2) NOT NULL,
    "importAmortitzat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percAmortitzacio" DECIMAL(5,2) NOT NULL,
    "importUltimaAmort" DECIMAL(12,2),
    "numFactura" TEXT,
    "estat" "EstatInventari" NOT NULL DEFAULT 'ACTIU',
    "anyBaixa" INTEGER,
    "proveidorId" TEXT,
    "despesaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amortitzacio" (
    "inventariId" TEXT NOT NULL,
    "exercici" INTEGER NOT NULL,
    "import" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amortitzacio_pkey" PRIMARY KEY ("inventariId","exercici")
);

-- CreateTable
CREATE TABLE "TancamentExercici" (
    "exercici" INTEGER NOT NULL,
    "dataTancament" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tancatPerId" TEXT NOT NULL,
    "dataReobertura" TIMESTAMP(3),
    "reobertPerId" TEXT,
    "notes" TEXT,

    CONSTRAINT "TancamentExercici_pkey" PRIMARY KEY ("exercici")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Proveidor_nif_key" ON "Proveidor"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "TipusDespesa_codi_key" ON "TipusDespesa"("codi");

-- CreateIndex
CREATE UNIQUE INDEX "Inventari_despesaId_key" ON "Inventari"("despesaId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_tipusDespesaId_fkey" FOREIGN KEY ("tipusDespesaId") REFERENCES "TipusDespesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_proveidorId_fkey" FOREIGN KEY ("proveidorId") REFERENCES "Proveidor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventari" ADD CONSTRAINT "Inventari_proveidorId_fkey" FOREIGN KEY ("proveidorId") REFERENCES "Proveidor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventari" ADD CONSTRAINT "Inventari_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "Despesa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amortitzacio" ADD CONSTRAINT "Amortitzacio_inventariId_fkey" FOREIGN KEY ("inventariId") REFERENCES "Inventari"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TancamentExercici" ADD CONSTRAINT "TancamentExercici_tancatPerId_fkey" FOREIGN KEY ("tancatPerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TancamentExercici" ADD CONSTRAINT "TancamentExercici_reobertPerId_fkey" FOREIGN KEY ("reobertPerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
