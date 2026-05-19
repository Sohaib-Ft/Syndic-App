-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RESIDENT',
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "typeResident" TEXT DEFAULT 'PROPRIETAIRE',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "googleId" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'local',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appartementId" INTEGER,
    "syndicId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appartement" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "etage" INTEGER NOT NULL,
    "superficie" DOUBLE PRECISION NOT NULL,
    "nbPieces" INTEGER NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'VACANT',
    "chargesMensuelles" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syndicId" INTEGER,

    CONSTRAINT "Appartement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" SERIAL NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "datePaiement" TIMESTAMP(3),
    "appartementId" INTEGER NOT NULL,
    "residentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "categorie" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syndicId" INTEGER,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargePartielle" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syndicId" INTEGER,

    CONSTRAINT "ChargePartielle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargePartielleResident" (
    "id" SERIAL NOT NULL,
    "chargePartielleId" INTEGER NOT NULL,
    "residentId" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargePartielleResident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_appartementId_key" ON "User"("appartementId");

-- CreateIndex
CREATE UNIQUE INDEX "Appartement_syndicId_numero_key" ON "Appartement"("syndicId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_appartementId_mois_annee_key" ON "Paiement"("appartementId", "mois", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "ChargePartielleResident_chargePartielleId_residentId_key" ON "ChargePartielleResident"("chargePartielleId", "residentId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_appartementId_fkey" FOREIGN KEY ("appartementId") REFERENCES "Appartement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appartement" ADD CONSTRAINT "Appartement_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_appartementId_fkey" FOREIGN KEY ("appartementId") REFERENCES "Appartement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePartielle" ADD CONSTRAINT "ChargePartielle_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePartielleResident" ADD CONSTRAINT "ChargePartielleResident_chargePartielleId_fkey" FOREIGN KEY ("chargePartielleId") REFERENCES "ChargePartielle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePartielleResident" ADD CONSTRAINT "ChargePartielleResident_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
