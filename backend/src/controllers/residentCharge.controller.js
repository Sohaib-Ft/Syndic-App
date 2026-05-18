import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== CHARGES PARTIELLES ====================

export const getAllChargesPartielles = async (req, res) => {
  try {
    const charges = await prisma.chargePartielle.findMany({
      include: { residents: { include: { resident: true } } },
      orderBy: { date: 'desc' }
    });
    res.json(charges);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const createChargePartielle = async (req, res) => {
  try {
    const { libelle, montant, date, description, isGlobal, residentIds } = req.body;
    console.log('Tentative création charge:', req.body);
    if (!libelle || !montant || !date) {
      console.log('Champs manquants:', { libelle, montant, date });
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    const charge = await prisma.chargePartielle.create({
      data: { 
        libelle, 
        montant: parseFloat(montant), 
        date: new Date(date), 
        description, 
        isGlobal 
      }
    });

    let targets = [];
    if (isGlobal) {
      targets = await prisma.user.findMany({ where: { role: 'RESIDENT', actif: true } });
    } else if (residentIds && residentIds.length > 0) {
      targets = await prisma.user.findMany({ where: { id: { in: residentIds.map(id => parseInt(id)) } } });
    }

    if (targets.length > 0) {
      await Promise.all(
        targets.map(t => 
          prisma.chargePartielleResident.create({
            data: {
              chargePartielleId: charge.id,
              residentId: t.id,
              statut: 'EN_ATTENTE'
            }
          })
        )
      );
    }

    res.status(201).json({ message: 'Charge partielle créée.', charge });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const updateChargePartielle = async (req, res) => {
  try {
    const { id } = req.params;
    const { libelle, montant, date, description } = req.body;
    
    const updated = await prisma.chargePartielle.update({
      where: { id: parseInt(id) },
      data: {
        ...(libelle && { libelle }),
        ...(montant && { montant: parseFloat(montant) }),
        ...(date && { date: new Date(date) }),
        ...(description !== undefined && { description })
      }
    });

    res.json({ message: 'Charge partielle modifiée.', charge: updated });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const deleteChargePartielle = async (req, res) => {
  try {
    await prisma.chargePartielle.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Charge partielle supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const validerPaiementChargePartielle = async (req, res) => {
  try {
    const { chargeId, residentId } = req.params;
    await prisma.chargePartielleResident.update({
      where: { chargePartielleId_residentId: { chargePartielleId: parseInt(chargeId), residentId: parseInt(residentId) } },
      data: { statut: 'PAYE', datePaiement: new Date() }
    });
    res.json({ message: 'Paiement validé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ==================== CHARGE ESSENTIELLE (SETTINGS) ====================

export const getEssentialCharge = async (req, res) => {
  try {
    let setting = await prisma.setting.findUnique({ where: { key: 'CHARGE_ESSENTIELLE' } });
    if (!setting) {
      setting = await prisma.setting.create({ data: { key: 'CHARGE_ESSENTIELLE', value: '100' } });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const updateEssentialCharge = async (req, res) => {
  try {
    const { value } = req.body;
    const updated = await prisma.setting.upsert({
      where: { key: 'CHARGE_ESSENTIELLE' },
      update: { value: value.toString() },
      create: { key: 'CHARGE_ESSENTIELLE', value: value.toString() }
    });

    // Mettre à jour tous les appartements pour avoir la même charge mensuelle
    await prisma.appartement.updateMany({
      data: { chargesMensuelles: parseFloat(value) }
    });

    res.json({ message: 'Charge essentielle mise à jour pour tous.', setting: updated });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Pour les résidents : récupérer leurs charges
export const getResidentCharges = async (req, res) => {
  try {
    const residentId = req.user.id;
    
    // 1. Charge essentielle (Paiements)
    const paiements = await prisma.paiement.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Charges partielles
    const partielles = await prisma.chargePartielleResident.findMany({
      where: { residentId },
      include: { chargePartielle: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ paiements, partielles });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
