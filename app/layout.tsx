import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { ToastProvider } from '@/components/ui/toast';
import { Web3Provider } from '@/components/providers/web3-provider';
import { MerchantAuthProvider } from '@/components/providers/merchant-auth-provider';

export const metadata: Metadata = {
  title: 'Verse Merchant OS | Simple Crypto Payments for Modern Merchants',
  description: 'Streamlined cryptocurrency payment platform built around Verse and Polygon. Create invoices, share payment links, and verify blockchain payments with instant receipts.',
  openGraph: {
    title: 'Verse Merchant OS',
    description: 'Simple crypto payments for modern merchants on Verse and Polygon.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verse Merchant OS',
    description: 'Simple crypto payments for modern merchants on Verse and Polygon.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Web3Provider>
          <MerchantAuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </MerchantAuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}

