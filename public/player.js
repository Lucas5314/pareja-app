const picker = document.getElementById("filePicker");
const movie = document.getElementById("movie");

let pendingVideoUrl = null;

// cuando eliges archivo
picker.addEventListener("change", async (event) => {

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);

    const res = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    if (data.success) {

        // solo el host avisa al otro
        socket.emit("video-selected", {
            room,
            url: data.url
        });

        // host también lo carga
        loadVideo(data.url);

    }

});

function loadVideo(url) {

    movie.src = url;
    movie.load();

}

// cuando el otro recibe video
socket.on("video-selected", (url) => {

    pendingVideoUrl = url;

    showAcceptButton(url);

});