/**
 * La guardia de dominio: un script chico que va en el <head> de todas las
 * páginas (ver app/layout.tsx). Si el sitio se abre desde un dominio que
 * no es el nuestro (alguien guardó la página y la publicó en otro lado, o
 * la abrió desde una copia en su computadora), avisa al panel con el
 * dominio de la copia (/api/copia, un aviso "Copia del sitio") y lleva a
 * la persona a quvant.com.ar, a la misma página.
 *
 * El dominio va escrito en base64: un "buscar y reemplazar quvant.com.ar"
 * en la copia no lo encuentra. Se permiten el dominio propio, el entorno
 * local y las vistas previas de Vercel de este proyecto.
 *
 * No impide mirar el código (nada lo impide: el navegador lo tiene que
 * descargar para mostrarlo), pero hace que una copia publicada no sirva y
 * que nos enteremos.
 */

const DOMINIO_B64 = Buffer.from("quvant.com.ar").toString("base64");
/** Las vistas previas de Vercel de este proyecto terminan así (ver scripts/supabase-urls.mjs). */
const PREVIA_B64 = Buffer.from("-yunque2.vercel.app").toString("base64");

export const GUARDIA_DOMINIO = `(function(){try{var d=atob("${DOMINIO_B64}"),p=atob("${PREVIA_B64}"),h=location.hostname;if(h===d||h==="www."+d||h==="localhost"||h==="127.0.0.1"||(h.length>p.length&&h.slice(-p.length)===p))return;var o="https://www."+d;try{navigator.sendBeacon(o+"/api/copia",JSON.stringify({host:h||"archivo-local",url:String(location.href).slice(0,300)}))}catch(e){}location.replace(o+location.pathname+location.search)}catch(e){}})();`;
