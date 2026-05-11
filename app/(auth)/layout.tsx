import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sign In – Taxfiley',
  description:
    'Sign in to your Taxfiley account to manage tax returns, communicate with your tax preparer, and track your filing status.',
  alternates: {
    canonical: 'https://www.taxfiley.com/login',
  },
};

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
