// ----------------------------
// SOCKET GLOBAL
// ----------------------------

window.socket = io();

// ----------------------------
// SALA
// ----------------------------

// De momento usamos una sala fija.
// Más adelante la cambiaremos por enlaces únicos.
window.room = "pareja1";

// ----------------------------
// CONEXIÓN
// ----------------------------

window.socket.on("connect", () => {

    console.log("Conectado:", window.socket.id);

    document.getElementById("status").textContent =
        "🟢 Conectado";

});

window.socket.on("disconnect", () => {

    document.getElementById("status").textContent =
        "🔴 Desconectado";

});