import { prisma } from '../../config/database';

export async function revisarStockJob(): Promise<void> {
  const items = await prisma.inventario.findMany({
    where: { deletedAt: null },
    select: { id: true, cantidad: true, stockMinimo: true, alerta: true },
  });

  const bajoStock = items.filter((i) => i.cantidad <= i.stockMinimo);
  const normalStock = items.filter((i) => i.cantidad > i.stockMinimo);

  const updates: Promise<unknown>[] = [];

  if (bajoStock.length > 0) {
    updates.push(
      prisma.inventario.updateMany({
        where: { id: { in: bajoStock.map((i) => i.id) }, alerta: false },
        data: { alerta: true },
      })
    );
  }

  if (normalStock.length > 0) {
    updates.push(
      prisma.inventario.updateMany({
        where: { id: { in: normalStock.map((i) => i.id) }, alerta: true },
        data: { alerta: false },
      })
    );
  }

  await Promise.all(updates);

  console.log(`[revisar-stock] ${bajoStock.length} items bajo stock mínimo, ${normalStock.length} normales.`);
}
