import { PROMO_TEXTOS } from "@/datos/promo";

const T = PROMO_TEXTOS.contador;

/**
 * Los 100 lugares como 100 cuadraditos de la marca: llenos los que ya
 * tienen dueño, con borde los libres. El número va también en palabras,
 * para el lector de pantalla y para quien no cuenta cuadraditos.
 */
export function Contador({ dados, tope, ejemplo = false }: { dados: number; tope: number; ejemplo?: boolean }) {
  const quedan = Math.max(0, tope - dados);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="titulo text-3xl text-blanco md:text-4xl">
          {quedan > 0 ? T.quedan.replace("{n}", String(quedan)).replace("{tope}", String(tope)) : T.lleno}
        </p>
        <p className="mt-2 font-lectura text-sm text-acero">
          {T.dados.replace("{n}", String(dados))}
          {ejemplo ? <span className="ml-2 text-acero/70">({T.ejemplo})</span> : null}
        </p>
      </div>
      <div aria-hidden className="grid w-full max-w-xl grid-cols-20 gap-1 sm:gap-1.5">
        {Array.from({ length: tope }, (_, i) => (
          <span
            key={i}
            className={`aspect-square rounded-[2px] ${i < dados ? "bg-blanco" : "border border-profundo"} ${
              i === dados ? "border-[var(--acento)]" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}
