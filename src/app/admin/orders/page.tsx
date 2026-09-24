import { requireAdmin } from '@/lib/services/auth';
import { listOrders } from '@/lib/services/products';
import { OrdersAdmin } from '@/components/admin/orders-admin';

export const metadata = { title: 'Admin · Orders' };

export default async function Page() {
  await requireAdmin();
  const orders = await listOrders(100);
  return <OrdersAdmin orders={orders as never[]} />;
}
