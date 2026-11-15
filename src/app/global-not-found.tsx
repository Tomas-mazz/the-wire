import "./globals.css";

/** 404 for URLs that match no route. Bypasses the layouts, so it brings its own <html> and styles. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center font-sans">
        <p className="text-muted">404 · Page not found</p>
      </body>
    </html>
  );
}
