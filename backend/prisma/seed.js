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
  await prisma.annonce.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appartement.deleteMany();

  // ==================== APPARTEMENTS ====================
  const appartementsData = [
    { numero: 'A101', etage: 1, superficie: 55, nbPieces: 2, type: 'F2', chargesMensuelles: 800, description: 'Appartement F2 avec balcon' },
    { numero: 'A102', etage: 1, superficie: 75, nbPieces: 3, type: 'F3', chargesMensuelles: 1100, description: 'Appartement F3 lumineux' },
    { numero: 'A201', etage: 2, superficie: 55, nbPieces: 2, type: 'F2', chargesMensuelles: 800, description: 'Appartement F2 rénové' },
    { numero: 'A202', etage: 2, superficie: 90, nbPieces: 4, type: 'F4', chargesMensuelles: 1400, description: 'Grand F4 familial' },
    { numero: 'A301', etage: 3, superficie: 75, nbPieces: 3, type: 'F3', chargesMensuelles: 1100, description: 'F3 avec vue dégagée' },
    { numero: 'A302', etage: 3, superficie: 55, nbPieces: 2, type: 'F2', chargesMensuelles: 800, description: 'F2 cosy' },
    { numero: 'A401', etage: 4, superficie: 90, nbPieces: 4, type: 'F4', chargesMensuelles: 1400, description: 'F4 avec terrasse' },
    { numero: 'A402', etage: 4, superficie: 75, nbPieces: 3, type: 'F3', chargesMensuelles: 1100, description: 'F3 standing' },
    { numero: 'A501', etage: 5, superficie: 110, nbPieces: 4, type: 'F4', chargesMensuelles: 1600, description: 'Penthouse F4' },
    { numero: 'A502', etage: 5, superficie: 60, nbPieces: 2, type: 'F2', chargesMensuelles: 850, description: 'F2 dernier étage' },
  ];

  const appartements = [];
  for (const data of appartementsData) {
    const appart = await prisma.appartement.create({ data });
    appartements.push(appart);
  }
  console.log(`✅ ${appartements.length} appartements créés`);

  // ==================== UTILISATEURS ====================
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const residentPassword = await bcrypt.hash('resident123', 10);

  // Syndic
  await prisma.user.create({
    data: { email: 'syndic@immeuble.ma', password: hashedPassword, role: 'SYNDIC', nom: 'El Amrani', prenom: 'Mohamed', telephone: '0661234567' }
  });
  console.log('✅ Compte syndic créé');

  // Résidents
  const residentsData = [
    { nom: 'Benali', prenom: 'Youssef', email: 'youssef@mail.com', telephone: '0662345678', appartementId: appartements[0].id },
    { nom: 'Ouahbi', prenom: 'Fatima', email: 'fatima@mail.com', telephone: '0663456789', appartementId: appartements[1].id },
    { nom: 'Tazi', prenom: 'Karim', email: 'karim@mail.com', telephone: '0664567890', appartementId: appartements[2].id },
    { nom: 'Alaoui', prenom: 'Salma', email: 'salma@mail.com', telephone: '0665678901', appartementId: appartements[3].id },
    { nom: 'Fassi', prenom: 'Ahmed', email: 'ahmed@mail.com', telephone: '0666789012', appartementId: appartements[4].id },
    { nom: 'Berrada', prenom: 'Nadia', email: 'nadia@mail.com', telephone: '0667890123', appartementId: appartements[5].id },
    { nom: 'Idrissi', prenom: 'Omar', email: 'omar@mail.com', telephone: '0668901234', appartementId: appartements[6].id },
    { nom: 'Chraibi', prenom: 'Amina', email: 'amina@mail.com', telephone: '0669012345', appartementId: appartements[7].id },
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

  // ==================== ANNONCES ====================
  const annoncesData = [
    {
      titre: 'Assemblée Générale Annuelle',
      titreFr: 'Assemblée Générale Annuelle',
      titreEn: 'Annual General Assembly',
      titreAr: 'الجمع العام السنوي',
      contenu: 'L\'assemblée générale annuelle se tiendra le samedi 15 juin à 10h dans la salle commune. Votre présence est obligatoire.',
      contenuFr: 'L\'assemblée générale annuelle se tiendra le samedi 15 juin à 10h dans la salle commune. Votre présence est obligatoire.',
      contenuEn: 'The annual general assembly will be held on Saturday, June 15 at 10:00 AM in the common hall. Your attendance is mandatory.',
      contenuAr: 'سيُعقد الجمع العام السنوي يوم السبت 15 يونيو على الساعة 10 صباحا في القاعة المشتركة. حضوركم إلزامي.',
      categorie: 'ASSEMBLEE'
    },
    {
      titre: 'Travaux de rénovation ascenseur',
      titreFr: 'Travaux de rénovation ascenseur',
      titreEn: 'Elevator renovation works',
      titreAr: 'أشغال صيانة المصعد',
      contenu: 'Des travaux de maintenance sur l\'ascenseur principal auront lieu du 20 au 25 du mois. Merci d\'utiliser les escaliers.',
      contenuFr: 'Des travaux de maintenance sur l\'ascenseur principal auront lieu du 20 au 25 du mois. Merci d\'utiliser les escaliers.',
      contenuEn: 'Maintenance work on the main elevator will take place from the 20th to the 25th of the month. Please use the stairs.',
      contenuAr: 'ستُجرى أشغال صيانة بالمصعد الرئيسي من 20 إلى 25 من الشهر. يرجى استعمال السلالم.',
      categorie: 'TRAVAUX'
    },
    {
      titre: 'Rappel : Règlement des charges',
      titreFr: 'Rappel : Règlement des charges',
      titreEn: 'Reminder: Charge payments',
      titreAr: 'تذكير: أداء المصاريف',
      contenu: 'Nous rappelons à tous les résidents que le paiement des charges doit être effectué avant le 10 de chaque mois.',
      contenuFr: 'Nous rappelons à tous les résidents que le paiement des charges doit être effectué avant le 10 de chaque mois.',
      contenuEn: 'We remind all residents that charge payments must be made before the 10th of each month.',
      contenuAr: 'نذكّر جميع السكان بأن أداء المصاريف يجب أن يتم قبل اليوم العاشر من كل شهر.',
      categorie: 'INFO'
    },
    {
      titre: 'Coupure d\'eau programmée',
      titreFr: 'Coupure d\'eau programmée',
      titreEn: 'Scheduled water outage',
      titreAr: 'انقطاع ماء مبرمج',
      contenu: 'Une coupure d\'eau est prévue le mercredi de 8h à 14h pour travaux de maintenance. Veuillez prévoir vos réserves.',
      contenuFr: 'Une coupure d\'eau est prévue le mercredi de 8h à 14h pour travaux de maintenance. Veuillez prévoir vos réserves.',
      contenuEn: 'A water outage is scheduled on Wednesday from 8 AM to 2 PM for maintenance work. Please prepare your reserves.',
      contenuAr: 'من المقرر انقطاع الماء يوم الأربعاء من الساعة 8 إلى 14 بسبب أشغال الصيانة. يرجى تجهيز احتياطاتكم.',
      categorie: 'URGENT'
    },
    {
      titre: 'Nouveau règlement intérieur',
      titreFr: 'Nouveau règlement intérieur',
      titreEn: 'New internal regulations',
      titreAr: 'نظام داخلي جديد',
      contenu: 'Le nouveau règlement intérieur est disponible. Il sera affiché dans le hall et envoyé par email à tous les résidents.',
      contenuFr: 'Le nouveau règlement intérieur est disponible. Il sera affiché dans le hall et envoyé par email à tous les résidents.',
      contenuEn: 'The new internal regulations are available. They will be posted in the lobby and emailed to all residents.',
      contenuAr: 'النظام الداخلي الجديد متوفر. سيتم تعليقه في بهو العمارة وإرساله عبر البريد الإلكتروني لجميع السكان.',
      categorie: 'INFO'
    },
  ];

  for (const data of annoncesData) {
    await prisma.annonce.create({ data });
  }
  console.log('✅ 5 annonces créées');

  // ==================== CHARGES ====================
  const chargesData = [
    { libelle: 'Entretien parties communes', montant: 2500, categorie: 'ENTRETIEN', date: new Date(now.getFullYear(), now.getMonth() - 1, 15) },
    { libelle: 'Facture électricité', montant: 3200, categorie: 'ELECTRICITE', date: new Date(now.getFullYear(), now.getMonth() - 1, 10) },
    { libelle: 'Facture eau', montant: 1800, categorie: 'EAU', date: new Date(now.getFullYear(), now.getMonth() - 2, 20) },
    { libelle: 'Maintenance ascenseur', montant: 4500, categorie: 'ASCENSEUR', date: new Date(now.getFullYear(), now.getMonth() - 2, 5) },
    { libelle: 'Nettoyage mensuel', montant: 1500, categorie: 'NETTOYAGE', date: new Date(now.getFullYear(), now.getMonth(), 3) },
    { libelle: 'Réparation plomberie', montant: 800, categorie: 'REPARATIONS', date: new Date(now.getFullYear(), now.getMonth() - 3, 12) },
    { libelle: 'Produits entretien', montant: 600, categorie: 'DIVERS', date: new Date(now.getFullYear(), now.getMonth() - 1, 25) },
    { libelle: 'Facture électricité', montant: 3100, categorie: 'ELECTRICITE', date: new Date(now.getFullYear(), now.getMonth() - 3, 10) },
    { libelle: 'Entretien jardin', montant: 1200, categorie: 'ENTRETIEN', date: new Date(now.getFullYear(), now.getMonth() - 4, 8) },
    { libelle: 'Réparation interphone', montant: 950, categorie: 'REPARATIONS', date: new Date(now.getFullYear(), now.getMonth() - 2, 18) },
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
