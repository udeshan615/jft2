import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { Spinner } from '@/components/ui/spinner';

export const metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue learning and earning rewards"
      tagline="JFT-Basic ට සූදානම් වෙන්න, සිංහලෙන්ම — ඔබේ ජපන් සිහිනය අද ආරම්භ කරන්න"
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
