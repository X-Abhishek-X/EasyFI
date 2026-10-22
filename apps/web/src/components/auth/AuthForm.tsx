import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, TextInput } from '@/components/ui/Field';

/** Server action or URL the form posts to. Wired up in the auth phase. */
export type AuthFormAction = string | ((formData: FormData) => void | Promise<void>);

export type AuthFormProps = {
  mode: 'sign-in' | 'sign-up';
  action?: AuthFormAction;
  /** Error message from a previous attempt. */
  error?: string | null;
  /** Prefill for the invite code (e.g. from ?invite=). */
  inviteCode?: string;
};

/** Email + password form; sign-up adds name and invite code. Presentational only. */
export function AuthForm({ mode, action, error, inviteCode }: AuthFormProps) {
  const signUp = mode === 'sign-up';
  const footer: ReactNode = signUp ? (
    <>
      Already have an account?{' '}
      <Link href="/sign-in" className="font-medium text-up hover:underline">
        Sign in
      </Link>
    </>
  ) : (
    <>
      Have an invite code?{' '}
      <Link href="/sign-up" className="font-medium text-up hover:underline">
        Create an account
      </Link>
    </>
  );

  return (
    <>
      <Card className="!p-6 sm:!p-8">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-fg">
          {signUp ? 'Create your account' : 'Sign in to EasyFI'}
        </h1>
        <p className="mt-1 text-[14px] text-muted">
          {signUp
            ? 'EasyFI is invite-only. Enter the code a friend sent you.'
            : 'See what your portfolio really owns.'}
        </p>
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-[var(--sev-high-bg)] px-3 py-2 text-[13px] text-[var(--sev-high-fg)]"
          >
            {error}
          </p>
        ) : null}
        <form action={action} className="mt-6 space-y-4">
          {signUp ? (
            <>
              <Field label="Invite code">
                <TextInput
                  name="inviteCode"
                  required
                  defaultValue={inviteCode}
                  placeholder="EASY-XXXX-XXXX"
                  autoCapitalize="characters"
                  className="font-mono tracking-wide"
                />
              </Field>
              <Field label="Name">
                <TextInput name="displayName" required autoComplete="name" />
              </Field>
            </>
          ) : null}
          <Field label="Email">
            <TextInput name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Password" hint={signUp ? 'At least 10 characters.' : undefined}>
            <TextInput
              name="password"
              type="password"
              required
              minLength={signUp ? 10 : undefined}
              autoComplete={signUp ? 'new-password' : 'current-password'}
            />
          </Field>
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {signUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      </Card>
      <p className="mt-5 text-center text-[13px] text-muted">{footer}</p>
    </>
  );
}
