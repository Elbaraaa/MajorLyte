import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UA DegreePlan Copilot',
  description: 'AI-powered academic planning — University of Arizona',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
