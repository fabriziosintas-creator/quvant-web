/**
 * El reloj virtual para grabar cuadro por cuadro. Es un script común de
 * navegador (no un módulo): el grabador lo inyecta antes de que cargue la
 * página con addInitScript({ path }).
 *
 * Reemplaza performance.now, Date, requestAnimationFrame, setTimeout y
 * setInterval por un reloj que solo avanza cuando el grabador lo pide
 * (window.__avanzar(ms)), y adelanta a mano las animaciones CSS.
 *
 * Así cada cuadro se dibuja entero antes de fotografiarlo: el video sale
 * fluido aunque la máquina tarde lo que tarde en dibujar el 3D (la toma en
 * vivo se trababa cada vez que la notebook no llegaba a tiempo).
 */
(() => {
  if (window.__avanzar) return;
  let ahora = 0;
  const base = Date.now();
  const DateReal = Date;
  const tSetTimeout = window.setTimeout.bind(window);

  performance.now = () => ahora;
  class DateVirtual extends DateReal {
    constructor(...args) {
      if (args.length === 0) super(base + ahora);
      else super(...args);
    }
    static now() {
      return base + ahora;
    }
  }
  window.Date = DateVirtual;

  let siguienteId = 1;
  const cuadros = new Map();
  window.requestAnimationFrame = (cb) => {
    const id = siguienteId++;
    cuadros.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id) => cuadros.delete(id);

  const timers = new Map();
  const programar = (cb, ms, args, repetir) => {
    const id = siguienteId++;
    const espera = Math.max(repetir ? 1 : 0, Number(ms) || 0);
    timers.set(id, { a: ahora + espera, cb, args, cada: repetir ? espera : 0 });
    return id;
  };
  window.setTimeout = (cb, ms, ...args) => programar(cb, ms, args, false);
  window.setInterval = (cb, ms, ...args) => programar(cb, ms, args, true);
  window.clearTimeout = window.clearInterval = (id) => timers.delete(id);

  const conocidas = new WeakSet();
  const respiro = () => new Promise((ok) => tSetTimeout(ok, 0));

  window.__ahora = () => ahora;
  window.__avanzar = async (dt) => {
    const fin = ahora + dt;
    for (let vuelta = 0; vuelta < 10000; vuelta++) {
      let proximo = null;
      for (const [id, t] of timers) if (t.a <= fin && (!proximo || t.a < proximo[1].a)) proximo = [id, t];
      if (!proximo) break;
      const [id, t] = proximo;
      ahora = Math.max(ahora, t.a);
      if (t.cada) t.a += t.cada;
      else timers.delete(id);
      try {
        if (typeof t.cb === "function") t.cb(...t.args);
      } catch (error) {
        console.error(error);
      }
      await Promise.resolve();
    }
    ahora = fin;
    for (const animacion of document.getAnimations()) {
      try {
        if (!conocidas.has(animacion)) {
          conocidas.add(animacion);
          animacion.pause();
          animacion.currentTime = 0;
        }
        animacion.currentTime = (animacion.currentTime ?? 0) + dt;
      } catch {}
    }
    const pendientes = [...cuadros.values()];
    cuadros.clear();
    for (const cb of pendientes) {
      try {
        cb(ahora);
      } catch (error) {
        console.error(error);
      }
    }
    await respiro();
  };
})();
