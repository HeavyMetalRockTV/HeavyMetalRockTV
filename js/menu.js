/**
 * Heavy Metal Rock TV - Global Core Engine
 * Handled by the Frozen Throne ❄️
 */

(() => {
    'use strict';

    const WHATSAPP_NUMBER = "51950324368";
    const DEFAULT_MSG = "¡Hola Heavy Metal Rock TV! 🤘 Deseo hacer una consulta.";
    const WA_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MSG)}`;

    // Inyección atómica del botón flotante global
    function initWhatsAppFloat() {
        if (document.querySelector('.whatsapp-float-btn')) return;

        const waButton = document.createElement('a');
        waButton.className = 'whatsapp-float-btn';
        waButton.href = WA_URL;
        waButton.target = '_blank';
        waButton.rel = 'noopener noreferrer';
        waButton.setAttribute('aria-label', 'Contactar por WhatsApp');
        waButton.innerHTML = `
            <svg viewBox="0 0 32 32" width="32" height="32" fill="#ffffff" aria-hidden="true">
                <path d="M16 2C8.268 2 2 8.268 2 16c0 2.766.804 5.344 2.193 7.518L2.055 30.12l6.772-2.102C10.876 29.288 13.364 30 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.542c-2.31 0-4.48-.67-6.307-1.826l-.452-.288-4.218 1.31 1.334-4.108-.297-.473A11.455 11.455 0 0 1 4.458 16C4.458 9.636 9.636 4.458 16 4.458S27.542 9.636 27.542 16 22.364 27.542 16 27.542zm6.275-8.567c-.344-.172-2.036-1.005-2.351-1.12-.316-.115-.545-.172-.775.172s-.89 1.12-1.091 1.35c-.201.23-.402.259-.746.086s-1.456-.537-2.774-1.712c-1.026-.915-1.719-2.046-1.92-2.39-.201-.344-.021-.53.15-.701.155-.154.344-.402.516-.603s.23-.344.344-.573c.115-.23.057-.43-.029-.603s-.775-1.867-1.062-2.557c-.279-.672-.563-.58-.775-.591l-.66-.012c-.23 0-.603.086-.919.43s-1.206 1.178-1.206 2.872c0 1.694 1.234 3.33 1.407 3.56s2.43 3.71 5.887 5.202c.823.355 1.465.567 1.966.726.826.263 1.578.226 2.173.137.663-.099 2.036-.832 2.323-1.636s.287-1.493.201-1.636c-.086-.143-.316-.23-.66-.402z"/>
            </svg>
        `;
        document.body.appendChild(waButton);
    }

    // Lightbox Global para imágenes con clase .zoomable-img
    function initGlobalLightbox() {
        const modal = document.getElementById('lightboxModal');
        if (!modal) return;

        const modalImg = document.getElementById('lightboxImg');
        const captionText = document.getElementById('lightboxCaption');
        const closeBtn = document.getElementById('lightboxClose');

        window.openLightbox = (src, alt = '') => {
            modal.classList.add('active');
            if (modalImg) {
                modalImg.src = src;
                modalImg.alt = alt;
            }
            if (captionText) captionText.textContent = alt;
            document.body.style.overflow = 'hidden';
        };

        window.closeLightbox = () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        };

        document.querySelectorAll('.zoomable-img').forEach(img => {
            img.addEventListener('click', () => window.openLightbox(img.src, img.alt));
        });

        if (closeBtn) closeBtn.addEventListener('click', window.closeLightbox);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                window.closeLightbox();
            }
        });
    }

    // Registro seguro de Service Worker (Compatible con HTTPS y Localhost)
    function registerServiceWorker() {
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if ('serviceWorker' in navigator && isSecure) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js', { scope: './' })
                    .catch(err => console.error('[SW Registration Error]:', err));
            });
        }
    }

    // Inicialización del motor
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initWhatsAppFloat();
            initGlobalLightbox();
            registerServiceWorker();
        });
    } else {
        initWhatsAppFloat();
        initGlobalLightbox();
        registerServiceWorker();
    }
})();