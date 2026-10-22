/**
 * Cuánto se avanzó por la invitación a "lo que te regalamos" (0 → 1). Lo
 * escribe InvitacionRegalo al scrollear y lo lee la Q 3D (QRegalo) en cada
 * cuadro. Vive aparte para que la sección no arrastre three.js al
 * importarlo: la Q se carga recién cuando hace falta.
 */
export const avanceRegalo = { valor: 0 };
