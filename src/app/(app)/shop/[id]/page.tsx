import { getCurrentUser } from '@/lib/services/auth';
import { getProduct, getUserAccess } from '@/lib/services/products';
import { getPublicSettings } from '@/lib/services/settings';
import { ProductDetailClient } from '@/components/shop/shop-client';
import { redirect, notFound } from 'next/navigation';

export const metadata = { title: 'Product' };

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || (product.status !== 'published' && user.role !== 'admin')) notFound();
  const access = await getUserAccess(user.id, id);
  const settings = await getPublicSettings();
  const commissionPercent =
    Number(product.commission_percent ?? settings.referral_commission_percent ?? 10) || 10;

  return (
    <ProductDetailClient
      product={product}
      hasAccess={!!access}
      commissionPercent={commissionPercent}
    />
  );
}
