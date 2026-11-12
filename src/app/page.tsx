import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsBoard from "@/components/NewsBoard";
import { SAMPLE_NEWS } from "@/data/sample-news";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <NewsBoard items={SAMPLE_NEWS} />
      </main>
      <footer className="border-t border-line">
        <p className="mx-auto max-w-[1200px] px-4 py-8 text-xs text-muted sm:px-6">
          The Wire · Sample stories for design preview
        </p>
      </footer>
    </>
  );
}
