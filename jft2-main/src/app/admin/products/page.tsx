import { requireAdmin } from '@/lib/services/auth';
import { listAllProducts } from '@/lib/services/products';
import { ProductsAdmin } from '@/components/admin/products-admin';

export const metadata = { title: 'Admin · Products' };

export default async function Page() {
  await requireAdmin();
  const products = await listAllProducts();
  return <ProductsAdmin products={products} />;
}
