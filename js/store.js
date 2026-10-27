/**
 * Heavy Metal Rock TV - Store Engine & Catalog Controller 2.0
 * Architecture: Unidirectional Data Flow / Reactive Filter & Sort / LocalStorage Cart
 * Security: Strict Entity Escaping (Anti-XSS), Protocol Whitelist & Safe Deep Linking
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

  /**
   * @typedef {Object} CartItem
   * @property {string|number} id
   * @property {string} nombre
   * @property {string} categoria
   * @property {string} banda
   * @property {string} precio
   * @property {number} numericPrice
   * @property {string} imagen
   * @property {number} quantity
   */

  /** @type {Readonly<{DATA_URL: string, PAGE_SIZE: number, DEBOUNCE_MS: number, WHATSAPP_PHONE: string, DEFAULT_IMAGE: string, CART_STORAGE_KEY: string}>} */
  const CONFIG = Object.freeze({
    DATA_URL: 'data/products.json',
    PAGE_SIZE: 12,
    DEBOUNCE_MS: 250,
    WHATSAPP_PHONE: '51950324368',
    DEFAULT_IMAGE: 'img/estetica/STORE.webp',
    CART_STORAGE_KEY: 'hmrtv_store_cart_v2'
  });

  /**
   * Estado global de la tienda
   */
  const STATE = {
    /** @type {Product[]} */
    allProducts: [],
    /** @type {Product[]} */
    filteredProducts: [],
    currentlyDisplayed: 0,
    activeCategory: 'todos',
    activeBand: '',
    searchQuery: '',
    sortCriteria: 'relevance'
  };

  /** Referencias cacheadas al árbol del DOM */
  const DOM = {
    container: document.getElementById('productsContainer'),
    loadMoreContainer: document.getElementById('loadMoreContainer'),
    btnLoadMore: document.getElementById('btnLoadMore'),
    searchInput: /** @type {HTMLInputElement|null} */ (document.getElementById('searchInput')),
    searchClearBtn: document.getElementById('searchClearBtn'),
    sortSelect: /** @type {HTMLSelectElement|null} */ (document.getElementById('sortSelect')),
    filterButtons: document.querySelectorAll('.filter-btn'),
    bandChips: document.querySelectorAll('.band-chip'),
    resultsCounter: document.getElementById('resultsCounter'),
    modal: document.getElementById('lightboxModal'),
    modalImg: /** @type {HTMLImageElement|null} */ (document.getElementById('lightboxImg')),
    modalCaption: document.getElementById('lightboxCaption'),
    modalClose: document.getElementById('lightboxClose'),
    // Carrito
    cartDrawer: document.getElementById('cartDrawer'),
    cartOverlay: document.getElementById('cartOverlay'),
    cartCloseBtn: document.getElementById('cartCloseBtn'),
    cartFloatBtn: document.getElementById('cartFloatBtn'),
    openCartBtnTop: document.getElementById('openCartBtnTop'),
    cartFloatCount: document.getElementById('cartFloatCount'),
    cartBadgeTop: document.getElementById('cartBadgeTop'),
    cartItemsCountLabel: document.getElementById('cartItemsCountLabel'),
    cartItemsContainer: document.getElementById('cartItemsContainer'),
    cartTotalPrice: document.getElementById('cartTotalPrice'),
    btnCartClear: document.getElementById('btnCartClear'),
    btnCartCheckout: /** @type {HTMLAnchorElement|null} */ (document.getElementById('btnCartCheckout')),
    storeToast: document.getElementById('storeToast')
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
        .replace(/'/g, '&#039;')
        .replace(/`/g, '&#96;');
    },

    /**
     * Valida y sanitiza URIs asegurando protocolos seguros y previniendo vectores de inyección.
     * @param {string} uri
     * @returns {boolean}
     */
    isSafeURI(uri) {
      if (!uri || typeof uri !== 'string') return false;
      if (/^\s*(javascript|data|vbscript):/i.test(uri)) return false;
      return true;
    },

    /**
     * Resuelve URIs absolutas canónicas evitando rutas relativas rotas o ataques de path traversal.
     * @param {string} relativePath
     * @returns {string}
     */
    resolveCanonicalImage(relativePath) {
      if (!Security.isSafeURI(relativePath)) {
        return new URL(CONFIG.DEFAULT_IMAGE, window.location.href).href;
      }
      if (/^https?:\/\//i.test(relativePath)) {
        return relativePath;
      }
      try {
        const resolved = new URL(relativePath, window.location.href);
        if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
          return new URL(CONFIG.DEFAULT_IMAGE, window.location.href).href;
        }
        return resolved.href;
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
     * Extrae el valor numérico en Soles desde cadenas como "S/ 55.00".
     * @param {string} priceStr
     * @returns {number}
     */
    parseNumericPrice(priceStr) {
      if (!priceStr || typeof priceStr !== 'string') return 0;
      const clean = priceStr.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    },

    /**
     * Construye Deep Links normalizados RFC 3986 hacia la API de WhatsApp para un producto individual.
     * @param {Product} product
     * @returns {string}
     */
    buildSingleWhatsAppDeepLink(product) {
      const canonicalImageUrl = Security.resolveCanonicalImage(product.imagen);
      
      const payload = 
        `*SOLICITUD DE PEDIDO - HEAVY METAL STORE* ⚡\n\n` +
        `📦 *Producto:* ${product.nombre || 'N/A'}\n` +
        `🎸 *Banda:* ${product.banda || 'N/A'}\n` +
        `🏷️ *Categoría:* ${product.categoria || 'N/A'}\n` +
        `💵 *Precio:* ${product.precio || 'Consultar'}\n` +
        `🖼️ *Vista Canónica:* ${canonicalImageUrl}\n\n` +
        `¿Disponen de stock en mi talla y qué métodos de pago (Yape/Plin/Transferencia) aceptan? Gracias.`;

      return `https://api.whatsapp.com/send?phone=${CONFIG.WHATSAPP_PHONE}&text=${encodeURIComponent(payload)}`;
    }
  };

  // =========================================================================
  // 2. SISTEMA DE NOTIFICACIONES (TOAST NOTIFICATIONS)
  // =========================================================================
  const Toast = {
    timer: null,
    /**
     * Muestra una notificación emergente visual no intrusiva.
     * @param {string} message
     */
    show(message) {
      if (!DOM.storeToast) return;
      DOM.storeToast.textContent = message;
      DOM.storeToast.classList.add('show');
      clearTimeout(Toast.timer);
      Toast.timer = setTimeout(() => {
        if (DOM.storeToast) DOM.storeToast.classList.remove('show');
      }, 2400);
    }
  };

  // =========================================================================
  // 3. MÓDULO DEL CARRITO (BOLSA DE RELIQUIAS) 🛒⚡
  // =========================================================================
  const Cart = {
    /** @type {CartItem[]} */
    items: [],

    /**
     * Inicializa el estado del carrito recuperándolo de LocalStorage.
     */
    init() {
      try {
        const stored = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            Cart.items = parsed;
          }
        }
      } catch (e) {
        console.warn('[Cart]: Imposible leer localStorage:', e);
        Cart.items = [];
      }
      Cart.render();
    },

    /**
     * Persiste el estado del carrito.
     */
    save() {
      try {
        localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(Cart.items));
      } catch (e) {
        console.warn('[Cart]: Imposible guardar en localStorage:', e);
      }
    },

    /**
     * Añade un producto al carrito o incrementa su cantidad.
     * @param {Product} product
     * @param {number} [quantity=1]
     */
    add(product, quantity = 1) {
      if (!product || !product.id) return;

      const existingIndex = Cart.items.findIndex(item => String(item.id) === String(product.id));
      if (existingIndex !== -1) {
        Cart.items[existingIndex].quantity += quantity;
      } else {
        Cart.items.push({
          id: product.id,
          nombre: product.nombre,
          categoria: product.categoria,
          banda: product.banda,
          precio: product.precio,
          numericPrice: Utils.parseNumericPrice(product.precio),
          imagen: product.imagen,
          quantity: quantity
        });
      }

      Cart.save();
      Cart.render();
      Toast.show(`¡"${product.nombre}" añadido a tu bolsa! 🛒⚡`);
    },

    /**
     * Remueve un producto del carrito por ID.
     * @param {string|number} productId
     */
    remove(productId) {
      Cart.items = Cart.items.filter(item => String(item.id) !== String(productId));
      Cart.save();
      Cart.render();
      Toast.show('Reliquia eliminada de la bolsa.');
    },

    /**
     * Actualiza la cantidad de un artículo.
     * @param {string|number} productId
     * @param {number} delta
     */
    updateQty(productId, delta) {
      const item = Cart.items.find(i => String(i.id) === String(productId));
      if (!item) return;

      item.quantity += delta;
      if (item.quantity <= 0) {
        Cart.remove(productId);
        return;
      }

      Cart.save();
      Cart.render();
    },

    /**
     * Vacía todos los artículos del carrito.
     */
    clear() {
      if (Cart.items.length === 0) return;
      Cart.items = [];
      Cart.save();
      Cart.render();
      Toast.show('Bolsa de pedidos vaciada.');
    },

    /**
     * Abre el drawer lateral del carrito.
     */
    open() {
      if (!DOM.cartDrawer || !DOM.cartOverlay) return;
      DOM.cartDrawer.classList.add('active');
      DOM.cartOverlay.classList.add('active');
      DOM.cartDrawer.setAttribute('aria-hidden', 'false');
      DOM.cartOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    },

    /**
     * Cierra el drawer lateral del carrito.
     */
    close() {
      if (!DOM.cartDrawer || !DOM.cartOverlay) return;
      DOM.cartDrawer.classList.remove('active');
      DOM.cartOverlay.classList.remove('active');
      DOM.cartDrawer.setAttribute('aria-hidden', 'true');
      DOM.cartOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = 'auto';
    },

    /**
     * Calcula el monto total acumulado.
     * @returns {number}
     */
    getTotalAmount() {
      return Cart.items.reduce((acc, item) => acc + (item.numericPrice * item.quantity), 0);
    },

    /**
     * Calcula la cantidad total de artículos.
     * @returns {number}
     */
    getTotalCount() {
      return Cart.items.reduce((acc, item) => acc + item.quantity, 0);
    },

    /**
     * Construye el Deep Link hacia WhatsApp con la orden consolidada.
     * @returns {string}
     */
    buildConsolidatedWhatsAppLink() {
      if (Cart.items.length === 0) return '#';

      let itemsText = '';
      let total = 0;

      Cart.items.forEach((item, index) => {
        const itemSubtotal = item.numericPrice * item.quantity;
        total += itemSubtotal;
        const imgUrl = Security.resolveCanonicalImage(item.imagen);

        itemsText += 
          `\n${index + 1}. *${item.nombre}*\n` +
          `   🎸 Banda: ${item.banda || 'N/A'}\n` +
          `   🏷️ Categoría: ${item.categoria || 'N/A'}\n` +
          `   🔢 Cantidad: ${item.quantity}\n` +
          `   💵 Precio Unit.: ${item.precio} | Subtotal: S/ ${itemSubtotal.toFixed(2)}\n` +
          `   🖼️ Vista: ${imgUrl}\n`;
      });

      const payload = 
        `*SOLICITUD DE PEDIDO CONSOLIDADO - HEAVY METAL STORE* ⚡🤘\n` +
        `==================================================\n` +
        `¡Hola Heavy Metal Rock TV! Deseo realizar el pedido de los siguientes artículos de mi bolsa:\n` +
        `${itemsText}\n` +
        `==================================================\n` +
        `💰 *TOTAL ESTIMADO:* S/ ${total.toFixed(2)}\n` +
        `💳 *Método de Pago Preferido:* Yape / Plin / Transferencia\n` +
        `📍 *Destino de Entrega:* Lima / Provincia\n\n` +
        `¿Disponen de stock en mis tallas y por qué agencia realizan el despacho? ¡Muchas gracias!`;

      return `https://api.whatsapp.com/send?phone=${CONFIG.WHATSAPP_PHONE}&text=${encodeURIComponent(payload)}`;
    },

    /**
     * Sincroniza la vista visual del carrito y sus contadores.
     */
    render() {
      const totalCount = Cart.getTotalCount();
      const totalAmount = Cart.getTotalAmount();

      // Actualizar badges
      if (DOM.cartFloatCount) DOM.cartFloatCount.textContent = String(totalCount);
      if (DOM.cartBadgeTop) DOM.cartBadgeTop.textContent = String(totalCount);
      if (DOM.cartItemsCountLabel) {
        DOM.cartItemsCountLabel.textContent = `${totalCount} artículo${totalCount === 1 ? '' : 's'}`;
      }
      if (DOM.cartTotalPrice) {
        DOM.cartTotalPrice.textContent = `S/ ${totalAmount.toFixed(2)}`;
      }

      // Actualizar accesibilidad en botón flotante
      if (DOM.cartFloatBtn) {
        DOM.cartFloatBtn.setAttribute('aria-label', `Abrir bolsa de pedidos (${totalCount} artículos)`);
      }

      // Renderizar cuerpo del carrito
      if (!DOM.cartItemsContainer) return;

      if (Cart.items.length === 0) {
        DOM.cartItemsContainer.innerHTML = `
          <div class="cart-empty-state">
            <div class="cart-empty-icon" aria-hidden="true">💀</div>
            <h3>Tu bolsa está vacía</h3>
            <p>Explora el catálogo oficial y agrega tus reliquias favoritas.</p>
          </div>
        `;
        if (DOM.btnCartCheckout) {
          DOM.btnCartCheckout.href = '#';
          DOM.btnCartCheckout.classList.add('disabled');
        }
        return;
      }

      if (DOM.btnCartCheckout) {
        DOM.btnCartCheckout.classList.remove('disabled');
        DOM.btnCartCheckout.href = Cart.buildConsolidatedWhatsAppLink();
      }

      DOM.cartItemsContainer.innerHTML = Cart.items.map(item => {
        const safeName = Security.escapeHTML(item.nombre);
        const safeBand = Security.escapeHTML(item.banda);
        const safePrice = Security.escapeHTML(item.precio);
        const safeImg = Security.escapeHTML(item.imagen || CONFIG.DEFAULT_IMAGE);
        const itemSubtotal = (item.numericPrice * item.quantity).toFixed(2);

        return `
          <div class="cart-item" data-id="${item.id}">
            <img class="cart-item-img" src="${safeImg}" alt="${safeName}" loading="lazy">
            <div class="cart-item-details">
              <div class="cart-item-band">${safeBand}</div>
              <div class="cart-item-title" title="${safeName}">${safeName}</div>
              <div class="cart-item-price">${safePrice} (Subtotal: S/ ${itemSubtotal})</div>
              <div class="cart-item-qty-controls">
                <button type="button" class="btn-qty btn-qty-minus" data-id="${item.id}" aria-label="Disminuir cantidad">&minus;</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button type="button" class="btn-qty btn-qty-plus" data-id="${item.id}" aria-label="Aumentar cantidad">&plus;</button>
              </div>
            </div>
            <button type="button" class="btn-cart-remove" data-id="${item.id}" aria-label="Eliminar ${safeName}">&times;</button>
          </div>
        `;
      }).join('');
    }
  };

  // =========================================================================
  // 4. MOTOR DE RENDERIZADO ATÓMICO (DOCUMENT FRAGMENT) ⚙️
  // =========================================================================
  const Renderer = {
    /**
     * Fabrica un nodo <article> de producto aislado en memoria RAM.
     * @param {Product} product
     * @returns {HTMLElement}
     */
    createProductCard(product) {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.setAttribute('data-id', String(product.id));

      const safeName = Security.escapeHTML(product.nombre);
      const safeCat = Security.escapeHTML(product.categoria);
      const safeBand = Security.escapeHTML(product.banda);
      const safeDesc = Security.escapeHTML(product.descripcion);
      const safePrice = Security.escapeHTML(product.precio);
      const safeImg = Security.escapeHTML(product.imagen || CONFIG.DEFAULT_IMAGE);
      const rawImg = product.imagen || CONFIG.DEFAULT_IMAGE;
      const safeWaUrl = Security.escapeHTML(Utils.buildSingleWhatsAppDeepLink(product));

      card.innerHTML = `
        <div class="product-card-img-wrapper" tabindex="0" role="button" aria-label="Ver afiche de ${safeName}" data-fullimg="${Security.escapeHTML(rawImg)}" data-title="${safeName}">
          <span class="badge-category">${safeCat}</span>
          <img 
            src="${safeImg}" 
            alt="${safeName}" 
            loading="lazy" 
            width="300" 
            height="260"
          >
          <div class="img-zoom-hint" aria-hidden="true">🔍 Ampliar</div>
        </div>
        <div class="product-card-body">
          <div>
            <div class="product-band">${safeBand}</div>
            <h3>${safeName}</h3>
            <p class="product-desc">${safeDesc}</p>
          </div>
          <div class="product-footer">
            <div class="product-price">${safePrice}</div>
            <div class="product-actions">
              <button type="button" class="btn-add-cart" data-id="${product.id}" aria-label="Añadir ${safeName} a la bolsa">
                <span>🛒 Agregar</span>
              </button>
              <a class="btn-order-direct" href="${safeWaUrl}" target="_blank" rel="noopener noreferrer" aria-label="Pedir ${safeName} directo por WhatsApp" title="Pedir directo por WhatsApp">
                💬
              </a>
            </div>
          </div>
        </div>
      `;

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
          <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: #777;">
            <div style="font-size: 40px; margin-bottom: 15px;">💀</div>
            <h3 style="color: #ccc; margin-bottom: 8px;">No se encontraron reliquias para tu búsqueda</h3>
            <p style="color: #888; font-size: 14px;">Prueba seleccionando otra categoría o limpiando los filtros de banda y texto.</p>
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
  // 5. MOTOR DE FILTRADO Y ORDENAMIENTO (FILTER & SORT ENGINE) 🗡️
  // =========================================================================
  const FilterEngine = {
    /**
     * Calcula y sincroniza los contadores de productos por categoría.
     */
    updateCategoryBadges() {
      const counts = { todos: STATE.allProducts.length };
      STATE.allProducts.forEach(item => {
        const cat = (item.categoria || '').toLowerCase().trim();
        counts[cat] = (counts[cat] || 0) + 1;
      });

      // Actualizar badges en los botones de categoría
      DOM.filterButtons.forEach(btn => {
        const cat = btn.getAttribute('data-category') || 'todos';
        const badge = btn.querySelector('.badge-count');
        if (badge) {
          badge.textContent = String(counts[cat] || 0);
        }
      });
    },

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

      let label = `Mostrando <span>${total}</span> reliquia${total === 1 ? '' : 's'}`;
      if (STATE.searchQuery) {
        label += ` para <span>"${Security.escapeHTML(STATE.searchQuery)}"</span>`;
      }
      if (STATE.activeBand) {
        label += ` de <span>"${Security.escapeHTML(STATE.activeBand)}"</span>`;
      }
      if (STATE.activeCategory !== 'todos') {
        label += ` en <span>"${Security.escapeHTML(STATE.activeCategory)}"</span>`;
      }

      DOM.resultsCounter.innerHTML = label;
    },

    /**
     * Aplica el ordenamiento según el criterio seleccionado.
     * @param {Product[]} items
     * @param {string} criteria
     * @returns {Product[]}
     */
    sortItems(items, criteria) {
      const sorted = [...items];
      switch (criteria) {
        case 'price-asc':
          sorted.sort((a, b) => Utils.parseNumericPrice(a.precio) - Utils.parseNumericPrice(b.precio));
          break;
        case 'price-desc':
          sorted.sort((a, b) => Utils.parseNumericPrice(b.precio) - Utils.parseNumericPrice(a.precio));
          break;
        case 'band-asc':
          sorted.sort((a, b) => (a.banda || '').localeCompare(b.banda || ''));
          break;
        case 'band-desc':
          sorted.sort((a, b) => (b.banda || '').localeCompare(a.banda || ''));
          break;
        case 'relevance':
        default:
          // Orden natural del catálogo
          break;
      }
      return sorted;
    },

    /**
     * Aplica la intersección lógica estricta: (Categoría) AND (Banda) AND (Búsqueda) + Sort
     */
    apply() {
      const rawQuery = STATE.searchQuery.trim().toLowerCase();
      const activeBandLower = STATE.activeBand.trim().toLowerCase();

      // 1. Filtrar
      let results = STATE.allProducts.filter(item => {
        // Categoría
        const matchesCategory = 
          (STATE.activeCategory === 'todos') ||
          (item.categoria && item.categoria.toLowerCase() === STATE.activeCategory.toLowerCase());

        // Banda Chip
        const matchesBand = 
          !activeBandLower ||
          (item.banda && item.banda.toLowerCase().includes(activeBandLower));

        // Búsqueda multi-campo
        const matchesSearch = 
          !rawQuery ||
          (item.nombre && item.nombre.toLowerCase().includes(rawQuery)) ||
          (item.banda && item.banda.toLowerCase().includes(rawQuery)) ||
          (item.descripcion && item.descripcion.toLowerCase().includes(rawQuery)) ||
          (item.categoria && item.categoria.toLowerCase().includes(rawQuery));

        return matchesCategory && matchesBand && matchesSearch;
      });

      // 2. Ordenar
      results = FilterEngine.sortItems(results, STATE.sortCriteria);

      STATE.filteredProducts = results;

      FilterEngine.updateCounter();
      Renderer.renderBatch(true);
    }
  };

  // =========================================================================
  // 6. CONTROL DE MODAL LIGHTBOX
  // =========================================================================
  const Lightbox = {
    open(src, alt) {
      if (!DOM.modal) return;
      if (!Security.isSafeURI(src)) return;
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
  // 7. REGISTRO DETERMINISTA DE EVENT LISTENERS
  // =========================================================================
  function bindEvents() {
    // 1. Delegación atómica en el contenedor de productos (Cero fugas de memoria)
    if (DOM.container) {
      // Manejo centralizado de imágenes rotas (cero inline onerror)
      DOM.container.addEventListener('error', (e) => {
        const target = /** @type {HTMLImageElement} */ (e.target);
        if (target && target.tagName === 'IMG') {
          const fallback = new URL(CONFIG.DEFAULT_IMAGE, window.location.href).href;
          if (target.src !== fallback) {
            target.src = fallback;
          }
        }
      }, true);

      // Clics en tarjeta (Lightbox o Añadir al Carrito)
      DOM.container.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);

        // Caso A: Clic en botón "🛒 Agregar"
        const addBtn = target.closest('.btn-add-cart');
        if (addBtn) {
          const productId = addBtn.getAttribute('data-id');
          const product = STATE.allProducts.find(p => String(p.id) === String(productId));
          if (product) {
            Cart.add(product, 1);
          }
          return;
        }

        // Caso B: Clic en la imagen para Lightbox
        const wrapper = target.closest('.product-card-img-wrapper');
        if (wrapper) {
          const fullImg = wrapper.getAttribute('data-fullimg') || CONFIG.DEFAULT_IMAGE;
          const title = wrapper.getAttribute('data-title') || '';
          Lightbox.open(fullImg, title);
        }
      });

      // Accesibilidad por teclado en imagen
      DOM.container.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const target = /** @type {HTMLElement} */ (e.target);
        const wrapper = target.closest('.product-card-img-wrapper');
        if (!wrapper) return;
        e.preventDefault();
        const fullImg = wrapper.getAttribute('data-fullimg') || CONFIG.DEFAULT_IMAGE;
        const title = wrapper.getAttribute('data-title') || '';
        Lightbox.open(fullImg, title);
      });
    }

    // 2. Paginación por demanda (Load More)
    if (DOM.btnLoadMore) {
      DOM.btnLoadMore.addEventListener('click', () => Renderer.renderBatch(false));
    }

    // 3. Búsqueda con Debounce y Botón de Limpieza
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', Utils.debounce((e) => {
        STATE.searchQuery = e.target.value;
        if (DOM.searchClearBtn) {
          DOM.searchClearBtn.style.display = STATE.searchQuery ? 'block' : 'none';
        }
        FilterEngine.apply();
      }, CONFIG.DEBOUNCE_MS));
    }

    if (DOM.searchClearBtn) {
      DOM.searchClearBtn.addEventListener('click', () => {
        if (DOM.searchInput) {
          DOM.searchInput.value = '';
          STATE.searchQuery = '';
          DOM.searchClearBtn.style.display = 'none';
          DOM.searchInput.focus();
          FilterEngine.apply();
        }
      });
    }

    // 4. Selector de Ordenamiento (Sort)
    if (DOM.sortSelect) {
      DOM.sortSelect.addEventListener('change', (e) => {
        STATE.sortCriteria = /** @type {HTMLSelectElement} */ (e.target).value;
        FilterEngine.apply();
      });
    }

    // 5. Filtro por Chips de Categoría
    DOM.filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        DOM.filterButtons.forEach(b => b.classList.remove('active'));
        const target = /** @type {HTMLElement} */ (e.currentTarget);
        target.classList.add('active');
        STATE.activeCategory = target.getAttribute('data-category') || 'todos';
        FilterEngine.apply();
      });
    });

    // 6. Filtro por Chips de Bandas Populares
    DOM.bandChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        DOM.bandChips.forEach(c => c.classList.remove('active'));
        const target = /** @type {HTMLElement} */ (e.currentTarget);
        target.classList.add('active');
        STATE.activeBand = target.getAttribute('data-band') || '';
        FilterEngine.apply();
      });
    });

    // 7. Eventos de la Bolsa de Pedidos (Carrito)
    if (DOM.cartFloatBtn) {
      DOM.cartFloatBtn.addEventListener('click', Cart.open);
    }

    if (DOM.openCartBtnTop) {
      DOM.openCartBtnTop.addEventListener('click', Cart.open);
    }

    if (DOM.cartCloseBtn) {
      DOM.cartCloseBtn.addEventListener('click', Cart.close);
    }

    if (DOM.cartOverlay) {
      DOM.cartOverlay.addEventListener('click', Cart.close);
    }

    if (DOM.btnCartClear) {
      DOM.btnCartClear.addEventListener('click', Cart.clear);
    }

    // Delegación en el cuerpo del carrito para botones + / - / eliminar
    if (DOM.cartItemsContainer) {
      DOM.cartItemsContainer.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);

        // Plus
        const plusBtn = target.closest('.btn-qty-plus');
        if (plusBtn) {
          const id = plusBtn.getAttribute('data-id');
          Cart.updateQty(id, 1);
          return;
        }

        // Minus
        const minusBtn = target.closest('.btn-qty-minus');
        if (minusBtn) {
          const id = minusBtn.getAttribute('data-id');
          Cart.updateQty(id, -1);
          return;
        }

        // Remove
        const removeBtn = target.closest('.btn-cart-remove');
        if (removeBtn) {
          const id = removeBtn.getAttribute('data-id');
          Cart.remove(id);
          return;
        }
      });
    }

    // 8. Control de cierre de modal Lightbox
    if (DOM.modalClose) {
      DOM.modalClose.addEventListener('click', Lightbox.close);
    }

    if (DOM.modal) {
      DOM.modal.addEventListener('click', (e) => {
        if (e.target === DOM.modal) Lightbox.close();
      });
    }

    // Tecla Escape para modales y carrito
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (DOM.cartDrawer && DOM.cartDrawer.classList.contains('active')) {
          Cart.close();
        } else if (DOM.modal && DOM.modal.classList.contains('active')) {
          Lightbox.close();
        }
      }
    });
  }

  // =========================================================================
  // 8. INICIALIZACIÓN DEL SISTEMA
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

      // Lectura inteligente de parámetros en la URL (?search=Banda / ?category=polos / ?band=Banda)
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      const catParam = urlParams.get('category');
      const bandParam = urlParams.get('band');

      if (searchParam && DOM.searchInput) {
        DOM.searchInput.value = searchParam;
        STATE.searchQuery = searchParam.trim().toLowerCase();
        if (DOM.searchClearBtn) DOM.searchClearBtn.style.display = 'block';
      }
      if (catParam) {
        STATE.activeCategory = catParam;
        DOM.filterButtons.forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-category') === catParam);
        });
      }
      if (bandParam) {
        STATE.activeBand = bandParam;
        DOM.bandChips.forEach(chip => {
          chip.classList.toggle('active', chip.getAttribute('data-band') === bandParam);
        });
      }

      bindEvents();
      Cart.init();
      FilterEngine.updateCategoryBadges();
      if (searchParam || catParam || bandParam) {
        FilterEngine.apply();
      } else {
        FilterEngine.updateCounter();
        Renderer.renderBatch(true);
      }
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
