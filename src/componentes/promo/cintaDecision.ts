/**
 * El script de <head> (app/layout.tsx) que decide, antes del primer
 * pintado, si la cinta de "Primeros 100" se ve: si la persona la cerró
 * hace menos de 7 días, marca <html data-cinta-cerrada="si"> y el CSS ni
 * la dibuja ni le reserva lugar. Así la página no salta al cargar.
 *
 * Vive aparte (sin "use client") para que el layout del servidor lo
 * reciba como texto.
 */
export const CLAVE_CINTA = "quvant-cinta-promo";
export const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

export const DECIDIR_CINTA = `(function(){try{var t=+(localStorage.getItem("${CLAVE_CINTA}")||0);if(t&&Date.now()-t<${SIETE_DIAS})document.documentElement.dataset.cintaCerrada="si";}catch(e){}})();`;
