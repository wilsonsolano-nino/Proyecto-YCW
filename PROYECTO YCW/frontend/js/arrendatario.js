// ==========================================
// FUNCIÓN SHOWTAB - NAVEGACIÓN ENTRE PESTAÑAS
// ==========================================
function showTab(tabName, event) {
    console.log(`📂 Cambiando a pestaña: ${tabName}`);
    
    // Ocultar todos los contenidos de pestañas
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remover clase active de todas las pestañas
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activar pestaña y contenido actual
    event.currentTarget.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    // Cargar datos automáticamente al cambiar de pestaña
    switch(tabName) {
        case 'contrato':
            cargarContrato();
            break;
        case 'pagos':
            cargarPagosPendientesMes();
            break;
        case 'historial':
            cargarHistorialPagos();
            break;
        case 'solicitudes':
            cargarSolicitudesMantenimiento();
            break;
        case 'servicios':
            cargarServicios();
            break;
    }
}

// ==========================================
// CARGAR CONTRATO
// ==========================================
async function cargarContrato() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) return;

    try {
        const response = await fetch(`https://proyecto-ycw-production.up.railway.app/api/arrendatarios/${usuario.idUsuario}/contratos`);
        const contratos = await response.json();
        
        const tbody = document.getElementById('tablaContrato');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (contratos.length > 0) {
            contratos.forEach(contrato => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${contrato.direccion || 'No especificada'}</td>
                    <td>${new Date(contrato.fechaInicio).toLocaleDateString()}</td>
                    <td>${new Date(contrato.fechaFin).toLocaleDateString()}</td>
                    <td>$${Number(contrato.valorArriendo || 0).toLocaleString()}</td>
                    <td>${contrato.area || 'N/A'} m²</td>
                    <td><span class="estado-activo">ACTIVO</span></td>
                    <td>
                        <button class="btn btn-primary btn-ver-detalles" data-contrato-id="${contrato.idContrato}">Ver Detalles</button>
                    </td>
                `;

                const boton = fila.querySelector('.btn-ver-detalles');
                boton.addEventListener('click', function() {
                    const idContrato = this.getAttribute('data-contrato-id');
                    verDetallesContrato(parseInt(idContrato));
                });

                tbody.appendChild(fila);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No tienes contratos activos</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando contrato:', error);
        const tbody = document.getElementById('tablaContrato');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error cargando contratos</td></tr>';
        }
    }
}

function verDetallesContrato(idContrato) {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) return;
    
    const tbody = document.getElementById('tablaContrato');
    const filas = tbody.getElementsByTagName('tr');
    
    let contratoEncontrado = null;
    
    for (let fila of filas) {
        const celdas = fila.getElementsByTagName('td');
        if (celdas.length > 0) {
            const direccion = celdas[0].textContent;
            const fechaInicio = celdas[1].textContent;
            const fechaFin = celdas[2].textContent;
            const valorArriendo = celdas[3].textContent;
            const area = celdas[4].textContent;
            
            contratoEncontrado = {
                direccion: direccion,
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                valorArriendo: valorArriendo.replace(/\$/g, '').replace(/\./g, '').replace(/,/g, ''),
                area: area.replace(' m²', ''),
                condiciones: 'Pago mensual anticipado'
            };
            break;
        }
    }
    
    if (contratoEncontrado) {
        const mensaje = `
📄 DETALLES COMPLETOS DEL CONTRATO #${idContrato}

🏠 Dirección: ${contratoEncontrado.direccion}
📅 Fecha Inicio: ${contratoEncontrado.fechaInicio}
📅 Fecha Fin: ${contratoEncontrado.fechaFin}
📋 Condiciones: ${contratoEncontrado.condiciones}
💰 Valor Arriendo: $${Number(contratoEncontrado.valorArriendo || 0).toLocaleString()}
📏 Área: ${contratoEncontrado.area} m²

Estado: ✅ ACTIVO
        `;
        alert(mensaje);
    } else {
        alert('No se pudieron cargar los detalles del contrato.');
    }
}

// ==========================================
// TAB PAGOS - CARGAR PAGOS PENDIENTES DEL MES
// ==========================================
async function cargarPagosPendientesMes() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) return;
    
    try {
        console.log('📋 Cargando pagos pendientes del mes...');
        
        const response = await fetch(`https://proyecto-ycw-production.up.railway.app/api/arrendatarios/${usuario.idUsuario}/pagos-pendientes-mes`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Pagos pendientes recibidos:', data);
        
        mostrarPagosPendientes(data);
        
    } catch (error) {
        console.error('❌ Error cargando pagos pendientes:', error);
        const container = document.getElementById('pagos');
        if (container) {
            container.innerHTML = `
                <h3>💳 Realizar Pagos</h3>
                <div class="card" style="background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626;">
                    <p style="color: #991b1b; margin: 0;">❌ Error al cargar pagos pendientes: ${error.message}</p>
                </div>
            `;
        }
    }
}

// ==========================================
// MOSTRAR PAGOS PENDIENTES EN LA INTERFAZ
// ==========================================
function mostrarPagosPendientes(data) {
    const container = document.getElementById('pagos');
    
    if (!container) {
        console.error('❌ No se encontró el contenedor de pagos');
        return;
    }
    
    const { pagosPendientes, mesActual, diaLimite } = data;
    
    let html = `
        <h3>💳 Realizar Pagos del Mes</h3>
        
        <div class="card" style="background: #f0f9ff; border-left: 4px solid #0ea5e9; margin-bottom: 20px;">
            <h4>📅 ${mesActual}</h4>
            <p><strong>Día límite de pago:</strong> ${diaLimite} de cada mes</p>
            ${pagosPendientes.length > 0 
                ? `<p style="color: #dc2626;"><strong>⚠️ Tienes ${pagosPendientes.length} pago(s) pendiente(s)</strong></p>`
                : `<p style="color: #16a34a;"><strong>✅ ¡Estás al día! No tienes pagos pendientes este mes</strong></p>`
            }
        </div>
    `;
    
    if (pagosPendientes.length === 0) {
        html += `
            <div class="card" style="text-align: center; padding: 40px; background: #d1f4dd;">
                <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
                <h3 style="color: #16a34a;">¡Excelente!</h3>
                <p style="color: #15803d; font-size: 1.1em;">Has completado todos tus pagos de este mes</p>
            </div>
        `;
    } else {
        // Mostrar cada pago pendiente
        pagosPendientes.forEach((pago, index) => {
            const esVencido = new Date(pago.vencimiento) < new Date();
            const diasRestantes = Math.ceil((new Date(pago.vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
            
            const emoji = pago.tipo === 'Arriendo' ? '🏠' : '⚡';
            const colorBorde = esVencido ? '#dc2626' : '#f59e0b';
            
            html += `
                <div class="card" style="border-left: 4px solid ${colorBorde}; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 10px 0;">${emoji} ${pago.tipo}</h4>
                            <p style="margin: 5px 0;"><strong>Local:</strong> ${pago.local}</p>
                            <p style="margin: 5px 0;">${pago.descripcion}</p>
                            <p style="margin: 5px 0; color: ${esVencido ? '#dc2626' : '#666'};">
                                <strong>Vencimiento:</strong> ${new Date(pago.vencimiento).toLocaleDateString()}
                                ${esVencido 
                                    ? ' <span style="background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 5px; font-size: 0.85em;">⚠️ VENCIDO</span>'
                                    : diasRestantes <= 2 
                                        ? ` <span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 5px; font-size: 0.85em;">⏰ ${diasRestantes} día(s)</span>`
                                        : ''
                                }
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 1.5em; font-weight: bold; color: #dc2626; margin: 0;">
                                $${pago.monto.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        class="btn btn-success" 
                        onclick="abrirModalPago(${index})"
                        style="width: 100%; padding: 12px; font-size: 1.1em;">
                        💳 Pagar Ahora
                    </button>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
    
    // Guardar pagos pendientes en memoria para usar en el modal
    window.pagosPendientes = pagosPendientes;
}

// ==========================================
// ABRIR MODAL PARA REALIZAR UN PAGO ESPECÍFICO
// ==========================================
function abrirModalPago(index) {
    const pago = window.pagosPendientes[index];
    
    if (!pago) {
        alert('❌ Error: No se encontró información del pago');
        return;
    }
    
    console.log('💳 Abriendo modal para pago:', pago);
    
    // Crear modal dinámico
    const modalHTML = `
        <div class="modal active" id="modalPagoEspecifico" style="display: flex;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>💳 Realizar Pago</h2>
                    <span class="close" onclick="cerrarModalPago()">&times;</span>
                </div>
                
                <form id="formPagoEspecifico" onsubmit="procesarPagoEspecifico(event, ${index})">
                    <div class="form-group">
                        <label>Tipo de Pago:</label>
                        <input type="text" value="${pago.tipo}" readonly style="background: #f1f5f9;">
                    </div>
                    
                    <div class="form-group">
                        <label>Local:</label>
                        <input type="text" value="${pago.local}" readonly style="background: #f1f5f9;">
                    </div>
                    
                    <div class="form-group">
                        <label>Descripción:</label>
                        <input type="text" value="${pago.descripcion}" readonly style="background: #f1f5f9;">
                    </div>
                    
                    <div class="form-group">
                        <label>Monto:</label>
                        <input type="text" value="$${pago.monto.toLocaleString()}" readonly style="background: #f1f5f9; font-size: 1.2em; font-weight: bold; color: #dc2626;">
                    </div>
                    
                    <div class="form-group">
                        <label>💳 Método de Pago:</label>
                        <select id="metodoPagoModal" required>
                            <option value="">Seleccione método...</option>
                            <option value="tarjeta">💳 Tarjeta Crédito/Débito</option>
                            <option value="pse">🏦 PSE</option>
                            <option value="transferencia">📤 Transferencia Bancaria</option>
                            <option value="efectivo">💰 Efectivo</option>
                        </select>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" id="terminosPagoModal" required>
                            <span>Acepto los términos y condiciones del servicio</span>
                        </label>
                    </div>
                    
                    <button type="submit" class="btn btn-success" style="width: 100%; padding: 15px; font-size: 1.1em;">
                        💳 Confirmar Pago
                    </button>
                </form>
            </div>
        </div>
    `;
    
    // Remover modal existente si hay
    const existente = document.getElementById('modalPagoEspecifico');
    if (existente) existente.remove();
    
    // Agregar modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ==========================================
// CERRAR MODAL
// ==========================================
function cerrarModalPago() {
    const modal = document.getElementById('modalPagoEspecifico');
    if (modal) modal.remove();
}

// ==========================================
// PROCESAR PAGO ESPECÍFICO
// ==========================================
async function procesarPagoEspecifico(event, index) {
    event.preventDefault();
    
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const pago = window.pagosPendientes[index];
    const metodoPago = document.getElementById('metodoPagoModal').value;
    
    if (!metodoPago) {
        alert('❌ Por favor seleccione un método de pago');
        return;
    }
    
    console.log('💰 Procesando pago:', pago);
    
    // Mostrar loader
    const btnSubmit = event.target.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '⏳ Procesando...';
    btnSubmit.disabled = true;
    
    try {
        const pagoData = {
            fechaPago: new Date().toISOString().split('T')[0],
            monto: pago.monto,
            tipoPago: pago.tipo,
            metodoPago: metodoPago,
            idArrendatario: parseInt(usuario.idUsuario),
            idAdministrador: 11,
            idLocal: parseInt(pago.idLocal),
            idContrato: pago.idContrato,
            servicios: pago.servicios || []
        };
        
        console.log('📤 Enviando datos:', pagoData);
        
        const response = await fetch('https://proyecto-ycw-production.up.railway.app/api/pagos/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pagoData)
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ ¡Pago realizado exitosamente!');
            cerrarModalPago();
            
            // Recargar pagos pendientes
            await cargarPagosPendientesMes();
            
            // Recargar historial después de un momento
            setTimeout(() => cargarHistorialPagos(), 1000);
        } else {
            throw new Error(result.error || 'Error al procesar el pago');
        }
        
    } catch (error) {
        console.error('❌ Error procesando pago:', error);
        alert('❌ Error al procesar el pago: ' + error.message);
        
        // Restaurar botón
        btnSubmit.innerHTML = textoOriginal;
        btnSubmit.disabled = false;
    }
}

// ==========================================
// HISTORIAL DE PAGOS
// ==========================================
async function cargarHistorialPagos() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (!usuario) {
        console.error('❌ No hay usuario logueado');
        return;
    }
    
    try {
        const tbody = document.getElementById('tablaHistorialPagos');
        
        if (!tbody) {
            console.error('❌ No se encontró tablaHistorialPagos en el DOM');
            return;
        }
        
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">⏳ Cargando historial...</td></tr>';
        
        const pagos = await cargarPagosDesdeBD(usuario.idUsuario);
        
        console.log('📊 Pagos cargados desde BD:', pagos.length);
        
        tbody.innerHTML = '';
        
        if (pagos && pagos.length > 0) {
            pagos.forEach(pago => {
                const fecha = pago.fechaPago ? 
                    new Date(pago.fechaPago).toLocaleDateString() : 
                    'No especificada';
                
                const monto = pago.monto ? Number(pago.monto).toLocaleString() : '0';
                const tipoPagoBadge = obtenerBadgeTipoPagoArrendatario(pago.tipoPago, pago.descripcion);
                const direccion = pago.direccion || 'Local contratado';
                
                tbody.innerHTML += `
                    <tr>
                        <td>${fecha}</td>
                        <td>$${monto}</td>
                        <td>${tipoPagoBadge}</td>
                        <td>${direccion}</td>
                        <td>
                            <span class="estado-al-dia">PAGADO</span>
                        </td>
                    </tr>
                `;
            });
            
            console.log(`✅ ${pagos.length} pagos cargados en la tabla`);
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 3em; margin-bottom: 10px;">🔭</div>
                        <p>No hay pagos registrados</p>
                        <small>Los pagos que realices aparecerán aquí</small>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('❌ Error cargando historial de pagos:', error);
        const tbody = document.getElementById('tablaHistorialPagos');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: red; padding: 20px;">
                        ❌ Error al cargar el historial: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

async function cargarPagosDesdeBD(idArrendatario) {
    try {
        console.log('🔍 [FRONTEND] Cargando pagos para arrendatario:', idArrendatario);
        
        const response = await fetch(`https://proyecto-ycw-production.up.railway.app/api/debug/arrendatarios/${idArrendatario}/pagos`);
        
        if (response.ok) {
            const pagosDebug = await response.json();
            console.log('✅ [FRONTEND] Pagos recibidos del endpoint debug:', pagosDebug.length, 'pagos');
            
            const pagosFormateados = pagosDebug.map(pago => ({
                idPago: pago.idPagoVariado,
                fechaPago: pago.fechaPago,
                monto: pago.monto,
                tipoPago: pago.tipo || 'Servicios',
                descripcion: pago.descripcion || `Pago - ${pago.direccion}`,
                direccion: pago.direccion,
                comprobante: `PAGO-${pago.idPagoVariado}`,
                servicios: []
            }));
            
            return pagosFormateados;
        }
        
        throw new Error(`Error HTTP: ${response.status}`);
        
    } catch (error) {
        console.error('❌ [FRONTEND] Error cargando pagos desde BD:', error);
        return [];
    }
}

function obtenerBadgeTipoPagoArrendatario(tipoPago, descripcion = '') {
    let tipoFinal = tipoPago;
    
    if (!tipoFinal || tipoFinal === '' || tipoFinal === 'null' || tipoFinal === 'undefined') {
        if (descripcion && descripcion.includes('servicio')) {
            tipoFinal = 'Servicios';
        } else if (descripcion && descripcion.includes('arriendo')) {
            tipoFinal = 'Arriendo';
        } else {
            tipoFinal = 'Servicios';
        }
    }
    
    if (tipoFinal === 'Servicio') {
        tipoFinal = 'Servicios';
    }
    
    const tipo = tipoFinal.toString().toLowerCase().trim();
    
    const badges = {
        'arriendo': '<span style="background: #e3f2fd; color: #1565c0; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🏠 Arriendo</span>',
        'servicios': '<span style="background: #e8f5e8; color: #2e7d32; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">⚡ Servicios</span>',
        'arriendo + servicios': '<span style="background: #fff3e0; color: #ef6c00; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🏠⚡ Ambos</span>',
        'ambos': '<span style="background: #fff3e0; color: #ef6c00; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🏠⚡ Ambos</span>',
        'mantenimiento': '<span style="background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">🔧 Mantenimiento</span>'
    };
    
    if (tipo.includes('arriendo') && tipo.includes('servicio')) {
        return badges['arriendo + servicios'];
    } else if (tipo.includes('arriendo')) {
        return badges['arriendo'];
    } else if (tipo.includes('servicio')) {
        return badges['servicios'];
    }
    
    return badges[tipo] || `<span style="background: #f1f5f9; color: #64748b; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${tipoFinal || 'Otro'}</span>`;
}

// ==========================================
// TAB SERVICIOS
// ==========================================
async function cargarServicios() {
    console.log('🚀 INICIANDO carga robusta de servicios...');

    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        console.error('❌ No hay usuario en localStorage');
        document.getElementById('serviciosInfo').innerHTML = '<p style="color:#666">Usuario no identificado.</p>';
        return;
    }

    try {
        document.getElementById('serviciosInfo').innerHTML = `
            <div style="text-align:center;padding:40px;color:#666;">
                <div class="spinner"></div>
                <p>Cargando información de servicios...</p>
            </div>
        `;

        const rContratos = await fetch(`https://proyecto-ycw-production.up.railway.app/api/arrendatarios/${usuario.idUsuario}/contratos`);
        if (!rContratos.ok) throw new Error(`Error al obtener contratos: ${rContratos.status}`);
        const contratos = await rContratos.json();

        if (!Array.isArray(contratos) || contratos.length === 0) {
            document.getElementById('serviciosInfo').innerHTML = `
                <div style="text-align:center;padding:40px;color:#666;">
                    <h3>🏠 No tienes contratos activos</h3>
                    <p>No se encontraron contratos para mostrar servicios.</p>
                </div>
            `;
            return;
        }

        const rServ = await fetch(`https://proyecto-ycw-production.up.railway.app/api/servicios-por-local`);
        if (!rServ.ok) throw new Error(`Error al obtener servicios por local: ${rServ.status}`);
        const localesConServicios = await rServ.json();

        const mapaLocales = new Map();
        localesConServicios.forEach(l => {
            const id = l.idLocal ?? l.id_local ?? l.id ?? l.local_id;
            mapaLocales.set(String(id), {
                idLocal: id,
                direccion: l.direccion ?? l.local_nombre ?? l.direccion_local ?? '',
                servicios: (l.servicios === null || l.servicios === undefined) ? 'Sin servicios' : String(l.servicios).trim(),
                valorTotalServicios: l.valorTotalServicios ?? l.valor_total_servicios ?? 0
            });
        });

        let serviciosHTML = '';
        let contratosConServicios = 0;

        contratos.forEach((contrato, idx) => {
            const idLocalContrato = contrato.idLocal ?? contrato.localId ?? contrato.id_local ?? contrato.local_id ?? contrato.local;
            const idKey = idLocalContrato !== undefined && idLocalContrato !== null ? String(idLocalContrato) : null;

            if (!idKey) {
                serviciosHTML += `
                    <div style="background:#fee2e2;padding:20px;border-radius:10px;margin-bottom:20px;">
                        <h3 style="color:#991b1b;">🏢 Contrato ${idx+1}</h3>
                        <p>❌ No se identificó el id del local en este contrato</p>
                    </div>
                `;
                return;
            }

            const local = mapaLocales.get(idKey);

            if (!local) {
                serviciosHTML += `
                    <div style="background:#fee2e2;padding:20px;border-radius:10px;margin-bottom:20px;">
                        <h3 style="color:#991b1b;">🏢 Local ${idx+1}: ${contrato.direccion || 'Local ' + idKey}</h3>
                        <p>❌ No se encontró información de servicios para este local (ID: ${idKey})</p>
                    </div>
                `;
                return;
            }

            contratosConServicios++;
            serviciosHTML += `
                <div style="background:#f0f9ff;padding:20px;border-radius:10px;margin-bottom:20px;border-left:5px solid #0ea5e9;">
                    <h3 style="margin:0 0 10px 0;">🏢 ${local.direccion || contrato.direccion || 'Local ' + idKey}</h3>
            `;

            if (!local.servicios || local.servicios.toLowerCase() === 'sin servicios') {
                serviciosHTML += `
                    <p style="background:#fef3c7;padding:12px;border-radius:8px;color:#92400e;">
                        ⚠️ No hay servicios asignados a este local
                    </p>
                `;
            } else {
                const serviciosArray = local.servicios.split(/\s*[,;|]\s*/).filter(s => s && s.trim().length);
                serviciosHTML += `<p><strong>Servicios incluidos:</strong></p><ul style="list-style:none;padding:0;margin:0 0 15px 0;">`;
                serviciosArray.forEach(s => {
                    const servicioLimpio = s.trim();
                    const emoji = servicioLimpio.includes('Agua') ? '💧' : servicioLimpio.includes('Luz') ? '💡' : servicioLimpio.includes('Internet') ? '🌐' : '🔧';
                    serviciosHTML += `<li style="padding:10px;background:white;margin-bottom:8px;border-radius:8px;display:flex;align-items:center;gap:10px;">
                        <span style="font-size:1.4em;">${emoji}</span>
                        <span style="font-weight:500;">${servicioLimpio}</span>
                    </li>`;
                });
                serviciosHTML += `</ul>
                    <p style="background:white;padding:12px;border-radius:8px;margin:0;">
                        <strong>💰 Valor total servicios:</strong>
                        <span style="color:#0ea5e9;font-weight:bold;">${Number(local.valorTotalServicios || 0).toLocaleString()}</span>
                    </p>`;
            }

            serviciosHTML += `</div>`;
        });

        if (contratosConServicios === 0 && contratos.length > 0) {
            serviciosHTML = `
                <div style="text-align:center;padding:40px;color:#666;">
                    <h3>🔍 No se encontraron servicios</h3>
                    <p>Tienes ${contratos.length} contrato(s) activo(s) pero no se encontraron servicios asociados.</p>
                </div>
            `;
        }

        document.getElementById('serviciosInfo').innerHTML = serviciosHTML;
        console.log('✅ Servicios renderizados para', contratosConServicios, 'locales de', contratos.length);

    } catch (err) {
        console.error('❌ Error cargando servicios (robusto):', err);
        document.getElementById('serviciosInfo').innerHTML = `
            <div style="background:#fee2e2;padding:20px;border-radius:10px;">
                <h3 style="color:#991b1b;">❌ Error al cargar los servicios</h3>
                <p style="color:#7f1d1d;">${err.message}</p>
                <button onclick="cargarServicios()" style="padding:8px 16px;background:#dc2626;color:white;border:none;border-radius:5px;cursor:pointer;">🔄 Reintentar</button>
            </div>
        `;
    }
}

// ==========================================
// TAB SOLICITUDES - MANTENIMIENTO
// ==========================================
async function cargarSolicitudesMantenimiento() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) return;

    try {
        const response = await fetch(`https://proyecto-ycw-production.up.railway.app/api/arrendatarios/${usuario.idUsuario}/solicitudes-mantenimiento`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const solicitudes = await response.json();
        
        const tbody = document.getElementById('tablaSolicitudesMantenimiento');
        if (!tbody) {
            console.error('❌ No se encontró la tabla de solicitudes');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (solicitudes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">No hay solicitudes de mantenimiento registradas</td></tr>';
            return;
        }
        
        solicitudes.forEach(solicitud => {
            const prioridadBadge = obtenerBadgePrioridad(solicitud.prioridad);
            const estadoBadge = obtenerBadgeEstado(solicitud.estado);
            const fecha = solicitud.fecha_creacion ? new Date(solicitud.fecha_creacion).toLocaleDateString() : 'No especificada';
            
            tbody.innerHTML += `
                <tr>
                    <td>${solicitud.tipo_servicio}</td>
                    <td>${solicitud.descripcion || 'Sin descripción'}</td>
                    <td>${prioridadBadge}</td>
                    <td>${estadoBadge}</td>
                    <td>${fecha}</td>
                </tr>
            `;
        });
        
        console.log(`✅ ${solicitudes.length} solicitudes cargadas`);
        
    } catch (error) {
        console.error('❌ Error cargando solicitudes:', error);
        const tbody = document.getElementById('tablaSolicitudesMantenimiento');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 40px;">Error al cargar las solicitudes</td></tr>';
        }
    }
}

function obtenerBadgePrioridad(prioridad) {
    const badges = {
        'urgente': '<span style="background: #fee; color: #c00; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">🔴 URGENTE</span>',
        'normal': '<span style="background: #fff4e6; color: #e67e22; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">🟡 NORMAL</span>',
        'baja': '<span style="background: #f0f0f0; color: #666; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">🟢 BAJA</span>'
    };
    return badges[prioridad] || prioridad;
}

function obtenerBadgeEstado(estado) {
    const badges = {
        'pendiente': '<span style="background: #fff3cd; color: #856404; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">⏳ PENDIENTE</span>',
        'en_proceso': '<span style="background: #cfe2ff; color: #084298; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">⚙️ EN PROCESO</span>',
        'completado': '<span style="background: #d1e7dd; color: #0f5132; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">✅ COMPLETADO</span>',
        'cancelado': '<span style="background: #f8d7da; color: #842029; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">❌ CANCELADO</span>'
    };
    return badges[estado] || estado;
}

// ==========================================
// MODAL Y FORMULARIO DE NUEVA SOLICITUD
// ==========================================
function mostrarModalSolicitudMantenimiento() {
    console.log('🔧 Abriendo modal para nueva solicitud...');
    
    cargarLocalesParaSolicitud();
    
    const form = document.getElementById('formNuevaSolicitud');
    if (form) {
        form.reset();
    }
    
    const modal = document.getElementById('modalNuevaSolicitud');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error('❌ Modal modalNuevaSolicitud no encontrado en el DOM');
    }
}

async function cargarLocalesParaSolicitud() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) return;

    try {
        const response = await fetch(`https://proyecto-ycw-production.up.railway.app/api/arrendatarios/${usuario.idUsuario}/contratos`);
        const contratos = await response.json();
        
        const selectLocal = document.getElementById('selectLocalSolicitud');
        if (!selectLocal) return;
        
        selectLocal.innerHTML = '<option value="">Seleccionar local...</option>';
        
        if (contratos.length > 0) {
            contratos.forEach(contrato => {
                selectLocal.innerHTML += `<option value="${contrato.idLocal}">${contrato.direccion}</option>`;
            });
        } else {
            selectLocal.innerHTML = '<option value="">No tienes locales asignados</option>';
        }
        
        console.log('✅ Locales cargados para solicitud:', contratos.length);
    } catch (error) {
        console.error('❌ Error cargando locales para solicitud:', error);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==========================================
// INICIALIZACIÓN DEL FORMULARIO DE SOLICITUDES
// ==========================================
function inicializarFormularioSolicitudes() {
    const formSolicitud = document.getElementById('formNuevaSolicitud');
    if (formSolicitud) {
        formSolicitud.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            const idLocal = document.getElementById('selectLocalSolicitud').value;
            const tipoProblema = document.getElementById('tipoProblema').value;
            const descripcion = document.getElementById('descripcionProblema').value;
            const prioridad = document.getElementById('prioridadSolicitud').value;
            
            if (!idLocal || idLocal === '') {
                alert('⚠️ Por favor seleccione un local.');
                return;
            }
            
            if (!tipoProblema || tipoProblema === '') {
                alert('⚠️ Por favor seleccione el tipo de problema.');
                return;
            }
            
            if (!descripcion || descripcion.trim() === '') {
                alert('⚠️ Por favor ingrese una descripción del problema.');
                return;
            }
            
            if (!prioridad || prioridad === '') {
                alert('⚠️ Por favor seleccione la prioridad.');
                return;
            }
            
            try {
                const response = await fetch('https://proyecto-ycw-production.up.railway.app/api/mantenimiento/solicitud', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idLocal: parseInt(idLocal),
                        idArrendatario: parseInt(usuario.idUsuario),
                        tipoMantenimiento: tipoProblema,
                        descripcion: descripcion.trim(),
                        prioridad: prioridad
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    alert('✅ Solicitud enviada correctamente');
                    closeModal('modalNuevaSolicitud');
                    document.getElementById('formNuevaSolicitud').reset();
                    await cargarSolicitudesMantenimiento();
                } else {
                    alert('❌ Error: ' + (data.message || 'No se pudo crear la solicitud'));
                }
                
            } catch (error) {
                console.error('❌ Error enviando solicitud:', error);
                alert('❌ Error al enviar la solicitud.');
            }
        });
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Documento listo - Inicializando panel de arrendatario');
    
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || usuario.rol !== 'Arrendatario') {
        window.location.href = 'ycw.html';
        return;
    }

    console.log('Usuario arrendatario:', usuario);
    
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('emailUsuario').textContent = usuario.correo;
    document.getElementById('cedulaUsuario').textContent = `Cédula: ${usuario.documento}`;
    
    cargarContrato();
    
    document.getElementById('btnCerrarSesion').addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = 'ycw.html';
    });

    inicializarFormularioSolicitudes();
    
    console.log('✅ Inicialización completada');
});