import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/audit - Get audit events
router.get('/', async (req: Request, res: Response) => {
  const { matterId, action, limit = '100' } = req.query;

  const events = await prisma.auditEvent.findMany({
    where: {
      ...(matterId ? { matterId: matterId as string } : {}),
      ...(action ? { action: action as string } : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: parseInt(limit as string, 10),
    include: {
      matter: {
        select: {
          id: true,
          description: true,
          domain: true,
        },
      },
    },
  });

  res.json(events);
});

export default router;
