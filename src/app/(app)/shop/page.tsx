import { getCurrentUser } from '@/lib/services/auth';
import { listPublishedProducts } from '@/lib/services/products';
import { ShopList } from '@/components/shop/shop-client';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Shop' };

export default async function ShopPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const products = await listPublishedProducts();
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
        <p className="text-muted-foreground">
          Paid resources. Referral commissions apply when configured.
        </p>
      </div>
      <ShopList products={products} />
    </div>
  );
}
