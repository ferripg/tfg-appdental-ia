-- DropForeignKey
ALTER TABLE "Inventari" DROP CONSTRAINT "Inventari_proveidorId_fkey";

-- AlterTable
ALTER TABLE "Inventari" ADD COLUMN     "numInventari" TEXT NOT NULL,
ALTER COLUMN "percAmortitzacio" SET DEFAULT 0,
ALTER COLUMN "proveidorId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Inventari_numInventari_key" ON "Inventari"("numInventari");

-- AddForeignKey
ALTER TABLE "Inventari" ADD CONSTRAINT "Inventari_proveidorId_fkey" FOREIGN KEY ("proveidorId") REFERENCES "Proveidor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
