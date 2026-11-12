import "./globals.css";

/** 404 for URLs outside any locale (rare: the proxy adds a locale to almost every path). */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center font-sans">
        <p className="text-muted">404 · Page not found</p>
      </body>
    </html>
  );
}
