import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { Spinner } from '@/components/ui/spinner';

export const metadata = {
  title: 'Create account',
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start learning Japanese and earning rewards today"
      tagline="සිංහලෙන්ම JFT-Basic සූදානම — Account එකක් හදලා අදම පටන් ගන්න 🌸"
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
