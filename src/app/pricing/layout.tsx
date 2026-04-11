import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سعر الموقع | مخزني',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
