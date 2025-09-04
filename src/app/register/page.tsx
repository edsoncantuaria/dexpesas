import { AuthForm } from '@/components/auth/auth-form';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Crie sua Conta</CardTitle>
            <CardDescription>
              Comece sua jornada financeira hoje mesmo. É rápido e fácil!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm type="register" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
