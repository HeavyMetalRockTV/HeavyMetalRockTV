/**
 * Heavy Metal Rock TV - Control de Navegación y UI Móvil
 */

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelector('.nav-links');
    const menuBtn = document.querySelector('.menu-btn');

    // Control del menú hamburguesa en móviles
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            const isVisible = navLinks.style.display === 'flex';
            navLinks.style.display = isVisible ? 'none' : 'flex';
        });

        // Cerrar el menú si la pantalla se redimensiona a escritorio
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                navLinks.style.display = 'flex';
            } else {
                navLinks.style.display = 'none';
            }
        });
    }
});

// ==========================================
// BOTÓN FLOTANTE GLOBAL DE WHATSAPP
// ==========================================
(function() {
    const WHATSAPP_NUMBER = "51999999999"; // Reemplaza con tu número oficial (con código de país sin '+')
    const DEFAULT_MSG = "¡Hola Heavy Metal Rock TV! 🤘 Deseo hacer una consulta.";
    const WA_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MSG)}`;

    // Inyectar estilos CSS dinámicos
    const style = document.createElement('style');
    style.textContent = `
        .whatsapp-float-btn {
            position: fixed;
            bottom: 25px;
            right: 25px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 4px 18px rgba(37, 211, 102, 0.45);
            z-index: 1000;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            text-decoration: none;
            border: 2px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
        }

        .whatsapp-float-btn svg {
            width: 32px;
            height: 32px;
            fill: #ffffff;
        }

        .whatsapp-float-btn:hover {
            transform: scale(1.12) translateY(-4px);
            box-shadow: 0 8px 25px rgba(37, 211, 102, 0.7);
            border-color: #ffffff;
        }

        /* Animación de Pulso / Radar */
        .whatsapp-float-btn::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: rgba(37, 211, 102, 0.6);
            z-index: -1;
            animation: wa-pulse 2s infinite;
        }

        @keyframes wa-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            70% { transform: scale(1.4); opacity: 0; }
            100% { transform: scale(1.4); opacity: 0; }
        }

        @media screen and (max-width: 768px) {
            .whatsapp-float-btn {
                bottom: 20px;
                right: 20px;
                width: 52px;
                height: 52px;
            }
            .whatsapp-float-btn svg {
                width: 28px;
                height: 28px;
            }
        }
    `;
    document.head.appendChild(style);

    // Crear el elemento HTML del botón con SVG nativo de WhatsApp
    const waButton = document.createElement('a');
    waButton.className = 'whatsapp-float-btn';
    waButton.href = WA_URL;
    waButton.target = '_blank';
    waButton.rel = 'noopener noreferrer';
    waButton.title = 'Contáctanos por WhatsApp';
    waButton.innerHTML = `
        <svg viewBox="0 0 32 32">
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.766.804 5.344 2.193 7.518L2.055 30.12l6.772-2.102C10.876 29.288 13.364 30 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.542c-2.31 0-4.48-.67-6.307-1.826l-.452-.288-4.218 1.31 1.334-4.108-.297-.473A11.455 11.455 0 0 1 4.458 16C4.458 9.636 9.636 4.458 16 4.458S27.542 9.636 27.542 16 22.364 27.542 16 27.542zm6.275-8.567c-.344-.172-2.036-1.005-2.351-1.12-.316-.115-.545-.172-.775.172s-.89 1.12-1.091 1.35c-.201.23-.402.259-.746.086s-1.456-.537-2.774-1.712c-1.026-.915-1.719-2.046-1.92-2.39-.201-.344-.021-.53.15-.701.155-.154.344-.402.516-.603s.23-.344.344-.573c.115-.23.057-.43-.029-.603s-.775-1.867-1.062-2.557c-.279-.672-.563-.58-.775-.591l-.66-.012c-.23 0-.603.086-.919.43s-1.206 1.178-1.206 2.872c0 1.694 1.234 3.33 1.407 3.56s2.43 3.71 5.887 5.202c.823.355 1.465.567 1.966.726.826.263 1.578.226 2.173.137.663-.099 2.036-.832 2.323-1.636s.287-1.493.201-1.636c-.086-.143-.316-.23-.66-.402z"/>
        </svg>
    `;

    // Insertar en el DOM cuando cargue el documento
    if (document.body) {
        document.body.appendChild(waButton);
    } else {
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(waButton));
    }
})();