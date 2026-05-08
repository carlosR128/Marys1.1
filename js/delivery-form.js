/**
 * Módulo de Gestión de Pedidos - ARQUITECTURA DE DOS FASES
 * ---
 * FASE 1: Selección de ubicación (SIN carrito requerido)
 *   - Domicilio: seleccionar ubicación en mapa
 *   - Sucursal: seleccionar sucursal de 3 disponibles
 * 
 * FASE 2: Completar pedido (Desde carrito)
 *   - Nombre, teléfono, observaciones
 *   - Usar ubicación seleccionada en FASE 1
 */

(() => {
    const API_BASE = window.ABCG_API_BASE || 'http://localhost:3000';

    const DELIVERY_DIALOG_TEMPLATE = `
        <dialog id="dialog-delivery" class="location-dialog">
            <div class="dialog-header">
                <h2>📍 Selecciona tu ubicación</h2>
                <button class="dialog-close" data-close="dialog-delivery" aria-label="Cerrar">&times;</button>
            </div>
            <div class="dialog-content">
                <div id="current-tab" class="tab-content active">
                    <button id="btn-use-current-location" class="btn btn-primary">📍 Usar mi ubicación actual</button>
                    <div id="current-location-form" class="current-location-form" style="display: none; margin-top: 16px;">
                        <p id="current-location-status" class="location-status"></p>
                        <div id="location-error-actions" class="location-error-actions" style="display: none; margin-top: 12px;">
                            <button id="btn-retry-location" class="btn btn-secondary">Intentar de nuevo</button>
                        </div>
                        <div id="current-location-link" class="location-link"></div>
                    </div>
                </div>
                <div id="location-confirmation" class="location-confirmation" style="display: none;">
                    <div class="confirm-header">
                        <h3>📍 Ubicación detectada</h3>
                    </div>
                    <div class="confirm-body">
                        <!-- Dirección -->
                        <div class="location-block">
                            <p class="location-label">Dirección</p>
                            <p class="location-value" id="confirm-address"></p>
                        </div>

                        <!-- Estado de cobertura -->
                        <div class="location-block">
                            <p class="location-label">Cobertura de entrega</p>
                            <span id="confirm-coverage" class="coverage-badge"></span>
                        </div>

                        <!-- Nota si está fuera de cobertura -->
                        <p id="coverage-note" class="coverage-note" style="display: none; margin-top: 12px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; color: #856404;"></p>

                        <!-- Referencia para el repartidor (OBLIGATORIA) -->
                        <div class="location-block">
                            <label for="delivery-reference" class="location-label">
                                Referencia para el repartidor <span style="color: #dc3545;">*</span>
                            </label>
                            <textarea
                                id="delivery-reference"
                                class="delivery-reference-input"
                                placeholder="Ej: Casa blanca con portón negro, junto a la tienda Oxxo"
                                rows="3"
                                required
                            ></textarea>
                            <small style="color: #6c757d; font-size: 12px;">Campo obligatorio para que el repartidor te encuentre</small>
                        </div>

                        <!-- Link a Google Maps -->
                        <div id="confirm-location-link" class="location-link" style="margin-top: 12px;"></div>
                    </div>
                    <div class="confirm-footer">
                        <button id="btn-confirm-location" class="btn btn-primary">Confirmar ubicación</button>
                    </div>
                </div>
            </div>
        </dialog>
        <dialog id="dialog-pickup" class="location-dialog">
            <div class="dialog-header">
                <h2>🏪 Selecciona tu sucursal</h2>
                <button class="dialog-close" data-close="dialog-pickup" aria-label="Cerrar">&times;</button>
            </div>
            <div class="dialog-content">
                <div id="branches-list" class="branches-list"></div>
            </div>
        </dialog>
        <div id="delivery-toast" class="delivery-toast"></div>
    `;

    const injectDeliveryUIIfNeeded = () => {
        // Botones ahora están estáticos en todas las páginas
        // Solo inyectamos los diálogos si no existen
        if (!document.getElementById('dialog-delivery') || !document.getElementById('dialog-pickup')) {
            document.body.insertAdjacentHTML('beforeend', DELIVERY_DIALOG_TEMPLATE);
        }
    };

    injectDeliveryUIIfNeeded();

    let refs = null;
    const getRefs = () => ({
        btnDomicilio: document.getElementById('btn-domicilio'),
        btnSucursal: document.getElementById('btn-sucursal'),
        dialogDelivery: document.getElementById('dialog-delivery'),
        dialogPickup: document.getElementById('dialog-pickup'),
        toast: document.getElementById('delivery-toast'),
        branchesList: document.getElementById('branches-list'),
        btnUseCurrentLocation: document.getElementById('btn-use-current-location'),
        currentLocationStatus: document.getElementById('current-location-status'),
        currentLocationLink: document.getElementById('current-location-link'),
        currentLocationForm: document.getElementById('current-location-form'),
        locationErrorActions: document.getElementById('location-error-actions'),
        btnRetryLocation: document.getElementById('btn-retry-location'),
        locationConfirmation: document.getElementById('location-confirmation'),
        confirmAddress: document.getElementById('confirm-address'),
        confirmCoverage: document.getElementById('confirm-coverage'),
        confirmLocationLink: document.getElementById('confirm-location-link'),
        coverageNote: document.getElementById('coverage-note'),
        deliveryReference: document.getElementById('delivery-reference'),
        btnConfirmLocation: document.getElementById('btn-confirm-location')
    });

    refs = getRefs();


    // ===========================
    // ESTADO LOCAL
    // ===========================

    let currentPhase = null; // 'delivery' o 'pickup'
    let selectedLocation = null;
    let currentLocationCoordinates = { lat: null, lng: null, mapsUrl: null };
    let currentLocationQueryInProgress = false;

    // ===========================
    // UTILIDADES
    // ===========================

    /**
     * Muestra un toast con mensaje
     */
    const showToast = (message, type = 'success') => {
        if (!refs.toast) return;
        
        refs.toast.textContent = message;
        refs.toast.className = `delivery-toast ${type === 'success' ? '' : type}`;
        refs.toast.classList.add('show');
        
        if (type !== 'loading') {
            setTimeout(() => {
                refs.toast.classList.remove('show');
            }, 3000);
        }
    };

    /**
     * Abre un dialog
     */
    const openDialog = (dialogElement) => {
        if (!dialogElement) return;
        if (dialogElement.showModal) {
            dialogElement.showModal();
        } else {
            dialogElement.style.display = 'block';
        }
    };

    /**
     * Cierra un dialog
     */
    const closeDialog = (dialogElement) => {
        if (!dialogElement) return;
        if (dialogElement.close) {
            dialogElement.close();
        } else {
            dialogElement.style.display = 'none';
        }
    };

    // ===========================
    // FASE 1: SELECCIÓN DE UBICACIÓN (DOMICILIO)
    // ===========================

    /**
     * Abre el diálogo de selección de domicilio
     */
    const openDeliveryDialog = () => {
        currentPhase = 'delivery';
        openDialog(refs.dialogDelivery);

        if (refs.btnUseCurrentLocation) {
            refs.btnUseCurrentLocation.style.display = '';
        }
        if (refs.currentLocationStatus) {
            refs.currentLocationStatus.innerHTML = '';
        }
        if (refs.currentLocationLink) {
            refs.currentLocationLink.innerHTML = '';
        }
        if (refs.locationErrorActions) {
            refs.locationErrorActions.style.display = 'none';
        }
        if (refs.currentLocationForm) {
            refs.currentLocationForm.style.display = 'none';
        }
            if (refs.detectedAddress) {
                refs.detectedAddress.value = '';
            }
        if (refs.locationConfirmation) {
            refs.locationConfirmation.style.display = 'none';
        }
        if (refs.confirmLocationLink) {
            refs.confirmLocationLink.innerHTML = '';
        }
        if (refs.coverageNote) {
            refs.coverageNote.textContent = '';
        }
    };

    /**
     * Abre el diálogo de selección de sucursal
     */
    const openPickupDialog = () => {
        currentPhase = 'pickup';
        openDialog(refs.dialogPickup);

        // No mostrar mapa, solo lista de sucursales
        renderBranchesList();
    };

    /**
     * Renderiza lista de sucursales
     */
    const renderBranchesList = () => {
        if (!window.LocationService || !refs.branchesList) return;

        const branches = window.LocationService.getBranches();
        refs.branchesList.innerHTML = '';
        
        // Obtener sucursal seleccionada actualmente
        const savedPickupData = JSON.parse(localStorage.getItem('pickupData') || '{}');
        const selectedBranchId = savedPickupData.branchId;

        branches.forEach(branch => {
            const branchElement = document.createElement('div');
            const isSelected = branch.id === selectedBranchId;
            branchElement.className = `branch-item${isSelected ? ' selected' : ''}`;
            branchElement.innerHTML = `
                <div class="branch-info">
                    <h3>${branch.name}</h3>
                    <p>${branch.address}</p>
                </div>
                <button class="btn btn-select-branch" data-branch-id="${branch.id}">
                    ${isSelected ? '✓ Seleccionada' : 'Seleccionar sucursal'}
                </button>
            `;

            const selectBtn = branchElement.querySelector('.btn-select-branch');
            selectBtn.addEventListener('click', () => {
                selectBranch(branch.id, branch.name);
            });

            refs.branchesList.appendChild(branchElement);
        });
    };

    /**
     * Selecciona una sucursal
     */
    const selectBranch = (branchId, branchName) => {
        if (window.LocationService) {
            selectedLocation = window.LocationService.setPickupBranch(branchId);
            
            const pickupData = {
                branchId: branchId,
                branchName: branchName,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('pickupData', JSON.stringify(pickupData));
            localStorage.removeItem('deliveryData');
            
            showToast(`✅ Sucursal "${branchName}" seleccionada`, 'success');
            renderBranchesList();
            closeDialog(refs.dialogPickup);

            // Actualizar indicador visual en la página
            updateDeliveryIndicator();
        }
    };

    // ===========================
    // BÚSQUEDA DE DIRECCIONES
    // ===========================

    /**
     * Usa la ubicación actual del navegador
     */
    const useCurrentLocation = async () => {
        if (currentLocationQueryInProgress) {
            showToast('Espere un momento, ya se está obteniendo la dirección...', 'loading');
            return;
        }

        if (!window.LocationService) {
            console.error('Servicio de ubicación no disponible');
            return;
        }

        currentLocationQueryInProgress = true;
        if (refs.btnUseCurrentLocation) {
            refs.btnUseCurrentLocation.disabled = true;
        }
        if (refs.currentLocationStatus) {
            refs.currentLocationStatus.innerHTML = '<p>Obteniendo dirección...</p>';
        }
        if (refs.currentLocationLink) {
            refs.currentLocationLink.innerHTML = '';
        }
        if (refs.locationErrorActions) {
            refs.locationErrorActions.style.display = 'none';
        }
        if (refs.currentLocationForm) {
            refs.currentLocationForm.style.display = 'block';
        }

        try {
            const location = await window.LocationService.getCurrentLocation();
            currentLocationCoordinates.lat = location.lat;
            currentLocationCoordinates.lng = location.lng;
            currentLocationCoordinates.mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

            let detectedAddress = `Lat ${location.lat.toFixed(6)}, Lng ${location.lng.toFixed(6)}`;
            let reverseResult = null;

            if (window.MapsService && typeof window.MapsService.reverseGeocodeCoordinates === 'function') {
                try {
                    reverseResult = await window.MapsService.reverseGeocodeCoordinates(location.lat, location.lng);
                    if (reverseResult && reverseResult.formattedAddress) {
                        detectedAddress = reverseResult.formattedAddress;
                    } else {
                        detectedAddress = 'Dirección no disponible';
                    }
                } catch (geocodeError) {
                    detectedAddress = 'No se pudo obtener la dirección';
                    console.warn('Reverse geocode failed:', geocodeError);
                }
            }

            if (refs.currentLocationStatus) {
                refs.currentLocationStatus.innerHTML = `
                    <p class="success">📍 Dirección detectada: <strong>${detectedAddress}</strong></p>
                `;
            }
            if (refs.currentLocationLink) {
                refs.currentLocationLink.innerHTML = '';
            }
            if (refs.btnUseCurrentLocation) {
                refs.btnUseCurrentLocation.style.display = 'none';
            }

            selectDeliveryLocation(location.lat, location.lng, detectedAddress);
        } catch (error) {
            console.error('Error getting location:', error);

            let userFriendlyMessage = 'No se pudo obtener tu ubicación.';

            if (error.includes('HTTPS')) {
                userFriendlyMessage = 'Para usar la geolocalización, el sitio debe estar en HTTPS. Si eres el administrador, configura SSL en tu servidor.';
            } else if (error.includes('Permiso')) {
                userFriendlyMessage = 'Permiso de ubicación denegado. Haz clic en el ícono de candado en la barra de direcciones y permite el acceso a la ubicación.';
            } else if (error.includes('GPS')) {
                userFriendlyMessage = 'Ubicación no disponible. Verifica que tengas GPS habilitado en tu dispositivo.';
            }

            if (refs.currentLocationStatus) {
                refs.currentLocationStatus.innerHTML = `<p class="error">${userFriendlyMessage}</p>`;
            }
            if (refs.currentLocationLink) {
                refs.currentLocationLink.innerHTML = '';
            }
            if (refs.locationErrorActions) {
                refs.locationErrorActions.style.display = 'block';
            }
        } finally {
            currentLocationQueryInProgress = false;
            if (refs.btnUseCurrentLocation && refs.btnUseCurrentLocation.style.display !== 'none') {
                refs.btnUseCurrentLocation.disabled = false;
            }
        }
    };

    /**
     * Selecciona una ubicación de domicilio
     */
    const selectDeliveryLocation = (lat, lng, address) => {
        if (window.LocationService) {
            selectedLocation = window.LocationService.setDeliveryLocation(lat, lng, address);
            
            // Mostrar dirección
            if (refs.confirmAddress) refs.confirmAddress.textContent = address;
            
            // Validar cobertura
            const validation = window.LocationService.validateDeliveryLocation(lat, lng);
            const coverageBadge = refs.confirmCoverage;
            if (coverageBadge) {
                if (validation.inCoverage) {
                    coverageBadge.textContent = '✅ En zona de cobertura';
                    coverageBadge.className = 'coverage-badge in-coverage';
                } else {
                    coverageBadge.textContent = '❌ Fuera de zona de cobertura';
                    coverageBadge.className = 'coverage-badge out-coverage';
                }
            }

            if (refs.confirmLocationLink) {
                refs.confirmLocationLink.innerHTML = currentLocationCoordinates.mapsUrl
                    ? `<a href="${currentLocationCoordinates.mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Ver en Google Maps</a>`
                    : '';
            }

            // Mostrar nota de cobertura si es necesario
            if (refs.coverageNote) {
                if (validation.inCoverage) {
                    refs.coverageNote.style.display = 'none';
                } else {
                    refs.coverageNote.style.display = 'block';
                    refs.coverageNote.textContent = 'Tu dirección está fuera de la zona de entrega configurada. Si estás cerca de la sucursal, revisa que el GPS esté ubicándote correctamente.';
                }
            }

            // Cargar referencia guardada si existe
            if (refs.deliveryReference) {
                const savedDeliveryData = JSON.parse(localStorage.getItem('deliveryData') || '{}');
                refs.deliveryReference.value = savedDeliveryData.reference || '';
            }

            // Mostrar confirmación
            if (refs.locationConfirmation) {
                refs.locationConfirmation.style.display = 'block';
            }
        }
    };

    // ===========================
    // EVENT LISTENERS
    // ===========================

    // Botones principales
    if (refs.btnDomicilio) {
        refs.btnDomicilio.addEventListener('click', openDeliveryDialog);
    }
    if (refs.btnSucursal) {
        refs.btnSucursal.addEventListener('click', openPickupDialog);
    }

    // Cerrar dialogs
    document.querySelectorAll('.dialog-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dialogId = e.target.dataset.close;
            const dialog = document.getElementById(dialogId);
            closeDialog(dialog);
        });
    });

    // Ubicación actual
    if (refs.btnUseCurrentLocation) {
        refs.btnUseCurrentLocation.addEventListener('click', useCurrentLocation);
    }

    // Reintentar ubicación
    if (refs.btnRetryLocation) {
        refs.btnRetryLocation.addEventListener('click', () => {
            if (refs.locationErrorActions) {
                refs.locationErrorActions.style.display = 'none';
            }
            useCurrentLocation();
        });
    }

    // Confirmación
    if (refs.btnConfirmLocation) {
        refs.btnConfirmLocation.addEventListener('click', () => {
            // Validar que la referencia sea obligatoria
            if (refs.deliveryReference && !refs.deliveryReference.value.trim()) {
                showToast('La referencia para el repartidor es obligatoria', 'error');
                refs.deliveryReference.focus();
                return;
            }

            // Guardar referencia del repartidor + lat/lng en localStorage
            const deliveryData = JSON.parse(localStorage.getItem('deliveryData') || '{}');
            if (refs.deliveryReference && refs.deliveryReference.value.trim()) {
                deliveryData.reference = refs.deliveryReference.value.trim();
            }
            // Marcar siempre como domicilio
            deliveryData.type = 'domicilio';
            // Guardar coordenadas si están disponibles
            if (currentLocationCoordinates.lat && currentLocationCoordinates.lng) {
                deliveryData.lat = currentLocationCoordinates.lat;
                deliveryData.lng = currentLocationCoordinates.lng;
            }
            // Guardar la dirección detectada
            if (refs.confirmAddress && refs.confirmAddress.textContent) {
                deliveryData.address = refs.confirmAddress.textContent;
            }
            localStorage.setItem('deliveryData', JSON.stringify(deliveryData));
            localStorage.removeItem('pickupData');

            showToast('✅ Ubicación confirmada. Ahora agrega productos al carrito.', 'success');
            closeDialog(refs.dialogDelivery);
            if (refs.locationConfirmation) {
                refs.locationConfirmation.style.display = 'none';
            }

            // Actualizar indicador visual en la página
            updateDeliveryIndicator();
        });
    }

    // Guardar referencia automáticamente mientras se escribe
    if (refs.deliveryReference) {
        refs.deliveryReference.addEventListener('blur', () => {
            const deliveryData = JSON.parse(localStorage.getItem('deliveryData') || '{}');
            deliveryData.reference = refs.deliveryReference.value.trim();
            localStorage.setItem('deliveryData', JSON.stringify(deliveryData));
        });
    }

    // ===========================
    // INDICADOR VISUAL DE SELECCIÓN ACTIVA
    // ===========================

    /**
     * Actualiza los botones de la página para mostrar cuál forma de entrega está activa,
     * y muestra/oculta el indicador de selección debajo de los botones.
     */
    const updateDeliveryIndicator = () => {
        const deliveryData = JSON.parse(localStorage.getItem('deliveryData') || '{}');
        const pickupData   = JSON.parse(localStorage.getItem('pickupData')   || '{}');

        const hasDomicilio = !!(deliveryData.type === 'domicilio' || (deliveryData.lat && deliveryData.lng));
        const hasRecoger   = pickupData.branchId !== undefined && pickupData.branchId !== null && pickupData.branchId !== '';

        const btnDomicilio = document.getElementById('btn-domicilio');
        const btnSucursal  = document.getElementById('btn-sucursal');

        // Resetear botones a su estado original
        if (btnDomicilio) {
            btnDomicilio.style.boxShadow = '';
            btnDomicilio.style.opacity  = '';
            btnDomicilio.textContent    = 'A domicilio';
        }
        if (btnSucursal) {
            btnSucursal.style.boxShadow = '';
            btnSucursal.style.opacity  = '';
            btnSucursal.textContent    = 'Recoger';
        }

        // Quitar indicador previo
        const prev = document.getElementById('delivery-active-indicator');
        if (prev) prev.remove();

        // Buscar el contenedor .hero-center para insertar el indicador DENTRO, no al lado
        const heroCenter = document.querySelector('.hero-center');
        if (!heroCenter) return;

        if (hasDomicilio) {
            const addr = deliveryData.address || deliveryData.reference || 'Ubicación guardada';
            if (btnDomicilio) {
                btnDomicilio.style.boxShadow = '0 0 0 3px #28a745';
                btnDomicilio.textContent     = '✓ A domicilio';
            }
            if (btnSucursal) btnSucursal.style.opacity = '0.45';

            heroCenter.insertAdjacentHTML('beforeend', `
                <div id="delivery-active-indicator" style="
                    width:100%; margin-top:10px; padding:7px 14px;
                    background:#f0fff4; border:1px solid #28a745; border-radius:10px;
                    font-size:0.85rem; color:#155724; font-weight:600;
                    display:flex; align-items:center; justify-content:center; gap:8px;
                ">
                    🚚 <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Entrega a domicilio — ${addr}</span>
                    <button onclick="localStorage.removeItem('deliveryData'); window.DeliveryForm && window.DeliveryForm.updateIndicator();"
                        style="background:none;border:none;color:#888;cursor:pointer;font-size:0.95rem;padding:0;flex-shrink:0;" title="Cambiar">✕</button>
                </div>`);

        } else if (hasRecoger) {
            const branchName = pickupData.branchName || `Sucursal #${pickupData.branchId}`;
            if (btnSucursal) {
                btnSucursal.style.boxShadow = '0 0 0 3px #28a745';
                btnSucursal.textContent     = '✓ Recoger';
            }
            if (btnDomicilio) btnDomicilio.style.opacity = '0.45';

            heroCenter.insertAdjacentHTML('beforeend', `
                <div id="delivery-active-indicator" style="
                    width:100%; margin-top:10px; padding:7px 14px;
                    background:#f0fff4; border:1px solid #28a745; border-radius:10px;
                    font-size:0.85rem; color:#155724; font-weight:600;
                    display:flex; align-items:center; justify-content:center; gap:8px;
                ">
                    🏪 <span>Recoger en: ${branchName}</span>
                    <button onclick="localStorage.removeItem('pickupData'); window.DeliveryForm && window.DeliveryForm.updateIndicator();"
                        style="background:none;border:none;color:#888;cursor:pointer;font-size:0.95rem;padding:0;flex-shrink:0;" title="Cambiar">✕</button>
                </div>`);
        }
    };

    // Ejecutar al cargar la página
    updateDeliveryIndicator();

    // ===========================
    // API PÚBLICA
    // ===========================

    window.DeliveryForm = {
        openDeliveryDialog,
        openPickupDialog,
        updateIndicator: updateDeliveryIndicator,
        getSelectedLocation: () => selectedLocation,
        saveSelectedLocation: () => {
            if (selectedLocation) {
                sessionStorage.setItem('selectedLocation', JSON.stringify(selectedLocation));
                return true;
            }
            return false;
        }
    };

    console.log('✅ DeliveryForm cargado - Arquitectura de dos fases lista');
})();
