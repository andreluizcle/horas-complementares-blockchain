-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "cargaHoraria" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "emissor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "assetId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "ownerWallet" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "mintedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("assetId")
);

-- CreateIndex
CREATE INDEX "Credential_ownerWallet_idx" ON "Credential"("ownerWallet");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_activityId_ownerWallet_key" ON "Credential"("activityId", "ownerWallet");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
