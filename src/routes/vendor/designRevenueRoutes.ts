import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateVendor, AuthenticatedRequest } from '../../middleware/auth';
import { DesignRevenueService } from '../../services/designRevenueService';
import Decimal from 'decimal.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/vendor/design-revenues/stats
 * @desc    Récupère les statistiques de revenus du vendeur
 * @access  Vendor
 */
router.get('/stats', (authenticateVendor as any), async (req, res) => {
  try {
    const vendorId = (req.user as any).id;
    const { period = 'month' } = req.query;

    // Créer une instance du service
    const designRevenueService = new DesignRevenueService(prisma as any);
    const stats = await designRevenueService.getRevenueStats(vendorId, period as string);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * @route   GET /api/vendor/design-revenues/designs
 * @desc    Récupère la liste des designs avec leurs revenus
 * @access  Vendor
 */
router.get('/designs', (authenticateVendor as any), async (req, res) => {
  try {
    const vendorId = (req.user as any).id;
    const { period, sortBy, search } = req.query;

    // Créer une instance du service
    const designRevenueService = new DesignRevenueService(prisma as any);
    const designs = await designRevenueService.getDesignRevenues(vendorId, {
      period: period as string,
      sortBy: sortBy as string,
      search: search as string
    });

    res.json(designs);
  } catch (error) {
    console.error('Error fetching designs with revenue:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des designs' });
  }
});

/**
 * @route   GET /api/vendor/design-revenues/designs/:designId/history
 * @desc    Récupère l'historique d'utilisation d'un design
 * @access  Vendor
 */
router.get('/designs/:designId/history', (authenticateVendor as any), async (req: any, res: any) => {
  try {
    const vendorId = (req.user as any).id;
    const { designId } = req.params;

    // Vérifier que le design appartient au vendeur
    const design = await prisma.design.findFirst({
      where: {
        id: parseInt(designId),
        vendorId
      }
    });

    if (!design) {
      return res.status(404).json({ error: 'Design non trouvé' });
    }

    // Créer une instance du service
    const designRevenueService = new DesignRevenueService(prisma as any);
    const history = await designRevenueService.getDesignRevenueHistory(
      parseInt(designId),
      vendorId
    );

    res.json(history);
  } catch (error) {
    console.error('Error fetching design usage history:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

/**
 * @route   GET /api/vendor/design-revenues/available-balance
 * @desc    Récupère le solde disponible pour retrait
 * @access  Vendor
 */
router.get('/available-balance', (authenticateVendor as any), async (req, res) => {
  try {
    const vendorId = (req.user as any).id;
    const balance = await DesignRevenueService.getAvailableBalance(vendorId);

    res.json({ balance });
  } catch (error) {
    console.error('Error fetching available balance:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du solde' });
  }
});

/**
 * @route   POST /api/vendor/design-revenues/payout
 * @desc    Crée une demande de retrait
 * @access  Vendor
 */
router.post('/payout', (authenticateVendor as any), async (req: any, res: any) => {
  try {
    const vendorId = (req.user as any).id;
    const { amount, bankAccountId } = req.body;

    if (!amount || !bankAccountId) {
      return res.status(400).json({ error: 'Montant et compte bancaire requis' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const payout = await DesignRevenueService.createPayoutRequest(vendorId, {
      bankAccountId: parseInt(bankAccountId),
      amount: parseFloat(amount)
    });

    res.status(201).json({
      id: payout.id,
      amount: payout.amount.toNumber(),
      status: payout.status,
      requestedAt: payout.requestedAt,
      estimatedProcessingTime: '2-3 jours ouvrables'
    });
  } catch (error) {
    console.error('Error creating payout request:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /api/vendor/design-revenues/payouts
 * @desc    Récupère l'historique des demandes de paiement
 * @access  Vendor
 */
router.get('/payouts', (authenticateVendor as any), async (req, res) => {
  try {
    const vendorId = (req.user as any).id;
    const { page = 1, limit = 20 } = req.query;

    const payouts = await DesignRevenueService.getPayoutHistory(vendorId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json(payouts);
  } catch (error) {
    console.error('Error fetching payout history:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique des paiements' });
  }
});

/**
 * @route   GET /api/vendor/design-revenues/bank-accounts
 * @desc    Récupère les comptes bancaires du vendeur
 * @access  Vendor
 */
router.get('/bank-accounts', (authenticateVendor as any), async (req, res) => {
  try {
    const vendorId = (req.user as any).id;

    // TODO: Implement when VendorBankAccount model exists
    const accounts = [];

    // Masquer une partie du numéro de compte
    const maskedAccounts = accounts.map(account => ({
      ...account,
      accountNumber: account.accountNumber.slice(-4).padStart(account.accountNumber.length, '*')
    }));

    res.json(maskedAccounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des comptes bancaires' });
  }
});

/**
 * @route   POST /api/vendor/design-revenues/bank-accounts
 * @desc    Ajoute un nouveau compte bancaire
 * @access  Vendor
 */
router.post('/bank-accounts', (authenticateVendor as any), async (req: any, res: any) => {
  try {
    const vendorId = (req.user as any).id;
    const {
      bankName,
      accountNumber,
      accountHolderName,
      bankCode,
      branchCode,
      iban,
      swiftCode,
      accountType = 'CHECKING',
      mobileMoneyProvider,
      isDefault = false
    } = req.body;

    if (!bankName || !accountNumber || !accountHolderName) {
      return res.status(400).json({ error: 'Informations bancaires requises' });
    }

    // TODO: Implement when VendorBankAccount model exists
    const account = {
      id: 1,
      vendorId,
      bankName,
      accountNumber: accountNumber.slice(-4).padStart(accountNumber.length, '*'),
      accountHolderName,
      isDefault,
      isVerified: false,
      createdAt: new Date()
    };

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du compte bancaire' });
  }
});

/**
 * @route   PUT /api/vendor/design-revenues/bank-accounts/:id/default
 * @desc    Définit un compte bancaire comme par défaut
 * @access  Vendor
 */
router.put('/bank-accounts/:id/default', (authenticateVendor as any), async (req, res) => {
  try {
    const vendorId = (req.user as any).id;
    const { id } = req.params;

    // TODO: Implement when VendorBankAccount model exists
    res.json({ message: 'Compte bancaire défini par défaut' });
  } catch (error) {
    console.error('Error setting default bank account:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du compte bancaire' });
  }
});

/**
 * @route   DELETE /api/vendor/design-revenues/bank-accounts/:id
 * @desc    Supprime un compte bancaire
 * @access  Vendor
 */
router.delete('/bank-accounts/:id', (authenticateVendor as any), async (req, res) => {
  try {
    const vendorId = (req.user as any).id;
    const { id } = req.params;

    // TODO: Implement when VendorBankAccount and VendorPayout models exist
    res.json({ message: 'Compte bancaire supprimé' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte bancaire' });
  }
});

/**
 * @route   GET /api/vendor/design-revenues/settings
 * @desc    Récupère les paramètres de revenus
 * @access  Vendor
 */
router.get('/settings', (authenticateVendor as any), async (req, res) => {
  try {
    // TODO: Implement when DesignRevenueSettings model exists
    const settings = {
      commissionRate: 70,
      minimumPayoutAmount: 10000,
      payoutDelayDays: 7,
      payoutSchedule: 'ON_DEMAND'
    };

    res.json({
      commissionRate: settings.commissionRate,
      minimumPayoutAmount: settings.minimumPayoutAmount,
      payoutDelayDays: settings.payoutDelayDays,
      payoutSchedule: settings.payoutSchedule
    });
  } catch (error) {
    console.error('Error fetching revenue settings:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
});

export default router;