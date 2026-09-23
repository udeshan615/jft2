import { getCurrentUser } from '@/lib/services/auth';
import { getMyAccess, getMyPurchases } from '@/lib/services/products';
import { PurchasesClient } from '@/components/shop/shop-client';
import { redirect } from 'next/navigation';

export const metadata = { title: 'My Purchases' };

export default async function PurchasesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const [orders, access] = await Promise.all([
    getMyPurchases(user.id),
    getMyAccess(user.id),
  ]);
  return <PurchasesClient orders={orders} access={access} />;
}
