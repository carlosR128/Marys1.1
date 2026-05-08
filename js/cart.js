// Este archivo maneja toda la funcionalidad del carrito de compras.
// Incluye agregar productos, calcular totales, guardar en localStorage y procesar pedidos.

(() => {
    // Clave para guardar el carrito en el navegador
    const STORAGE_KEY = 'abcg-cart-items';
    // URL base para las llamadas a la API
    const API_BASE = window.ABCG_API_BASE || 'http://localhost:3000';

    // Función segura para convertir texto JSON en un array, devuelve vacío si hay error
    const safeParse = value => {
        try {
            const parsed = JSON.parse(value || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    };

    // Obtiene el nombre de la página actual desde la URL
    const getCurrentPageKey = () => (window.location.pathname.split('/').pop() || '').replace('.html', '').toLowerCase();

    // Convierte el nombre de la página en la categoría del menú correspondiente
    const getCategoryFromPage = () => {
        const categoryMap = {
            pizzas: 'Pizzas',
            pastas: 'Pastas',
            calzones: 'Calzones',
            alitas_y_cryspy: 'Alitas',
            hamburguesas: 'Hamburguesas',
            hotdog: 'Hot Dog',
            ensaladas: 'Ensaladas',
            snacks: 'Snacks',
            postres: 'Postres',
            bebidas: 'Bebidas',
            promos: 'Promociones'
        };

        return categoryMap[getCurrentPageKey()] || 'General';
    };

    // Asegura que los items del carrito tengan los tipos de datos correctos
    const normalizeCartItems = items => items.map(item => {
        const qty = Math.max(1, Number(item.qty || 1));
        const unitPrice = Number(item.unitPrice || item.total || item.price || 0);
        return {
            id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name: item.name || 'Producto',
            category: item.category || '',
            productType: item.productType || '',
            size: item.size || '',
            crust: item.crust || '',
            sauce: item.sauce || '',
            halfMode: item.halfMode || 'complete',
            halfAndHalf: Boolean(item.halfAndHalf),
            secondHalf: item.secondHalf || '',
            qty: qty,
            unitPrice: unitPrice,
            total: unitPrice * qty
        };
    });

    // Items actuales del carrito, cargados desde localStorage
    let cartItems = normalizeCartItems(safeParse(window.localStorage.getItem(STORAGE_KEY)));
    let cartRefs = null;
    let toastRef = null;
    let isSubmittingOrder = false;
    let availableBranches = [];

    // Formatea un número como precio con símbolo de dólar
    const formatPrice = value => `$${Number(value || 0).toFixed(0)}`;

    // Obtiene el precio unitario de un producto
    const getItemUnitPrice = item => Number(item.unitPrice || item.total || item.price || 0);

    // Calcula el total para una línea de producto (precio × cantidad)
    const getItemLineTotal = item => getItemUnitPrice(item) * Number(item.qty || 1);

    // Calcula el total de todo el carrito sumando todas las líneas
    const getTotal = () => cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0);

    /**
     * Estructura los pies de tarjeta de productos para mejor UX
     */
    const wrapCardFooters = () => {
        document.querySelectorAll('.item-info:not([data-card-structured])').forEach(info => {
            const price = info.querySelector(':scope > .item-price');
            const btn = info.querySelector(':scope > .btn-add');
            if (!btn) {
                return;
            }

            const footer = document.createElement('div');
            footer.className = 'item-footer';
            info.appendChild(footer);

            if (price) {
                footer.appendChild(price);
            }

            footer.appendChild(btn);
            info.setAttribute('data-card-structured', '1');
        });
    };

    /**
     * Muestra un mensaje toast temporal en la interfaz
     * @param {string} message - Mensaje a mostrar
     */
    const showToast = message => {
        if (!toastRef) {
            return;
        }

        toastRef.textContent = message;
        toastRef.classList.add('show');

        window.clearTimeout(showToast.timeoutId);
        showToast.timeoutId = window.setTimeout(() => {
            toastRef.classList.remove('show');
        }, 2200);
    };

    /**
     * Guarda el estado actual del carrito en localStorage
     */
    const saveCart = () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    };

    /**
     * Construye metadatos descriptivos de un item del carrito
     * @param {object} item - Item del carrito
     * @returns {array} Array de líneas descriptivas del item
     */
    const buildItemMeta = item => {
        const lines = [];

        if (item.size) {
            lines.push(`Tamaño: ${item.size}`);
        }

        if (item.crust) {
            lines.push(`Orilla: ${item.crust}`);
        }

        if (item.sauce) {
            lines.push(`Salsa: ${item.sauce}`);
        }

        if (item.halfAndHalf) {
            lines.push(`Mitad y mitad: ${item.secondHalf ? item.secondHalf : 'Sí'}`);
        }

        return lines;
    };

    /**
     * Actualiza los indicadores del carrito en la navegación
     */
    const updateCartTriggers = () => {
        const triggers = Array.from(document.querySelectorAll('.nav-carrito'));
        const count = cartItems.reduce((sum, item) => sum + Number(item.qty || 1), 0);

        triggers.forEach(trigger => {
            trigger.setAttribute('data-cart-count', String(count));
            trigger.setAttribute('aria-label', `Abrir carrito (${count} productos)`);
            trigger.classList.toggle('has-items', count > 0);
        });
    };

    /**
     * Parsea un precio desde texto eliminando caracteres no numéricos
     * @param {string} text - Texto que contiene un precio
     * @returns {number} Valor numérico del precio
     */
    const parsePrice = text => {
        if (!text) {
            return 0;
        }

        const normalized = String(text).replace(/,/g, '.');
        const match = normalized.match(/\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : 0;
    };

    /**
     * Determina si se debe omitir la adición automática de items al carrito
     * @param {Element} addButton - Botón de agregar al carrito
     * @returns {boolean} True si se debe omitir la adición automática
     */
    const shouldSkipAutoAdd = addButton => {
        if (!addButton) {
            return true;
        }

        if (addButton.hasAttribute('data-item-id')) {
            return true;
        }

        const hasPizzaModal = Boolean(document.getElementById('pizza-config-form'));
        const hasPizzaTabs = Boolean(document.querySelector('.pizza-tabs'));
        if (hasPizzaModal && hasPizzaTabs) {
            return true;
        }

        return false;
    };

    /**
     * Construye detalles de un item desde la información de la tarjeta del menú
     * @param {Element} addButton - Botón que activó la adición
     * @returns {object|null} Detalles del item o null si no se puede construir
     */
    const buildDetailFromCard = addButton => {
        const card = addButton.closest('.menu-item');
        if (!card) {
            return null;
        }

        const titleEl = card.querySelector('.item-info h3');
        const priceEl = card.querySelector('.item-price');
        const selectEls = Array.from(card.querySelectorAll('.item-select'));

        const selectedOptionText = selectEls
            .map(selectEl => {
                if (!selectEl || !selectEl.options || selectEl.selectedIndex < 0) {
                    return '';
                }

                const label = card.querySelector(`label[for="${selectEl.id}"]`);
                const optionText = selectEl.options[selectEl.selectedIndex].textContent.trim();
                return label ? `${label.textContent.trim()}: ${optionText}` : optionText;
            })
            .filter(Boolean)
            .join(' | ');

        return {
            name: titleEl ? titleEl.textContent.trim() : 'Producto',
            category: getCategoryFromPage(),
            productType: getCurrentPageKey(),
            size: selectedOptionText,
            crust: '',
            sauce: '',
            halfMode: 'complete',
            halfAndHalf: false,
            secondHalf: '',
            total: parsePrice(priceEl ? priceEl.textContent : '')
        };
    };

    /**
     * Obtiene los datos del formulario de pedido.
     * El tipo de entrega y branchId se leen de localStorage (fuente de verdad),
     * el resto de los campos del DOM.
     */
    const getOrderFormData = () => {
        const deliveryData = JSON.parse(localStorage.getItem('deliveryData') || '{}');
        const pickupData   = JSON.parse(localStorage.getItem('pickupData')   || '{}');

        let deliveryType = '';
        let branchId     = '';

        // Fuente de verdad: localStorage únicamente
        // Detectar domicilio: por tipo explícito O por coordenadas guardadas
        if (deliveryData.type === 'domicilio' || (deliveryData.lat && deliveryData.lng)) {
            deliveryType = 'domicilio';
        } else if (pickupData.branchId !== undefined && pickupData.branchId !== null && pickupData.branchId !== '') {
            deliveryType = 'recoger';
            branchId     = String(pickupData.branchId);
        }

        return {
            customerName:    cartRefs && cartRefs.customerName    ? cartRefs.customerName.value.trim()    : '',
            customerPhone:   cartRefs && cartRefs.customerPhone   ? cartRefs.customerPhone.value.trim()   : '',
            deliveryType,
            branchId,
            orderType:       deliveryType,
            paymentMethod:   cartRefs && cartRefs.paymentMethod   ? cartRefs.paymentMethod.value           : 'efectivo',
            deliveryAddress: cartRefs && cartRefs.deliveryAddress ? cartRefs.deliveryAddress.value.trim() : '',
            notes:           cartRefs && cartRefs.notes           ? cartRefs.notes.value.trim()           : ''
        };
    };

    /**
     * Valida los datos del formulario de pedido
     */
    const validateOrderForm = formData => {
        if (!formData.customerName || formData.customerName.trim().length < 2) {
            return 'El nombre es obligatorio (mínimo 2 caracteres).';
        }

        if (!formData.customerPhone || !isValidMexicanPhone(formData.customerPhone)) {
            return 'El teléfono debe ser un número válido de 10 dígitos.';
        }

        if (!formData.deliveryType) {
            return 'Elige cómo quieres recibir tu pedido: domicilio o sucursal.';
        }

        if (formData.deliveryType === 'domicilio') {
            const deliveryData = JSON.parse(localStorage.getItem('deliveryData') || '{}');
            if (!deliveryData.reference || deliveryData.reference.trim().length < 5) {
                return 'Agrega una referencia para que el repartidor te encuentre.';
            }
        }

        if (formData.deliveryType === 'recoger') {
            const pickupData = JSON.parse(localStorage.getItem('pickupData') || '{}');
            if (!pickupData.branchId) {
                return 'Selecciona la sucursal donde recogerás tu pedido.';
            }
        }

        return '';
    };

    /**
     * Valida si un número de teléfono es válido para México
     * @param {string} phone - Número de teléfono a validar
     * @returns {boolean} True si es válido
     */
    const isValidMexicanPhone = phone => {
        // Remover todos los caracteres no numéricos
        const cleanPhone = phone.replace(/\D/g, '');

        // Debe tener exactamente 10 dígitos
        if (cleanPhone.length !== 10) {
            return false;
        }

        // Debe comenzar con dígitos válidos para México
        // Códigos de área válidos: 55 (CDMX), 33 (Jalisco), 81 (Nuevo León), etc.
        const validAreaCodes = [
            '55', '33', '81', '56', '57', '58', '59',  // CDMX y área metropolitana
            '33', // Guadalajara
            '81', // Monterrey
            '22', '23', // Puebla
            '44', // León
            '66', // Chihuahua
            '77', // Mérida
            '99', // Cancún
            '31', // Morelia
            '33', // Toluca
            '55', '56', '57', '58', '59', // CDMX
            '55', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', // CDMX
            '55', '70', '71', '72', '73', '74', '75', '76', '77'  // CDMX
        ];

        const areaCode = cleanPhone.substring(0, 2);
        return validAreaCodes.includes(areaCode);
    };

    /**
     * Maneja la selección de tipo de entrega — abre el diálogo correspondiente
     */
    const handleDeliveryTypeSelection = (deliveryType) => {
        if (deliveryType === 'domicilio') {
            // Abrir diálogo de domicilio si está disponible
            if (window.DeliveryForm && window.DeliveryForm.openDeliveryDialog) {
                window.DeliveryForm.openDeliveryDialog();
            }
        } else if (deliveryType === 'recoger') {
            // Abrir diálogo de sucursal si está disponible
            if (window.DeliveryForm && window.DeliveryForm.openPickupDialog) {
                window.DeliveryForm.openPickupDialog();
            }
        }
    };

    /**
     * Valida el campo de teléfono en tiempo real
     */
    const validatePhoneInput = (phoneInput) => {
        if (!phoneInput) return;

        const cleanPhone = phoneInput.value.replace(/\D/g, '');
        phoneInput.value = cleanPhone;

        // Limitar a 10 dígitos
        if (cleanPhone.length > 10) {
            phoneInput.value = cleanPhone.substring(0, 10);
        }

        // Validar formato mexicano
        const isValid = cleanPhone.length === 10 && isValidMexicanPhone(cleanPhone);
        phoneInput.style.borderColor = isValid || cleanPhone.length === 0 ? '' : '#dc3545';
    };

    /**
     * Configura los event listeners para el formulario de checkout
     */
    const setupCheckoutEventListeners = () => {
        if (!cartRefs) return;

        // Event listeners para botones de tipo de entrega
        const deliveryTypeButtons = document.querySelectorAll('.btn-delivery-type');
        deliveryTypeButtons.forEach(btn => {
            // Evitar duplicar listeners usando un flag en el elemento
            if (btn.dataset.listenerAttached) return;
            btn.dataset.listenerAttached = '1';
            btn.addEventListener('click', (e) => {
                const deliveryType = e.currentTarget.dataset.deliveryType;
                handleDeliveryTypeSelection(deliveryType);
            });
        });

        // Event listener para validación de teléfono en tiempo real
        if (cartRefs.customerPhone && !cartRefs.customerPhone.dataset.listenerAttached) {
            cartRefs.customerPhone.dataset.listenerAttached = '1';
            cartRefs.customerPhone.addEventListener('input', (e) => {
                validatePhoneInput(e.target);
            });
        }

    };

    /**
     * Construye el payload completo del pedido para enviar al API
     * @param {object} formData - Datos validados del formulario
     * @returns {object} Payload del pedido listo para API
     */
    const buildOrderPayload = formData => {
        const deliveryData = JSON.parse(localStorage.getItem('deliveryData') || '{}');
        const pickupData   = JSON.parse(localStorage.getItem('pickupData')   || '{}');

        // branchId siempre desde localStorage para garantizar el valor correcto
        const branchId = formData.deliveryType === 'recoger'
            ? (pickupData.branchId !== undefined ? Number(pickupData.branchId) : Number(formData.branchId) || null)
            : null;

        return {
            customerName:    formData.customerName,
            customerPhone:   formData.customerPhone,
            deliveryType:    formData.deliveryType,
            branchId,
            orderType:       formData.deliveryType,
            paymentMethod:   formData.paymentMethod,
            deliveryAddress: formData.deliveryType === 'domicilio'
                ? {
                    address:   deliveryData.address   || null,
                    reference: deliveryData.reference || formData.deliveryAddress || null,
                    lat:       deliveryData.lat        || null,
                    lng:       deliveryData.lng        || null
                }
                : null,
            notes: formData.notes,
            items: cartItems.map(item => ({
                name:        item.name,
                category:    item.category    || getCategoryFromPage(),
                productType: item.productType || getCurrentPageKey(),
                size:        item.size,
                crust:       item.crust,
                sauce:       item.sauce,
                halfMode:    item.halfMode,
                halfAndHalf: item.halfAndHalf,
                secondHalf:  item.secondHalf,
                qty:         Number(item.qty || 1),
                unitPrice:   getItemUnitPrice(item),
                total:       getItemLineTotal(item)
            }))
        };
    };

    /**
     * Actualiza el estado de los botones de acción del carrito
     */
    const updateCartActionState = () => {
        if (!cartRefs) {
            return;
        }

        if (cartRefs.send) {
            // No deshabilitar el botón — submitOrder maneja el carrito vacío con mensaje
            cartRefs.send.disabled = isSubmittingOrder;
            if (isSubmittingOrder) {
                cartRefs.send.textContent = 'Guardando pedido...';
            } else {
                const checkout = cartRefs.panel
                    ? cartRefs.panel.querySelector('.cart-checkout')
                    : null;
                const formVisible = checkout && !checkout.classList.contains('hidden');
                if (!formVisible) {
                    cartRefs.send.textContent = 'Comprar';
                }
            }
        }

        if (cartRefs.clear) {
            cartRefs.clear.disabled = isSubmittingOrder || !cartItems.length;
        }

        if (cartRefs.branchId) {
            cartRefs.branchId.disabled = isSubmittingOrder;
        }
    };

    /**
     * Establece el estado de envío del pedido y actualiza la UI
     * @param {boolean} submitting - Si se está enviando el pedido
     */
    const setSubmittingState = submitting => {
        isSubmittingOrder = submitting;
        updateCartActionState();
    };

    /**
     * Renderiza las opciones de sucursal en el select correspondiente
     */
    const renderBranchOptions = () => {
        if (!cartRefs || !cartRefs.branchId) {
            return;
        }

        const currentValue = cartRefs.branchId.value;
        const options = ['<option value="">Selecciona una sucursal</option>']
            .concat(availableBranches.map(branch => `<option value="${branch.id}">${branch.nombre}</option>`));

        cartRefs.branchId.innerHTML = options.join('');

        if (currentValue && availableBranches.some(branch => String(branch.id) === String(currentValue))) {
            cartRefs.branchId.value = currentValue;
            return;
        }

        if (availableBranches.length === 1) {
            cartRefs.branchId.value = String(availableBranches[0].id);
        }
    };

    /**
     * Carga las sucursales disponibles desde el API
     */
    const loadBranches = async () => {
        try {
            const response = await window.fetch(`${API_BASE}/api/branches`);
            const data = await response.json().catch(() => ({}));

            if (!response.ok || !Array.isArray(data.branches)) {
                throw new Error(data.error || 'No se pudieron cargar las sucursales.');
            }

            availableBranches = data.branches;
            renderBranchOptions();
        } catch (error) {
            availableBranches = [];
            renderBranchOptions();
            showToast(error.message || 'No se pudieron cargar las sucursales.');
        }
    };

    /**
     * Sincroniza los highlights visuales de items en el carrito con las tarjetas del menú
     */
    const syncCartHighlights = () => {
        document.querySelectorAll('.menu-item').forEach(card => {
            const heading = card.querySelector('h3');
            if (!heading) {
                return;
            }

            const name = heading.textContent.trim().toLowerCase();
            const cartItem = cartItems.find(item => item.name.trim().toLowerCase() === name);
            
            if (cartItem) {
                card.classList.add('in-cart');
                
                // Crear o actualizar badge de cantidad
                let badge = card.querySelector('.item-quantity-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'item-quantity-badge';
                    card.appendChild(badge);
                }
                badge.textContent = `x${cartItem.qty}`;
            } else {
                card.classList.remove('in-cart');
                const badge = card.querySelector('.item-quantity-badge');
                if (badge) {
                    badge.remove();
                }
            }
        });
    };

    /**
     * Renderiza el contenido completo del carrito en el DOM
     */
    const renderCart = () => {
        if (!cartRefs) {
            return;
        }

        updateCartTriggers();

        if (!cartItems.length) {
            cartRefs.items.innerHTML = `
                <div id="cart-empty-msg" style="text-align:center; padding: 32px 16px; color: #888;">
                    <div style="font-size: 3rem; margin-bottom: 12px;">🛒</div>
                    <p style="font-size: 1rem; font-weight: 700; color: #555; margin: 0 0 6px 0;">Tu carrito está vacío</p>
                    <p style="font-size: 0.88rem; margin: 0; color: #aaa;">Agrega productos del menú para continuar</p>
                </div>
            `;
            cartRefs.total.textContent = formatPrice(0);
            updateCartActionState();
            syncCartHighlights();
            return;
        }

        cartRefs.items.innerHTML = cartItems.map(item => {
            const meta = buildItemMeta(item)
                .map(line => `<li>${line}</li>`)
                .join('');

            return `
                <article class="cart-item" data-cart-id="${item.id}">
                    <div class="cart-item-copy">
                        <h3>${item.name}</h3>
                        <ul>${meta}</ul>
                    </div>
                    <div class="cart-item-side">
                        <div class="cart-qty-controls" aria-label="Controles de cantidad">
                            <button type="button" class="cart-qty-btn" data-cart-dec="${item.id}" aria-label="Disminuir cantidad">-</button>
                            <span class="cart-qty-value">x${Number(item.qty || 1)}</span>
                            <button type="button" class="cart-qty-btn" data-cart-inc="${item.id}" aria-label="Aumentar cantidad">+</button>
                        </div>
                        <strong>${formatPrice(getItemLineTotal(item))}</strong>
                        <button type="button" class="cart-remove-btn" data-remove-cart-item="${item.id}">Quitar</button>
                    </div>
                </article>
            `;
        }).join('');

        cartRefs.total.textContent = formatPrice(getTotal());
        updateCartActionState();
        syncCartHighlights();
    };

    /**
     * Abre el modal del carrito
     */
    const openCart = () => {
        if (!cartRefs) {
            return;
        }

        cartRefs.overlay.classList.remove('hidden');
        cartRefs.panel.classList.add('open');
        document.body.classList.add('modal-open');
    };

    /**
     * Cierra el modal del carrito
     */
    const closeCart = () => {
        if (!cartRefs) {
            return;
        }

        cartRefs.overlay.classList.add('hidden');
        cartRefs.panel.classList.remove('open');
        document.body.classList.remove('modal-open');

        // Ocultar el formulario y resetear el botón para la próxima vez
        const checkout = cartRefs.panel.querySelector('.cart-checkout');
        if (checkout) {
            checkout.classList.add('hidden');
        }
        if (cartRefs.send) {
            cartRefs.send.textContent = 'Comprar';
        }
    };

    /**
     * Agrega un item al carrito, combinando con items similares si existen
     * @param {object} detail - Detalles del item a agregar
     */
    const addItem = detail => {
        const unitPrice = Number(detail.total || detail.price || 0);
        const item = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name: detail.name || 'Producto',
            category: detail.category || getCategoryFromPage(),
            productType: detail.productType || getCurrentPageKey(),
            size: detail.size || '',
            crust: detail.crust || '',
            sauce: detail.sauce || '',
            halfMode: detail.halfMode || 'complete',
            halfAndHalf: Boolean(detail.halfAndHalf),
            secondHalf: detail.secondHalf || '',
            qty: 1,
            unitPrice: unitPrice,
            total: unitPrice
        };

        const existing = cartItems.find(current => (
            current.name === item.name
            && current.category === item.category
            && current.productType === item.productType
            && current.size === item.size
            && current.crust === item.crust
            && current.sauce === item.sauce
            && current.halfMode === item.halfMode
            && current.halfAndHalf === item.halfAndHalf
            && current.secondHalf === item.secondHalf
            && getItemUnitPrice(current) === unitPrice
        ));

        if (existing) {
            existing.qty = Number(existing.qty || 1) + 1;
            existing.unitPrice = getItemUnitPrice(existing);
            existing.total = getItemLineTotal(existing);
        } else {
            cartItems.push(item);
        }

        saveCart();
        renderCart();
    };

    /**
     * Remueve un item del carrito por su ID
     * @param {string} id - ID del item a remover
     */
    const removeItem = id => {
        cartItems = cartItems.filter(item => item.id !== id);
        saveCart();
        renderCart();
    };

    /**
     * Cambia la cantidad de un item del carrito
     * @param {string} id - ID del item
     * @param {number} delta - Cambio en la cantidad (+1 o -1)
     */
    const changeItemQty = (id, delta) => {
        const item = cartItems.find(current => current.id === id);
        if (!item) {
            return;
        }

        const nextQty = Number(item.qty || 1) + Number(delta || 0);

        if (nextQty <= 0) {
            removeItem(id);
            return;
        }

        item.qty = nextQty;
        item.total = getItemLineTotal(item);
        saveCart();
        renderCart();
    };

    /**
     * Vacía completamente el carrito
     */
    const clearCart = () => {
        cartItems = [];
        saveCart();
        renderCart();
    };

    /**
     * Muestra el formulario de checkout dentro del carrito.
     * Siempre reconstruye el bloque de entrega con los datos actuales de localStorage.
     */
    const showCheckoutForm = () => {
        if (!cartRefs || !cartRefs.panel) return;

        // Si el carrito está vacío, mostrar alerta y no continuar
        if (!cartItems.length) {
            showAlert('🛒 Agrega productos a tu carrito antes de continuar.', 'warning');
            return;
        }

        ensureCheckoutFields();

        const checkout = cartRefs.panel.querySelector('.cart-checkout');
        if (!checkout) return;

        // Reemplazar el bloque de entrega con los datos actuales de localStorage
        const existingBlock = checkout.querySelector('#cart-delivery-block');
        if (existingBlock) {
            const tmp = document.createElement('div');
            tmp.innerHTML = buildDeliveryBlock();
            const newBlock = tmp.firstElementChild;
            existingBlock.replaceWith(newBlock);
        }

        checkout.classList.remove('hidden');
        setCartRefsFromDom();
        setupCheckoutEventListeners();

        // Conectar botón "Cambiar" si existe
        const btnChange = checkout.querySelector('#btn-change-delivery');
        if (btnChange && !btnChange.dataset.listenerAttached) {
            btnChange.dataset.listenerAttached = '1';
            btnChange.addEventListener('click', () => {
                localStorage.removeItem('deliveryData');
                localStorage.removeItem('pickupData');
                const block = checkout.querySelector('#cart-delivery-block');
                if (block) {
                    const tmp2 = document.createElement('div');
                    tmp2.innerHTML = buildDeliveryBlock();
                    block.replaceWith(tmp2.firstElementChild);
                }
                setCartRefsFromDom();
                setupCheckoutEventListeners();
            });
        }

        loadBranches();

        if (cartRefs.send) {
            cartRefs.send.textContent = 'Confirmar compra';
        }

        checkout.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    /**
     * Muestra una alerta visual en el panel del carrito
     */
    const showAlert = (message, type = 'info') => {
        const colors = {
            warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: '⚠️' },
            error:   { bg: '#f8d7da', border: '#dc3545', text: '#721c24', icon: '❌' },
            success: { bg: '#d4edda', border: '#28a745', text: '#155724', icon: '✅' },
            info:    { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: 'ℹ️' },
        };
        const c = colors[type] || colors.info;

        const prev = document.getElementById('cart-alert-msg');
        if (prev) prev.remove();

        const alert = document.createElement('div');
        alert.id = 'cart-alert-msg';
        alert.style.cssText = `
            margin: 0 0 12px 0; padding: 12px 14px;
            background: ${c.bg}; border: 1px solid ${c.border}; border-left: 4px solid ${c.border};
            border-radius: 8px; color: ${c.text}; font-size: 0.9rem; font-weight: 600;
            display: flex; align-items: center; gap: 8px; animation: fadeInDown 0.25s ease;
        `;
        alert.innerHTML = `<span>${c.icon}</span><span>${message}</span>`;

        if (cartRefs && cartRefs.panel) {
            // Si el carrito está vacío, mostrar la alerta dentro de cart-items (visible de inmediato)
            // Si hay productos, mostrar encima del footer
            if (!cartItems.length && cartRefs.items) {
                cartRefs.items.insertAdjacentElement('afterbegin', alert);
            } else {
                const footer = cartRefs.panel.querySelector('.cart-footer');
                if (footer) footer.insertAdjacentElement('beforebegin', alert);
            }
        }

        setTimeout(() => alert.remove(), 4000);
    };

    /**
     * Muestra la ventana emergente de resumen antes de confirmar la compra
     */
    const showOrderConfirmModal = (formData) => {
        // Quitar modal previo si existe
        const prev = document.getElementById('order-confirm-modal');
        if (prev) prev.remove();

        const deliveryData = JSON.parse(localStorage.getItem('deliveryData') || '{}');
        const pickupData   = JSON.parse(localStorage.getItem('pickupData')   || '{}');

        // Construir resumen de entrega
        let deliveryHTML = '';
        if (formData.deliveryType === 'domicilio') {
            const addr = deliveryData.address || deliveryData.reference || 'Ubicación guardada';
            deliveryHTML = `<div class="ocm-delivery">🚚 <strong>Entrega a domicilio</strong><br><span>${addr}</span></div>`;
        } else if (formData.deliveryType === 'recoger') {
            const branch = pickupData.branchName || `Sucursal #${pickupData.branchId}`;
            deliveryHTML = `<div class="ocm-delivery">🏪 <strong>Recoger en sucursal</strong><br><span>${branch}</span></div>`;
        }

        // Construir lista de productos
        const itemsHTML = cartItems.map(item => `
            <div class="ocm-item">
                <span class="ocm-item-name">${item.name}${item.size ? ` <small>(${item.size})</small>` : ''}</span>
                <span class="ocm-item-qty">x${item.qty}</span>
                <span class="ocm-item-price">$${formatPrice(getItemLineTotal(item))}</span>
            </div>
        `).join('');

        const paymentLabel = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' }[formData.paymentMethod] || formData.paymentMethod;

        const modal = document.createElement('div');
        modal.id = 'order-confirm-modal';
        modal.innerHTML = `
            <div class="ocm-backdrop"></div>
            <div class="ocm-box" role="dialog" aria-modal="true" aria-labelledby="ocm-title">
                <div class="ocm-header">
                    <h2 id="ocm-title">🛒 Resumen de tu pedido</h2>
                </div>
                <div class="ocm-body">
                    <div class="ocm-section">
                        <p class="ocm-label">Cliente</p>
                        <p class="ocm-value">${formData.customerName} · ${formData.customerPhone}</p>
                    </div>
                    <div class="ocm-section">
                        <p class="ocm-label">Forma de entrega</p>
                        ${deliveryHTML}
                    </div>
                    <div class="ocm-section">
                        <p class="ocm-label">Productos</p>
                        <div class="ocm-items">${itemsHTML}</div>
                    </div>
                    <div class="ocm-section ocm-total-row">
                        <span>Total</span>
                        <strong>$${formatPrice(getTotal())}</strong>
                    </div>
                    <div class="ocm-section">
                        <p class="ocm-label">Pago</p>
                        <p class="ocm-value">${paymentLabel}</p>
                    </div>
                    ${formData.notes ? `<div class="ocm-section"><p class="ocm-label">Notas</p><p class="ocm-value">${formData.notes}</p></div>` : ''}
                </div>
                <div class="ocm-footer">
                    <button type="button" id="ocm-cancel" class="ocm-btn ocm-btn-cancel">Cancelar</button>
                    <button type="button" id="ocm-confirm" class="ocm-btn ocm-btn-confirm">✅ Confirmar compra</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Cerrar al hacer clic en backdrop o cancelar
        modal.querySelector('.ocm-backdrop').addEventListener('click', () => modal.remove());
        modal.querySelector('#ocm-cancel').addEventListener('click', () => modal.remove());

        // Confirmar compra
        modal.querySelector('#ocm-confirm').addEventListener('click', async () => {
            modal.querySelector('#ocm-confirm').disabled = true;
            modal.querySelector('#ocm-confirm').textContent = 'Enviando...';

            setSubmittingState(true);
            try {
                const response = await window.fetch(`${API_BASE}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildOrderPayload(formData))
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    const detail = data.detail ? ` (${data.detail})` : '';
                    throw new Error((data.error || 'No se pudo guardar el pedido.') + detail);
                }

                // Éxito — mostrar mensaje y limpiar
                modal.remove();
                showSuccessModal();
                clearCart();
                closeCart();
            } catch (error) {
                modal.remove();
                showAlert(error.message || 'No se pudo guardar el pedido.', 'error');
            } finally {
                setSubmittingState(false);
            }
        });
    };

    /**
     * Muestra el modal de compra realizada con éxito
     */
    const showSuccessModal = () => {
        const prev = document.getElementById('order-success-modal');
        if (prev) prev.remove();

        const modal = document.createElement('div');
        modal.id = 'order-success-modal';
        modal.innerHTML = `
            <div class="ocm-backdrop"></div>
            <div class="ocm-box ocm-success-box" role="dialog" aria-modal="true">
                <div class="ocm-success-icon">🎉</div>
                <h2>¡Compra realizada con éxito!</h2>
                <p>Tu pedido fue recibido. Pronto nos pondremos en contacto contigo.</p>
                <button type="button" id="ocm-success-close" class="ocm-btn ocm-btn-confirm" style="margin-top:16px;">Aceptar</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#ocm-success-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.ocm-backdrop').addEventListener('click', () => modal.remove());
    };

    /**
     * Confirma y envía el pedido — ahora muestra el modal de resumen primero
     */
    const confirmOrder = async () => {
        if (!cartItems.length || isSubmittingOrder) return;

        // Log de diagnóstico — ver en consola del navegador (F12)
        const _dd = JSON.parse(localStorage.getItem('deliveryData') || '{}');
        const _pd = JSON.parse(localStorage.getItem('pickupData')   || '{}');
        console.log('[confirmOrder] deliveryData:', _dd);
        console.log('[confirmOrder] pickupData:', _pd);

        const formData = getOrderFormData();
        console.log('[confirmOrder] formData.deliveryType:', formData.deliveryType);

        const validationError = validateOrderForm(formData);

        if (validationError) {
            showAlert(validationError, 'error');
            return;
        }

        showOrderConfirmModal(formData);
    };

    /**
     * Punto de entrada del botón "Comprar":
     * si el carrito está vacío avisa, si el formulario no está visible lo muestra,
     * si ya está visible lanza el modal de confirmación.
     */
    const submitOrder = () => {
        if (isSubmittingOrder) return;

        if (!cartItems.length) {
            // Abrir el carrito si no está abierto
            const isOpen = cartRefs && cartRefs.panel && cartRefs.panel.classList.contains('open');
            if (!isOpen) openCart();

            // Resaltar el mensaje de carrito vacío con animación
            setTimeout(() => {
                const emptyMsg = document.getElementById('cart-empty-msg');
                if (emptyMsg) {
                    emptyMsg.style.transition = 'background 0.2s';
                    emptyMsg.style.background = '#fff3cd';
                    emptyMsg.style.borderRadius = '12px';
                    // Agregar texto de alerta si no existe
                    if (!emptyMsg.querySelector('.cart-empty-alert')) {
                        const alert = document.createElement('p');
                        alert.className = 'cart-empty-alert';
                        alert.style.cssText = 'margin:10px 0 0;font-size:0.9rem;font-weight:700;color:#856404;';
                        alert.textContent = '⚠️ Agrega productos antes de continuar';
                        emptyMsg.appendChild(alert);
                        setTimeout(() => {
                            emptyMsg.style.background = '';
                            alert.remove();
                        }, 3500);
                    }
                }
            }, isOpen ? 0 : 80);
            return;
        }

        const checkout = cartRefs && cartRefs.panel
            ? cartRefs.panel.querySelector('.cart-checkout')
            : null;
        const formVisible = checkout && !checkout.classList.contains('hidden');

        if (!formVisible) {
            showCheckoutForm();
        } else {
            confirmOrder();
        }
    };

    /**
     * Asegura que el botón de envío del pedido exista en el DOM
     */


    /**
     * Asegura que los campos del formulario de checkout existan en el DOM
     */
    /**
     * Construye el bloque HTML de entrega según si ya hay una selección guardada o no.
     * Todo queda envuelto en un único div#cart-delivery-block para poder reemplazarlo fácilmente.
     */
    const buildDeliveryBlock = () => {
        const deliveryRaw  = localStorage.getItem('deliveryData');
        const pickupRaw    = localStorage.getItem('pickupData');
        const deliveryData = JSON.parse(deliveryRaw  || '{}');
        const pickupData   = JSON.parse(pickupRaw    || '{}');

        // Log de diagnóstico — visible en consola del navegador
        console.log('[Cart] buildDeliveryBlock — deliveryData:', deliveryData, '| pickupData:', pickupData);

        const hasDomicilio = !!(deliveryData.type === 'domicilio' || (deliveryData.lat && deliveryData.lng));
        const hasRecoger   = pickupData.branchId !== undefined && pickupData.branchId !== null && pickupData.branchId !== '';

        console.log('[Cart] hasDomicilio:', hasDomicilio, '| hasRecoger:', hasRecoger);

        // Ya eligió domicilio
        if (hasDomicilio) {
            const addr = deliveryData.address || deliveryData.reference || 'Ubicación guardada';
            return `
                <div id="cart-delivery-block">
                    <div style="margin-bottom: 16px; padding: 12px 15px; border: 1px solid #28a745; border-radius: 8px; background: #f0fff4; display: flex; align-items: flex-start; gap: 10px;">
                        <span style="font-size: 1.3em;">🚚</span>
                        <div style="flex:1;">
                            <strong style="color: #155724;">Entrega a domicilio</strong>
                            <p style="margin: 4px 0 0; font-size: 13px; color: #555;">${addr}</p>
                        </div>
                        <button type="button" id="btn-change-delivery" style="background:none; border:none; color:#007bff; cursor:pointer; font-size:12px; white-space:nowrap; padding:0;">Cambiar</button>
                    </div>
                    <input type="hidden" id="cart-delivery-type" value="domicilio">
                </div>
            `;
        }

        // Ya eligió recoger en sucursal
        if (hasRecoger) {
            const branchName = pickupData.branchName || `Sucursal #${pickupData.branchId}`;
            return `
                <div id="cart-delivery-block">
                    <div style="margin-bottom: 16px; padding: 12px 15px; border: 1px solid #28a745; border-radius: 8px; background: #f0fff4; display: flex; align-items: flex-start; gap: 10px;">
                        <span style="font-size: 1.3em;">🏪</span>
                        <div style="flex:1;">
                            <strong style="color: #155724;">Recoger en sucursal</strong>
                            <p style="margin: 4px 0 0; font-size: 13px; color: #555;">${branchName}</p>
                        </div>
                        <button type="button" id="btn-change-delivery" style="background:none; border:none; color:#007bff; cursor:pointer; font-size:12px; white-space:nowrap; padding:0;">Cambiar</button>
                    </div>
                    <input type="hidden" id="cart-delivery-type" value="recoger">
                </div>
            `;
        }

        // No ha elegido nada → mostrar botones de selección
        return `
            <div id="cart-delivery-block">
                <div style="margin-bottom: 16px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f8f9fa;">
                    <h4 style="margin: 0 0 12px 0; color: #333; font-size: 0.95rem;">¿Cómo quieres recibir tu pedido?</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button type="button" class="btn-delivery-type" data-delivery-type="domicilio" style="flex: 1; min-width: 110px; padding: 10px; border: 2px solid #007bff; background: white; color: #007bff; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                            🚚 A domicilio
                        </button>
                        <button type="button" class="btn-delivery-type" data-delivery-type="recoger" style="flex: 1; min-width: 110px; padding: 10px; border: 2px solid #28a745; background: white; color: #28a745; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                            🏪 Recoger en sucursal
                        </button>
                    </div>
                    <input type="hidden" id="cart-delivery-type" value="">
                </div>
            </div>
        `;
    };

    const ensureCheckoutFields = () => {
        if (!cartRefs || !cartRefs.panel) {
            return;
        }

        const footer = cartRefs.panel.querySelector('.cart-footer');
        if (!footer) {
            return;
        }

        let checkout = footer.querySelector('.cart-checkout');
        if (!checkout) {
            checkout = document.createElement('div');
            checkout.className = 'cart-checkout hidden';
            checkout.innerHTML = `
                ${buildDeliveryBlock()}

                <label class="cart-field">
                    <span>Nombre <span style="color: #dc3545;">*</span></span>
                    <input type="text" id="cart-customer-name" placeholder="Tu nombre completo" required>
                </label>
                <label class="cart-field">
                    <span>Número de celular <span style="color: #dc3545;">*</span></span>
                    <input type="tel" id="cart-customer-phone" placeholder="2221234567" maxlength="10" required>
                    <small style="color: #6c757d; font-size: 12px;">Solo números, 10 dígitos, válido en México</small>
                </label>
                <div class="cart-field-grid">
                    <label class="cart-field">
                        <span>Método de pago</span>
                        <select id="cart-payment-method">
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                            <option value="transferencia">Transferencia</option>
                        </select>
                    </label>
                </div>
                <label class="cart-field hidden" id="cart-branch-wrap">
                    <span>Sucursal</span>
                    <select id="cart-branch-id">
                        <option value="">Selecciona una sucursal</option>
                    </select>
                </label>
                <label class="cart-field hidden" id="cart-delivery-wrap">
                    <span>Dirección de entrega</span>
                    <textarea id="cart-delivery-address" rows="2" placeholder="Calle, número, colonia, referencias"></textarea>
                </label>
                <label class="cart-field">
                    <span>Notas</span>
                    <textarea id="cart-order-notes" rows="2" placeholder="Indicaciones del pedido"></textarea>
                </label>
            `;

            const totalRow = footer.querySelector('.cart-total-row');
            footer.insertBefore(checkout, totalRow || footer.firstChild);

            // Configurar event listeners para el formulario
            setupCheckoutEventListeners();
        }
    };

    /**
     * Establece las referencias del DOM para los elementos del carrito
     */
    const setCartRefsFromDom = () => {
        cartRefs = {
            overlay: document.getElementById('cart-overlay'),
            panel: document.getElementById('cart-panel'),
            items: document.getElementById('cart-items'),
            total: document.getElementById('cart-total-value'),
            send: document.getElementById('cart-send-whatsapp'),
            clear: document.getElementById('cart-clear'),
            customerName: document.getElementById('cart-customer-name'),
            customerPhone: document.getElementById('cart-customer-phone'),
            deliveryType: document.getElementById('cart-delivery-type'),
            branchId: document.getElementById('cart-branch-id'),
            branchWrap: document.getElementById('cart-branch-wrap'),
            paymentMethod: document.getElementById('cart-payment-method'),
            deliveryWrap: document.getElementById('cart-delivery-wrap'),
            deliveryAddress: document.getElementById('cart-delivery-address'),
            notes: document.getElementById('cart-order-notes')
        };
    };

    /**
     * Asegura que la UI del carrito esté presente y configurada
     */
    const ensureCartUI = () => {
        if (document.getElementById('cart-overlay')) {
            setCartRefsFromDom();
            cartRefs.send.addEventListener('click', submitOrder);
            return;
        }

        const markup = document.createElement('div');
        markup.innerHTML = `
            <div class="cart-toast" id="cart-toast"></div>
            <div class="modal-overlay hidden cart-overlay" id="cart-overlay">
                <aside class="cart-panel" id="cart-panel" aria-labelledby="cart-title" aria-modal="true" role="dialog">
                    <div class="cart-header">
                        <div>
                            <p class="modal-tag">Tu pedido</p>
                            <h2 id="cart-title">Carrito</h2>
                        </div>
                        <button type="button" class="modal-close" id="cart-close" aria-label="Cerrar carrito">&times;</button>
                    </div>
                    <div class="cart-items" id="cart-items"></div>
                    <div class="cart-footer">
                        <div class="cart-total-row">
                            <span>Total</span>
                            <strong id="cart-total-value">$0</strong>
                        </div>
                        <div class="cart-actions-row">
                            <button type="button" class="btn-add" id="cart-send-whatsapp">Comprar</button>
                            <button type="button" class="btn-add btn-secondary" id="cart-clear">Vaciar</button>
                        </div>
                    </div>
                </aside>
            </div>
        `;

        const fragment = document.createDocumentFragment();
        while (markup.firstElementChild) {
            fragment.appendChild(markup.firstElementChild);
        }
        document.body.appendChild(fragment);

        toastRef = document.getElementById('cart-toast');
        setCartRefsFromDom();

        const closeBtn = document.getElementById('cart-close');

        closeBtn.addEventListener('click', closeCart);
        cartRefs.overlay.addEventListener('click', event => {
            if (event.target === cartRefs.overlay) {
                closeCart();
            }
        });
        cartRefs.items.addEventListener('click', event => {
            const incBtn = event.target.closest('[data-cart-inc]');
            if (incBtn) {
                changeItemQty(incBtn.getAttribute('data-cart-inc'), 1);
                return;
            }

            const decBtn = event.target.closest('[data-cart-dec]');
            if (decBtn) {
                changeItemQty(decBtn.getAttribute('data-cart-dec'), -1);
                return;
            }

            const removeBtn = event.target.closest('[data-remove-cart-item]');
            if (!removeBtn) {
                return;
            }
            removeItem(removeBtn.getAttribute('data-remove-cart-item'));
        });
        cartRefs.clear.addEventListener('click', clearCart);
        cartRefs.send.addEventListener('click', submitOrder);
    };

    // Event listener para abrir el carrito desde la navegación
    document.addEventListener('click', event => {
        const cartTrigger = event.target.closest('.nav-carrito');
        if (!cartTrigger) {
            return;
        }

        event.preventDefault();
        openCart();
    });

    // Event listener para agregar items al carrito desde las tarjetas del menú
    document.addEventListener('click', event => {
        const addButton = event.target.closest('.menu-item .btn-add');
        if (!addButton || shouldSkipAutoAdd(addButton)) {
            return;
        }

        event.preventDefault();

        const detail = buildDetailFromCard(addButton);
        if (!detail) {
            return;
        }

        addItem(detail);
    });

    // Event listener para cerrar el carrito con la tecla Escape
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeCart();
        }
    });

    // Event listener para agregar items al carrito via eventos custom
    document.addEventListener('cart:add', event => {
        if (!event.detail) {
            return;
        }

        addItem(event.detail);
    });

    // Inicialización del carrito
    ensureCartUI();

    if (!toastRef) {
        toastRef = document.getElementById('cart-toast');
    }

    wrapCardFooters();
    document.addEventListener('menu:sectionchange', () => {
        wrapCardFooters();
        syncCartHighlights();
    });
    renderCart();

    // Exponer API pública para integración con otros módulos
    window.Cart = {
        getItems: () => JSON.parse(JSON.stringify(cartItems)), // Copia profunda
        clearCart,
        getTotal,
        submitOrder,
        showToast
    };

    // Hacer cartItems accesible globalmente para delivery-form
    Object.defineProperty(window, 'cartItems', {
        get() {
            return cartItems;
        },
        enumerable: true
    });
})();
