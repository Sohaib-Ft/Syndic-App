import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyer la base
  await prisma.paiement.deleteMany();
  await prisma.charge.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appartement.deleteMany();

  // ==================== UTILISATEURS (SYNDIC) ====================
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const residentPassword = await bcrypt.hash('resident123', 10);

  // Syndic
  const syndic = await prisma.user.create({
    data: { email: 'syndic@immeuble.ma', password: hashedPassword, role: 'SYNDIC', nom: 'El Amrani', prenom: 'Mohamed', telephone: '0661234567' }
  });
  console.log('✅ Compte syndic créé');

  // ==================== APPARTEMENTS ====================
  const appartementsData = [
    { numero: 'A101', etage: 1, superficie: 55, nbPieces: 2, type: 'F2', chargesMensuelles: 800, description: 'Appartement F2 avec balcon', syndicId: syndic.id },
    { numero: 'A102', etage: 1, superficie: 75, nbPieces: 3, type: 'F3', chargesMensuelles: 1100, description: 'Appartement F3 lumineux', syndicId: syndic.id },
    { numero: 'A201', etage: 2, superficie: 55, nbPieces: 2, type: 'F2', chargesMensuelles: 800, description: 'Appartement F2 rénové', syndicId: syndic.id },
    { numero: 'A202', etage: 2, superficie: 90, nbPieces: 4, type: 'F4', chargesMensuelles: 1400, description: 'Grand F4 familial', syndicId: syndic.id },
    { numero: 'A301', etage: 3, superficie: 75, nbPieces: 3, type: 'F3', chargesMensuelles: 1100, description: 'F3 avec vue dégagée', syndicId: syndic.id },
    { numero: 'A302', etage: 3, superficie: 55, nbPieces: 2, type: 'F2', chargesMensuelles: 800, description: 'F2 cosy', syndicId: syndic.id },
    { numero: 'A401', etage: 4, superficie: 90, nbPieces: 4, type: 'F4', chargesMensuelles: 1400, description: 'F4 avec terrasse', syndicId: syndic.id },
    { numero: 'A402', etage: 4, superficie: 75, nbPieces: 3, type: 'F3', chargesMensuelles: 1100, description: 'F3 standing', syndicId: syndic.id },
    { numero: 'A501', etage: 5, superficie: 110, nbPieces: 4, type: 'F4', chargesMensuelles: 1600, description: 'Penthouse F4', syndicId: syndic.id },
    { numero: 'A502', etage: 5, superficie: 60, nbPieces: 2, type: 'F2', chargesMensuelles: 850, description: 'F2 dernier étage', syndicId: syndic.id },
  ];

  const appartements = [];
  for (const data of appartementsData) {
    const appart = await prisma.appartement.create({ data });
    appartements.push(appart);
  }
  console.log(`✅ ${appartements.length} appartements créés`);

  // Résidents
  const residentsData = [
    { nom: 'Benali', prenom: 'Youssef', email: 'youssef@mail.com', telephone: '0662345678', appartementId: appartements[0].id, syndicId: syndic.id },
    { nom: 'Ouahbi', prenom: 'Fatima', email: 'fatima@mail.com', telephone: '0663456789', appartementId: appartements[1].id, syndicId: syndic.id },
    { nom: 'Tazi', prenom: 'Karim', email: 'karim@mail.com', telephone: '0664567890', appartementId: appartements[2].id, syndicId: syndic.id },
    { nom: 'Alaoui', prenom: 'Salma', email: 'salma@mail.com', telephone: '0665678901', appartementId: appartements[3].id, syndicId: syndic.id },
    { nom: 'Fassi', prenom: 'Ahmed', email: 'ahmed@mail.com', telephone: '0666789012', appartementId: appartements[4].id, syndicId: syndic.id },
    { nom: 'Berrada', prenom: 'Nadia', email: 'nadia@mail.com', telephone: '0667890123', appartementId: appartements[5].id, syndicId: syndic.id },
    { nom: 'Idrissi', prenom: 'Omar', email: 'omar@mail.com', telephone: '0668901234', appartementId: appartements[6].id, syndicId: syndic.id },
    { nom: 'Chraibi', prenom: 'Amina', email: 'amina@mail.com', telephone: '0669012345', appartementId: appartements[7].id, syndicId: syndic.id },
  ];

  const residents = [];
  for (const data of residentsData) {
    const resident = await prisma.user.create({
      data: { ...data, password: residentPassword, role: 'RESIDENT' }
    });
    residents.push(resident);
    await prisma.appartement.update({ where: { id: data.appartementId }, data: { statut: 'OCCUPE' } });
  }
  console.log(`✅ ${residents.length} résidents créés`);

  // ==================== PAIEMENTS (6 derniers mois) ====================
  const now = new Date();
  let paiementsCount = 0;
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mois = date.getMonth() + 1;
    const annee = date.getFullYear();

    for (let j = 0; j < residents.length; j++) {
      const resident = residents[j];
      const appart = appartements[j];
      // Certains paiements sont payés, d'autres non
      const isPaye = Math.random() > 0.3 || i > 2;
      await prisma.paiement.create({
        data: {
          montant: appart.chargesMensuelles,
          mois, annee,
          appartementId: appart.id,
          residentId: resident.id,
          statut: isPaye ? 'PAYE' : (i < 2 ? 'EN_ATTENTE' : 'EN_RETARD'),
          datePaiement: isPaye ? new Date(annee, mois - 1, Math.floor(Math.random() * 25) + 1) : null
        }
      });
      paiementsCount++;
    }
  }
  console.log(`✅ ${paiementsCount} paiements créés`);

  // ==================== CHARGES ====================
  const chargesData = [
    { libelle: 'Entretien parties communes', montant: 2500, categorie: 'ENTRETIEN', date: new Date(now.getFullYear(), now.getMonth() - 1, 15), syndicId: syndic.id },
    { libelle: 'Facture électricité', montant: 3200, categorie: 'ELECTRICITE', date: new Date(now.getFullYear(), now.getMonth() - 1, 10), syndicId: syndic.id },
    { libelle: 'Facture eau', montant: 1800, categorie: 'EAU', date: new Date(now.getFullYear(), now.getMonth() - 2, 20), syndicId: syndic.id },
    { libelle: 'Maintenance ascenseur', montant: 4500, categorie: 'ASCENSEUR', date: new Date(now.getFullYear(), now.getMonth() - 2, 5), syndicId: syndic.id },
    { libelle: 'Nettoyage mensuel', montant: 1500, categorie: 'NETTOYAGE', date: new Date(now.getFullYear(), now.getMonth(), 3), syndicId: syndic.id },
    { libelle: 'Réparation plomberie', montant: 800, categorie: 'REPARATIONS', date: new Date(now.getFullYear(), now.getMonth() - 3, 12), syndicId: syndic.id },
    { libelle: 'Produits entretien', montant: 600, categorie: 'DIVERS', date: new Date(now.getFullYear(), now.getMonth() - 1, 25), syndicId: syndic.id },
    { libelle: 'Facture électricité', montant: 3100, categorie: 'ELECTRICITE', date: new Date(now.getFullYear(), now.getMonth() - 3, 10), syndicId: syndic.id },
    { libelle: 'Entretien jardin', montant: 1200, categorie: 'ENTRETIEN', date: new Date(now.getFullYear(), now.getMonth() - 4, 8), syndicId: syndic.id },
    { libelle: 'Réparation interphone', montant: 950, categorie: 'REPARATIONS', date: new Date(now.getFullYear(), now.getMonth() - 2, 18), syndicId: syndic.id },
  ];

  for (const data of chargesData) {
    await prisma.charge.create({ data });
  }
  console.log('✅ 10 charges créées');

  console.log('\n🎉 Seeding terminé avec succès !');
  console.log('📧 Compte syndic : syndic@immeuble.ma / admin123');
  console.log('📧 Compte résident : youssef@mail.com / resident123');
}

main()
  .catch((e) => { console.error('❌ Erreur seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
