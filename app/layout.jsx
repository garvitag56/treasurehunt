import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#070b14',
};

export const metadata = {
  title: 'Treasure Hunt',
  description: 'Real-time campus treasure hunt for NIELIT Students',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
