// Definir un array con las URLs de las imágenes de fondo
var backgrounds = [
    'url("img/estetica/uniontodasbandas.jpg") center/cover fixed',
    'url("img/estetica/deathleprosy.jpg") center/cover fixed',
    'url("img/estetica/judaspriest.jpg") center/cover fixed',
    'url("img/estetica/ozzy.jpg") center/cover fixed',
    'url("img/estetica/ironmaidenwallpaper.jpg") center/cover fixed'
    'url("img/estetica/manowar.jpg") center/cover fixed'
    'url("img/estetica/motley crue.jpg") center/cover fixed'
];

// Inicializar el índice actual
var currentIndex = 0;

function cambiarFondoEnOrden() {
    // Establecer la nueva imagen de fondo
    document.body.style.background = backgrounds[currentIndex];

    // Incrementar el índice y reiniciarlo si llega al final del array
    currentIndex = (currentIndex + 1) % backgrounds.length;
}

// Cambiar el fondo automáticamente cada 5 segundos (5000 milisegundos)
setInterval(cambiarFondoEnOrden, 5000);

var songs = [
    { title: 'Cannibal Corpse - Evisceration Plague', file: 'music/Cannibal Corpse - Evisceration Plague.mp3', albumArt: 'img/albums/cannibal corpse.jpg' },
    { title: 'Ozzy Osbourne - Crazy Train', file: 'music/Ozzy Osbourne - Crazy Train.mp3', albumArt: 'img/albums/ozzy osbourne.png' },
    { title: 'Dio - Rainbow In The Dark', file: 'music/Dio - Rainbow In The Dark.mp3', albumArt: 'img/albums/dio_1.jpg' },
    { title: 'Judas Priest - Trial By Fire', file: 'music/Judas Priest - Trial By Fire.mp3', albumArt: 'img/albums/Judas Priest.jpeg' },
    { title: 'Anthrax - Keep It In The Family', file: 'music/Anthrax - Keep It In The Family.mp3', albumArt: 'img/albums/anthrax.jpeg' },
    { title: 'Dio - Another Lie', file: 'music/Dio - Another Lie.mp3', albumArt: 'img/albums/dio_2.jpeg' },
    { title: 'Nightwish - Bless The Child', file: 'music/Nightwish - Bless The Child.mp3', albumArt: 'img/albums/nightwish.jpeg' },
    { title: 'Cradle Of Filth - Cruelty Brought Thee Orchids ', file: 'music/Cradle Of Filth - Cruelty Brought Thee Orchids .mp3', albumArt: 'img/albums/Cradle Of Filth.jpg' },
    { title: 'SLAUGHTER TO PREVAIL - Bratva', file: 'music/SLAUGHTER TO PREVAIL - Bratva.mp3', albumArt: 'img/albums/SLAUGHTER TO PREVAIL.jpg' },
    // Agrega más canciones según sea necesario
];



var currentSongIndex = 0;

var isInitialLoad = true;  // Nueva variable para rastrear la carga inicial

function playSong() {
    var audioPlayer = document.getElementById('audio-player');
    audioPlayer.src = songs[currentSongIndex].file;

    // Si es la carga inicial, no reproduzcas la canción automáticamente
    if (!isInitialLoad) {
        audioPlayer.play();
    }

    updateSongInfo();
}


function updateSongInfo() {
    var currentSongElement = document.getElementById('current-song');
    currentSongElement.textContent = songs[currentSongIndex].title;

    var albumArtElement = document.getElementById('album-art-small');
    albumArtElement.src = songs[currentSongIndex].albumArt;
}


function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong();
}

function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong();
}


window.onload = function () {
    cambiarFondoEnOrden();
    playSong();
    isInitialLoad = false;
};


var isPlaying = false;  // Variable para rastrear el estado de reproducción

function togglePlayPause() {
    var audioPlayer = document.getElementById('audio-player');

    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play();
    }

    isPlaying = !isPlaying;  // Cambia el estado de reproducción
    updatePlayPauseButton();  // Actualiza el símbolo del botón
}

function toggleMusicPlayer() {
    var musicPlayer = document.getElementById("music-player");
    var songListContainer = document.getElementById("song-list-container");

    // Cambiar la visibilidad del reproductor de música
    musicPlayer.style.display = (musicPlayer.style.display === "none" || musicPlayer.style.display === "") ? "block" : "none";

    // Ocultar la lista de canciones al mostrar el reproductor de música
    songListContainer.style.display = "none";

    // Actualizar la lista de canciones al mostrar el reproductor de música
    if (musicPlayer.style.display === "block") {
        updateSongList();
    }
}

function toggleSongList() {
    var songListContainer = document.getElementById('song-list-container');
    songListContainer.style.display = (songListContainer.style.display === 'none' || songListContainer.style.display === '') ? 'block' : 'none';
}


function updateSongList() {
    var songListContainer = document.getElementById("song-list-container");
    songListContainer.innerHTML = ""; // Limpiar la lista de canciones antes de actualizar

    var ul = document.createElement("ul");

    songs.forEach(function (song, index) {
        var li = document.createElement("li");
        li.textContent = song.title;

        // Agregar evento de clic para reproducir la canción al hacer clic en la lista
        li.addEventListener("click", function () {
            currentSongIndex = index;
            playSong();
        });

        ul.appendChild(li);
    });

    songListContainer.appendChild(ul);
}

function playSavedSong() {
    var audioPlayer = document.getElementById("audio-player");
    var savedSong = localStorage.getItem("currentSong");
    if (savedSong) {
        audioPlayer.src = savedSong;
        audioPlayer.play();
    }
}


function toggleMenu() {
    var navLinks = document.querySelector('.nav-links');
    navLinks.style.display = (navLinks.style.display === 'none' || navLinks.style.display === '') ? 'flex' : 'none';
}
