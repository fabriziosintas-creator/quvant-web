import { Tunel } from "@/componentes/panel/nichos/Tunel";

/** Mientras carga un nicho: el túnel (la carga es la animación). */
export default function Cargando() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <Tunel />
    </main>
  );
}
