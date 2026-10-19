/**
 * El script que va en <head> (app/layout.tsx) y decide, antes de que se
 * pinte nada, dos cosas:
 *
 * 1. Modo liviano: en celulares muy modestos (2 GB de memoria o menos, o
 *    2 núcleos o menos) o con "ahorro de datos" activado, marca
 *    <html data-liviano="si">. Ahí no corre la intro, la portada muestra la
 *    imagen fija en vez del video, el brillo de fondo queda quieto y las
 *    barras fijas no desenfocan lo de atrás (ver globals.css y useLiviano).
 *
 * 2. Si el logo de la portada sintoniza como una tele (IntroTV): en cada
 *    carga de "/", con WebGL 2, en vista 3D, sin "menos movimiento" y fuera
 *    del modo liviano. Si corre, marca <html data-intro="si"> (y el CSS
 *    esconde el título real hasta que la palabra engancha).
 *
 * Para verla de nuevo a propósito: entrar a la portada con ?intro en la
 * dirección (por ejemplo quvant-web.vercel.app/?intro). Solo pide WebGL 2.
 *
 * Vive aparte (sin "use client") para que el layout del servidor lo
 * reciba como texto.
 */
export const DECIDIR_INTRO = `(function(){try{
var d=document.documentElement,n=navigator,c0=n.connection;
var liviano=(c0&&c0.saveData)||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=2);
if(liviano)d.dataset.liviano="si";
if(location.pathname!=="/")return;
var forzada=new URLSearchParams(location.search).has("intro");
if(!forzada){
if(liviano)return;
if(localStorage.getItem("quvant-vista")==="texto")return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
}
var c=document.createElement("canvas");if(!c.getContext("webgl2"))return;
d.dataset.intro="si";
}catch(e){}})();`;

