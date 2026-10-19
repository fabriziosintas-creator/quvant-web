/**
 * El script que va en <head> (app/layout.tsx) y decide, antes de que se
 * pinte nada, si el logo de la portada sintoniza como una tele (IntroTV):
 * en cada carga de "/", con WebGL 2, en vista 3D y sin "menos movimiento".
 * Si corre, marca <html data-intro="si"> (y el CSS esconde el título real
 * hasta que la palabra engancha).
 *
 * Para verla de nuevo a propósito: entrar a la portada con ?intro en la
 * dirección (por ejemplo quvant-web.vercel.app/?intro). Solo pide WebGL 2.
 *
 * Vive aparte (sin "use client") para que el layout del servidor lo
 * reciba como texto.
 */
export const DECIDIR_INTRO = `(function(){try{
var d=document.documentElement;
if(location.pathname!=="/")return;
var forzada=new URLSearchParams(location.search).has("intro");
if(!forzada){
if(localStorage.getItem("quvant-vista")==="texto")return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
}
var c=document.createElement("canvas");if(!c.getContext("webgl2"))return;
d.dataset.intro="si";
}catch(e){}})();`;

