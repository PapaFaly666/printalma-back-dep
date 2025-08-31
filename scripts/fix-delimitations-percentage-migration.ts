import { PrismaClient, CoordinateType } from '@prisma/client';

/**
 * Script de migration : corrige les délimitations dont coordinateType = PERCENTAGE mais
 * les valeurs dépassent 100 (stockées en pixels). On les convertit en pourcentages.
 */
async function main() {
  const prisma = new PrismaClient();
  const batchSize = 100;
  let offset = 0;
  let totalFixed = 0;

  while (true) {
    const items = await prisma.delimitation.findMany({
      where: {
        coordinateType: CoordinateType.PERCENTAGE,
        OR: [
          { x: { gt: 100 } },
          { y: { gt: 100 } },
          { width: { gt: 100 } },
          { height: { gt: 100 } },
        ],
      },
      take: batchSize,
      skip: offset,
      include: {
        productImage: {
          select: { naturalWidth: true, naturalHeight: true },
        },
      },
    });

    if (items.length === 0) break;

    for (const delim of items) {
      const w = delim.productImage?.naturalWidth;
      const h = delim.productImage?.naturalHeight;
      if (!w || !h) continue;

      const newX = (delim.x / w) * 100;
      const newY = (delim.y / h) * 100;
      const newW = (delim.width / w) * 100;
      const newH = (delim.height / h) * 100;

      await prisma.delimitation.update({
        where: { id: delim.id },
        data: {
          x: Math.round(newX * 100) / 100,
          y: Math.round(newY * 100) / 100,
          width: Math.round(newW * 100) / 100,
          height: Math.round(newH * 100) / 100,
          absoluteX: delim.x,
          absoluteY: delim.y,
          absoluteWidth: delim.width,
          absoluteHeight: delim.height,
          originalImageWidth: w,
          originalImageHeight: h,
          referenceWidth: w,
          referenceHeight: h,
        },
      });
      totalFixed++;
    }

    offset += items.length;
  }

  console.log(`✅ Migration terminée. Délimitations corrigées: ${totalFixed}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 