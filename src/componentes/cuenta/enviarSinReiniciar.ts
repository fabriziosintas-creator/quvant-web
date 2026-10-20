import { startTransition, type FormEvent } from "react";

/**
 * Manda el formulario a la acción del servidor sin que React lo reinicie
 * después (con <form action={…}> React vuelve cada campo a su valor
 * inicial). Ese reinicio borraba lo escrito si había un error y, peor,
 * devolvía en silencio un radio controlado (el rubro) al valor de la
 * primera carga: se veía "Otro rubro" y se mandaba el de antes.
 */
export function enviarSinReiniciar(accion: (datos: FormData) => void) {
  return (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => accion(datos));
  };
}
