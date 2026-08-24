/**
 * Heavy Metal Rock TV - Store Engine & Catalog Controller
 * Architecture: Unidirectional Data Flow / Reactive Memory Filter
 * Security: Strict Entity Escaping (Anti-XSS) & RFC 3986 Deep Linking
 * @author Arthas Menethil - Lich King Architecture ❄️
 */

(() => {
  'use strict';

  /**
   * @typedef {Object} Product
   * @property {string|number} id
   * @property {string} nombre
   * @property {string} categoria
   * @property {string} banda
   * @property {string} descripcion
   * @property {string} precio
   * @property {string} imagen
   */

  /** @type {Readonly<{DATA_URL: string, PAGE_SIZE: number, DEBOUNCE_MS: number, WHATSAPP_PHONE: string, DEFAULT_IMAGE: string}>} */
  const CONFIG = Object.freeze({
    DATA_URL: 'data/products.json',
    PAGE_SIZE: 12,
    DEBOUNCE_MS: 300,
    WHATSAPP_PHONE: '51950324368',
    DEFAULT_IMAGE: 'img/estetica/STORE.webp'
  });

  /**
   * Único punto de verdad inmutable para el estado del cliente
   */
  const STATE = {
    /** @type {Product[]} */
    allProducts: [],
    /** @type {Product[]} */
    filteredProducts: [],
    currentlyDisplayed: 0,
    activeCategory: 'todos',
    searchQuery: ''
  };

  /** Referencias cacheadas al árbol del DOM */
  const DOM = {
    container: document.getElementById('productsContainer'),
    loadMoreContainer: document.getElementById('loadMoreContainer'),
    btnLoadMore: document.getElementById('btnLoadMore'),
    searchInput: /** @type {HTMLInputElement} */ (document.getElementById('searchInput')),
    filterButtons: document.querySelectorAll('.filter-btn'),
    resultsCounter: document.getElementById('resultsCounter'),
    modal: document.getElementById('lightboxModal'),
    modalImg: /** @type {HTMLImageElement} */ (document.getElementById('lightboxImg')),
    modalCaption: document.getElementById('lightboxCaption'),
    modalClose: document.getElementById('lightboxClose')
  };

  // =========================================================================
  // 1. SEGURIDAD, ESCAPADO ESTRICTO & UTILIDADES CRÍTICAS 💀
  // =========================================================================
  const Security = {
    /**
     * Sanitiza cadenas primitivas neutralizando cualquier vector de inyección HTML/XSS.
     * @param {unknown} val
     * @returns {string}
     */
    escapeHTML(val) {
      if (val === null || val === undefined) return '';
      return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Resuelve URIs absolutas canónicas evitando rutas relativas rotas o ataques de path traversal.
     * @param {string} relativePath
     * @returns {string}
     */
    resolveCanonicalImage(relativePath) {
      if (!relativePath || typeof relativePath !== 'string') {
        return new URL(CONFIG.DEFAULT_IMAGE, window.location.href).href;
      }
      if (/^https?:\/\//i.test(relativePath)) {
        return relativePath;
      }
      try {
        return new URL(relativePath, window.location.href).href;
      } catch {
        return new URL(CONFIG.DEFAULT_IMAGE, window.location.href).href;
      }
    }
  };

  const Utils = {
    /**
     * Limita la tasa de invocación de eventos continuos en el Event Loop.
     * @param {Function} fn
     * @param {number} delay
     * @returns {(...args: any[]) => void}
     */
    debounce(fn, delay) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(null, args), delay);
      };
    },

    /**
     * Construye Deep Links normalizados RFC 3986 hacia la API de WhatsApp sin riesgo de truncamiento.
     * @param {Product} product
     * @returns {string}
     */
    buildWhatsAppDeepLink(product) {
      const canonicalImageUrl = Security.resolveCanonicalImage(product.imagen);
      
      const payload = 
        `*SOLICITUD DE PEDIDO - HEAVY METAL STORE* ⚡\n\n` +
        `📦 *Producto:* ${product.nombre || 'N/A'}\n` +
        `🎸 *Banda:* ${product.banda || 'N/A'}\n` +
        `🏷️ *Categoría:* ${product.categoria || 'N/A'}\n` +
        `💵 *Precio:* ${product.precio || 'Consultar'}\n` +
        `🖼️ *Vista Canónica:* ${canonicalImageUrl}\n\n` +
        `¿Disponen de stock en mi talla y qué métodos de pago (Yape/Plin/Transferencia) aceptan?`;

      return `https://api.whatsapp.com/send?phone=${CONFIG.WHATSAPP_PHONE}&text=${encodeURIComponent(payload)}`;
    }
  };

  // =========================================================================
  // 2. MOTOR DE RENDERIZADO ATÓMICO (DOCUMENT FRAGMENT) ⚙️
  // =========================================================================
  const Renderer = {
    /**
     * Fabrica un nodo <article> aislado en memoria RAM libre de reflows.
     * @param {Product} product
     * @returns {HTMLElement}
     */
    createProductCard(product) {
      const card = document.createElement('article');
      card.className = 'product-card';

      const safeName = Security.escapeHTML(product.nombre);
      const safeCat = Security.escapeHTML(product.categoria);
      const safeBand = Security.escapeHTML(product.banda);
      const safeDesc = Security.escapeHTML(product.descripcion);
      const safePrice = Security.escapeHTML(product.precio);
      const safeImg = Security.escapeHTML(product.imagen || CONFIG.DEFAULT_IMAGE);
      const waUrl = Utils.buildWhatsAppDeepLink(product);

      card.innerHTML = `
        <div class="product-card-img-wrapper" tabindex="0" role="button" aria-label="Ver afiche de ${safeName}">
          <span class="badge-category">${safeCat}</span>
          <img 
            src="${safeImg}" 
            alt="${safeName}" 
            loading="lazy" 
            width="300" 
            height="260" 
            onerror="this.onerror=null;this.src='${CONFIG.DEFAULT_IMAGE}';"
          >
        </div>
        <div class="product-card-body">
          <div>
            <div class="product-band">${safeBand}</div>
            <h3>${safeName}</h3>
            <p class="product-desc">${safeDesc}</p>
          </div>
          <div class="product-footer">
            <div class="product-price">${safePrice}</div>
            <a class="btn-order" href="${waUrl}" target="_blank" rel="noopener noreferrer" aria-label="Pedir ${safeName} por WhatsApp">
              💬 Pedir
            </a>
          </div>
        </div>
      `;

      // Delegación de eventos accesibles para apertura de Lightbox
      const mediaWrapper = card.querySelector('.product-card-img-wrapper');
      if (mediaWrapper) {
        mediaWrapper.addEventListener('click', () => Lightbox.open(safeImg, safeName));
        mediaWrapper.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            Lightbox.open(safeImg, safeName);
          }
        });
      }

      return card;
    },

    /**
     * Renderiza bloques de artículos mediante una única mutación de layout.
     * @param {boolean} [isReset=false]
     */
    renderBatch(isReset = false) {
      if (!DOM.container) return;

      if (isReset) {
        DOM.container.replaceChildren();
        STATE.currentlyDisplayed = 0;
      }

      const totalItems = STATE.filteredProducts.length;

      if (totalItems === 0) {
        DOM.container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">
            <h3>No se encontraron reliquias para tu búsqueda 💀</h3>
          </div>`;
        if (DOM.loadMoreContainer) DOM.loadMoreContainer.style.display = 'none';
        return;
      }

      const nextBatch = STATE.filteredProducts.slice(
        STATE.currentlyDisplayed,
        STATE.currentlyDisplayed + CONFIG.PAGE_SIZE
      );

      // Inyección atómica: 0 reflows dentro del bucle
      const fragment = document.createDocumentFragment();
      nextBatch.forEach(product => fragment.appendChild(Renderer.createProductCard(product)));
      DOM.container.appendChild(fragment);

      STATE.currentlyDisplayed += nextBatch.length;

      if (DOM.loadMoreContainer) {
        DOM.loadMoreContainer.style.display = (STATE.currentlyDisplayed < totalItems) ? 'flex' : 'none';
      }
    }
  };

  // =========================================================================
  // 3. MOTOR DE FILTRADO UNIFICADO Y REACTIVO (CERO CONDICIONES DE CARRERA) 🗡️
  // =========================================================================
  const FilterEngine = {
    /**
     * Sincroniza el contador visual de coincidencias en tiempo real.
     */
    updateCounter() {
      if (!DOM.resultsCounter) return;
      const total = STATE.filteredProducts.length;

      if (total === 0) {
        DOM.resultsCounter.innerHTML = `No se encontraron productos para <span>"${Security.escapeHTML(STATE.searchQuery)}"</span> 💀`;
        return;
      }

      let label = `Mostrando <span>${total}</span> producto${total === 1 ? '' : 's'}`;
      if (STATE.searchQuery) {
        label += ` encontrado${total === 1 ? '' : 's'} para <span>"${Security.escapeHTML(STATE.searchQuery)}"</span>`;
      } else if (STATE.activeCategory !== 'todos') {
        label += ` en la categoría <span>"${Security.escapeHTML(STATE.activeCategory)}"</span>`;
      } else {
        label += ` disponible${total === 1 ? '' : 's'}`;
      }

      DOM.resultsCounter.innerHTML = label;
    },

    /**
     * Aplica la intersección lógica estricta: (Categoría) AND (Búsqueda)
     */
    apply() {
      const rawQuery = STATE.searchQuery.trim().toLowerCase();

      STATE.filteredProducts = STATE.allProducts.filter(item => {
        // Validación de categoría (case-insensitive)
        const matchesCategory = 
          (STATE.activeCategory === 'todos') ||
          (item.categoria && item.categoria.toLowerCase() === STATE.activeCategory.toLowerCase());

        // Búsqueda multi-campo
        const matchesSearch = 
          !rawQuery ||
          (item.nombre && item.nombre.toLowerCase().includes(rawQuery)) ||
          (item.banda && item.banda.toLowerCase().includes(rawQuery)) ||
          (item.descripcion && item.descripcion.toLowerCase().includes(rawQuery));

        return matchesCategory && matchesSearch;
      });

      FilterEngine.updateCounter();
      Renderer.renderBatch(true);
    }
  };

  // =========================================================================
  // 4. CONTROL DE MODAL LIGHTBOX
  // =========================================================================
  const Lightbox = {
    open(src, alt) {
      if (!DOM.modal) return;
      DOM.modal.classList.add('active');
      DOM.modal.setAttribute('aria-hidden', 'false');
      if (DOM.modalImg) {
        DOM.modalImg.src = src;
        DOM.modalImg.alt = alt;
      }
      if (DOM.modalCaption) DOM.modalCaption.textContent = alt;
      document.body.style.overflow = 'hidden';
    },

    close() {
      if (!DOM.modal) return;
      DOM.modal.classList.remove('active');
      DOM.modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = 'auto';
    }
  };

  // =========================================================================
  // 5. REGISTRO DETERMINISTA DE EVENT LISTENERS
  // =========================================================================
  function bindEvents() {
    // Paginación por demanda
    if (DOM.btnLoadMore) {
      DOM.btnLoadMore.addEventListener('click', () => Renderer.renderBatch(false));
    }

    // Búsqueda en vivo optimizada por Debounce
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', Utils.debounce((e) => {
        STATE.searchQuery = e.target.value;
        FilterEngine.apply();
      }, CONFIG.DEBOUNCE_MS));
    }

    // Filtro por Chips de Categoría
    DOM.filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        DOM.filterButtons.forEach(b => b.classList.remove('active'));
        const target = /** @type {HTMLElement} */ (e.currentTarget);
        target.classList.add('active');
        STATE.activeCategory = target.getAttribute('data-category') || 'todos';
        FilterEngine.apply();
      });
    });

    // Control de cierre de modal
    if (DOM.modalClose) {
      DOM.modalClose.addEventListener('click', Lightbox.close);
    }

    if (DOM.modal) {
      DOM.modal.addEventListener('click', (e) => {
        if (e.target === DOM.modal) Lightbox.close();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.modal && DOM.modal.classList.contains('active')) {
        Lightbox.close();
      }
    });
  }

  // =========================================================================
  // 6. INICIALIZACIÓN DEL SISTEMA
  // =========================================================================
  async function init() {
    if (!DOM.container) return;

    try {
      const res = await fetch(CONFIG.DATA_URL, {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Imposible recuperar catálogo.`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Estructura corrupta: products.json debe contener un array.');
      }

      STATE.allProducts = data;
      STATE.filteredProducts = [...data];

      bindEvents();
      FilterEngine.updateCounter();
      Renderer.renderBatch(true);
    } catch (err) {
      console.error('[Store Core Failure]:', err);
      if (DOM.container) {
        DOM.container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ff4d4d;">
            <h3>Fallo Crítico al Cargar el Inventario 💀</h3>
            <p style="color: #888;">Verifica la sintaxis e integridad de data/products.json.</p>
          </div>`;
      }
      if (DOM.resultsCounter) {
        DOM.resultsCounter.textContent = 'Error al cargar productos.';
      }
    }
  }

  // Despertar la forja en el momento preciso del ciclo de vida del DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();