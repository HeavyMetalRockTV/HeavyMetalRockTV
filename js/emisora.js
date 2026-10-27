/**
 * Heavy Metal Rock TV - Radio Player & Broadcast Engine
 * Module: HMR Radio Station Controller
 */

(() => {
    'use strict';

    const STREAM_URL = 'https://heavymetalextremo.radio12345.com/';
    const DIRECT_STREAM_FALLBACK = 'http://heavymetalextremo.radio12345.com';
    const WHATSAPP_NUMBER = '51950324368';

    // DOM Elements
    const audioPlayer = document.getElementById('radioAudio');
    const playBtn = document.getElementById('radioPlayBtn');
    const playIcon = document.getElementById('radioPlayIcon');
    const playText = document.getElementById('radioPlayText');
    const statusText = document.getElementById('radioStatusDisplay');
    const visualizer = document.getElementById('audioVisualizer');
    const volumeSlider = document.getElementById('volumeSlider');
    const muteBtn = document.getElementById('muteBtn');
    const muteIcon = document.getElementById('muteIcon');
    const popupBtn = document.getElementById('radioPopupBtn');
    const requestSongBtn = document.getElementById('requestSongBtn');

    let isPlaying = false;
    let lastVolume = 0.8;

    // Inicializar estado del audio
    if (audioPlayer) {
        audioPlayer.volume = 0.8;
    }

    function updatePlayState(playing) {
        isPlaying = playing;
        if (playing) {
            if (playBtn) playBtn.classList.add('playing');
            if (playIcon) playIcon.textContent = '⏸';
            if (playText) playText.textContent = 'DETENER SEÑAL';
            if (statusText) statusText.textContent = 'TRANSMITIENDO EN VIVO (320 KBPS)';
            if (visualizer) visualizer.classList.add('active');
        } else {
            if (playBtn) playBtn.classList.remove('playing');
            if (playIcon) playIcon.textContent = '▶';
            if (playText) playText.textContent = 'SINTONIZAR EN DIRECTO';
            if (statusText) statusText.textContent = 'SEÑAL EN ESPERA - HAZ CLIC PARA REPRODUCIR';
            if (visualizer) visualizer.classList.remove('active');
        }
    }

    // Toggle Reproducción
    function togglePlay() {
        if (!audioPlayer) {
            window.open(STREAM_URL, '_blank', 'noopener,noreferrer');
            return;
        }

        if (isPlaying) {
            audioPlayer.pause();
            audioPlayer.src = '';
            updatePlayState(false);
        } else {
            if (statusText) statusText.textContent = 'CONECTANDO AL SERVIDOR DE AUDIO...';
            // Asignar el stream con timestamp para evitar cache congelada
            audioPlayer.src = `http://heavymetalextremo.radio12345.com/;stream.mp3?nocache=${Date.now()}`;
            
            const playPromise = audioPlayer.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        updatePlayState(true);
                    })
                    .catch(() => {
                        // Si el navegador bloquea la reproducción de audio mixto o requiere sesión externa
                        if (statusText) statusText.textContent = 'ABRIENDO SERVIDOR DE TRANSMISIÓN...';
                        setTimeout(() => {
                            window.open(STREAM_URL, 'HMRRadioPlayer', 'width=460,height=620,menubar=no,toolbar=no,location=no,status=no');
                            updatePlayState(false);
                        }, 500);
                    });
            }
        }
    }

    // Manejo de eventos nativos del elemento de audio
    if (audioPlayer) {
        audioPlayer.addEventListener('playing', () => updatePlayState(true));
        audioPlayer.addEventListener('pause', () => updatePlayState(false));
        audioPlayer.addEventListener('waiting', () => {
            if (statusText) statusText.textContent = 'BUFFERING SEÑAL DE AUDIO...';
        });
        audioPlayer.addEventListener('error', () => {
            if (statusText) statusText.textContent = 'ABRIENDO REPRODUCTOR EN VENTANA EXTERNA...';
            updatePlayState(false);
            window.open(STREAM_URL, 'HMRRadioPlayer', 'width=460,height=620,menubar=no,toolbar=no,location=no,status=no');
        });
    }

    // Control de volumen
    if (volumeSlider && audioPlayer) {
        volumeSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            audioPlayer.volume = val;
            if (val === 0) {
                if (muteIcon) muteIcon.textContent = '🔇';
            } else {
                if (muteIcon) muteIcon.textContent = '🔊';
                lastVolume = val;
            }
        });
    }

    // Botón de mute
    if (muteBtn && audioPlayer) {
        muteBtn.addEventListener('click', () => {
            if (audioPlayer.volume > 0) {
                lastVolume = audioPlayer.volume;
                audioPlayer.volume = 0;
                if (volumeSlider) volumeSlider.value = 0;
                if (muteIcon) muteIcon.textContent = '🔇';
            } else {
                audioPlayer.volume = lastVolume || 0.8;
                if (volumeSlider) volumeSlider.value = audioPlayer.volume;
                if (muteIcon) muteIcon.textContent = '🔊';
            }
        });
    }

    // Botón ventana emergente (Pop-up Player)
    if (popupBtn) {
        popupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Pausar el reproductor interno si estaba sonando para no duplicar audio
            if (audioPlayer && isPlaying) {
                audioPlayer.pause();
                updatePlayState(false);
            }
            window.open(STREAM_URL, 'HMRRadioPlayer', 'width=460,height=620,menubar=no,toolbar=no,location=no,status=no');
        });
    }

    // Botón Pedir Canción por WhatsApp
    if (requestSongBtn) {
        requestSongBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const msg = '¡Hola Heavy Metal Radio! 🤘 Quisiera solicitar un tema para la transmisión: [Banda / Canción] Saludos a la comunidad.';
            const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');
        });
    }

    // Escucha del botón principal
    if (playBtn) {
        playBtn.addEventListener('click', togglePlay);
    }
})();
