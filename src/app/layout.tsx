/*
 * Pass-through root layout. The real <html> lives in [locale]/layout.tsx so it
 * can set lang="en" / lang="es". This file only exists because not-found.tsx
 * at the root requires a layout.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
