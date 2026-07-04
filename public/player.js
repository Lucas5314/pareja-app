const picker = document.getElementById("filePicker");
const movie = document.getElementById("movie");

// ----------------------------
// SUBIR VIDEO
// ----------------------------

picker.addEventListener("change", async (event) => {

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);

    try {

        const res = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (!data.success) return;

        // cargar en quien lo subió
        loadVideo(data.url);

        // avisar al otro usuario
        window.socket.emit("video-selected", {
            room: window.room,
            url: data.url
        });

    } catch (err) {

        console.error("Error subiendo video:", err);

    }

});

// ----------------------------
// CARGAR VIDEO
// ----------------------------

function loadVideo(url) {

    movie.src = url;
    movie.load();

}

// ----------------------------
// RECIBIR VIDEO DEL OTRO
// ----------------------------

window.socket.on("video-selected", (url) => {

    loadVideo(url);

});