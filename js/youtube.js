/**
 * Heavy Metal Rock TV - Video Hub & Facade Embed Engine
 * Module: YouTube Video Manager & Filter
 */

(() => {
    'use strict';

    // DOM Elements
    const searchInput = document.getElementById('videoSearchInput');
    const searchClearBtn = document.getElementById('videoSearchClearBtn');
    const filterButtons = document.querySelectorAll('.video-filter-btn');
    const videoCards = document.querySelectorAll('.video-card');
    const videosCount = document.getElementById('videosCount');

    let currentCategory = 'todos';
    let currentQuery = '';

    // Inyección de iframes bajo demanda (Facade Pattern)
    function initFacades() {
        document.querySelectorAll('.video-facade').forEach(facade => {
            facade.addEventListener('click', () => {
                const videoId = facade.getAttribute('data-video-id');
                const title = facade.getAttribute('data-title') || 'YouTube Video';
                if (!videoId) return;

                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                iframe.title = title;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.referrerPolicy = 'strict-origin-when-cross-origin';
                iframe.allowFullscreen = true;

                facade.innerHTML = '';
                facade.classList.add('playing');
                facade.appendChild(iframe);
            });
        });
    }

    // Filtrado combinado (Categoría + Búsqueda de texto)
    function filterVideos() {
        let visible = 0;

        videoCards.forEach(card => {
            const category = card.getAttribute('data-category') || '';
            const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
            const desc = (card.querySelector('p')?.textContent || '').toLowerCase();

            const matchesCategory = currentCategory === 'todos' || category.includes(currentCategory);
            const matchesQuery = !currentQuery || title.includes(currentQuery) || desc.includes(currentQuery);

            if (matchesCategory && matchesQuery) {
                card.style.display = 'flex';
                visible++;
            } else {
                card.style.display = 'none';
            }
        });

        if (videosCount) {
            videosCount.textContent = `(${visible})`;
        }
    }

    // Eventos de Filtros por Categoría
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.getAttribute('data-category') || 'todos';
            filterVideos();
        });
    });

    // Eventos de Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentQuery = e.target.value.trim().toLowerCase();
            if (searchClearBtn) {
                searchClearBtn.style.display = currentQuery ? 'block' : 'none';
            }
            filterVideos();
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            searchClearBtn.style.display = 'none';
            currentQuery = '';
            filterVideos();
        });
    }

    // Inicialización
    initFacades();
    if (videosCount) {
        videosCount.textContent = `(${videoCards.length})`;
    }
})();
