// Página provisoria del paso 1: solo confirma que el deploy funciona.
// En el paso 2 se reemplaza por la portada real (ver ESTILO.md).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold tracking-[0.3em] text-white sm:text-5xl">
        THE WIRE
      </h1>
      <p className="text-[#8A8A8A]">En construcción · Under construction</p>
    </main>
  );
}
