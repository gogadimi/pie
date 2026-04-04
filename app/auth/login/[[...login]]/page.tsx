import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: 'w-full',
          card: 'shadow-xl border-0',
        },
      }}
      signUpUrl="/signup"
    />
  );
}
