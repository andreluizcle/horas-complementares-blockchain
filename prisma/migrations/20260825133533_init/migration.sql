-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "cargaHoraria" INTEGER NOT NULL,
    "data" DATETIME NOT NULL,
    "emissor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Credential" (
    "assetId" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "ownerWallet" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "mintedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Credential_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Credential_ownerWallet_idx" ON "Credential"("ownerWallet");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_activityId_ownerWallet_key" ON "Credential"("activityId", "ownerWallet");
