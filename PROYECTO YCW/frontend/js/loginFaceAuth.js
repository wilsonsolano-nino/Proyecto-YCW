let usuarioPendiente = null; // Almacenar datos del usuario mientras verifica rostro

// ==========================================
// PASO 1: LOGIN CON CORREO Y DOCUMENTO
// ==========================================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('📧 Validando credenciales...');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const alertBox = document.getElementById('alert');
    const btnLogin = document.getElementById('btnLogin');
    const btnText = btnLogin.querySelector('.btn-text');
    const btnLoader = btnLogin.querySelector('.btn-loader');

    // Mostrar loader
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    btnLogin.disabled = true;
    alertBox.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Credenciales correctas, iniciando verificación facial...');
            
            // Guardar usuario temporalmente
            usuarioPendiente = data.usuario;
            
            // Ocultar formulario de login
            document.getElementById('loginForm').style.display = 'none';
            
            // Verificar si tiene registro facial
            await verificarYMostrarFaceAuth(data.usuario.idUsuario);
            
        } else {
            throw new Error(data.error || 'Credenciales incorrectas');
        }
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        alertBox.className = 'alert alert-error';
        alertBox.querySelector('.alert-message').textContent = error.message;
        alertBox.style.display = 'flex';

        // Restaurar botón
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        btnLogin.disabled = false;
    }
});

// ==========================================
// PASO 2: VERIFICAR SI TIENE REGISTRO FACIAL
// ==========================================

async function verificarYMostrarFaceAuth(idUsuario) {
    try {
        const response = await fetch(`http://localhost:3000/api/face-auth/check/${idUsuario}`);
        const data = await response.json();

        if (data.existe) {
            // Ya tiene registro facial → Verificar
            await mostrarModalVerificacionFacial();
        } else {
            // Primera vez → Registrar rostro
            await mostrarModalRegistroFacial();
        }
    } catch (error) {
        console.error('❌ Error verificando registro facial:', error);
        mostrarAlerta('error', 'Error al verificar registro facial. Intenta de nuevo.');
        restaurarFormularioLogin();
    }
}

// ==========================================
// PASO 3A: MODAL DE VERIFICACIÓN FACIAL
// ==========================================

async function mostrarModalVerificacionFacial() {
    const modal = document.getElementById('faceAuthModal');
    modal.style.display = 'flex';

    // Cargar modelos
    const modelosOk = await window.FaceRecognition.cargarModelos();
    if (!modelosOk) {
        mostrarAlerta('error', 'Error cargando modelos de reconocimiento');
        return;
    }

    // Iniciar cámara
    try {
        await window.FaceRecognition.iniciarCamara('faceVideo', 'faceCanvas');
    } catch (error) {
        mostrarAlerta('error', 'No se pudo acceder a la cámara: ' + error.message);
        cerrarModalFaceAuth();
        return;
    }

    // Botón capturar
    document.getElementById('btnCapturarRostro').onclick = async () => {
        await procesarVerificacionFacial();
    };

    // Botón cancelar
    document.getElementById('btnCancelarFace').onclick = () => {
        cerrarModalFaceAuth();
        restaurarFormularioLogin();
    };
}

async function procesarVerificacionFacial() {
    console.log('🔍 Procesando verificación facial...');
    
    // Ocultar controles y mostrar spinner
    document.getElementById('faceAuthContent').style.display = 'none';
    document.getElementById('faceProcessing').style.display = 'block';

    try {
        // Capturar rostro actual
        const captura = await window.FaceRecognition.capturarRostro();
        
        if (!captura.success) {
            throw new Error(captura.mensaje);
        }

        // Obtener descriptor guardado
        const response = await fetch('http://localhost:3000/api/face-auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idUsuario: usuarioPendiente.idUsuario,
                descriptor: captura.descriptor
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.mensaje || 'Error en la verificación');
        }

        // Comparar descriptores
        const comparacion = window.FaceRecognition.compararRostros(
            captura.descriptor,
            data.descriptorGuardado
        );

        console.log('📊 Similitud:', comparacion.similitud + '%');

        if (comparacion.esIgual) {
            // ✅ VERIFICACIÓN EXITOSA
            console.log('✅ Rostro verificado correctamente');
            
            mostrarAlerta('success', `¡Bienvenido! Similitud: ${comparacion.similitud}%`);
            
            // Guardar usuario en localStorage
            localStorage.setItem('usuario', JSON.stringify(usuarioPendiente));
            
            // Esperar 1.5s y redirigir
            setTimeout(() => {
                if (usuarioPendiente.rol === 'Administrador') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'arrendatario.html';
                }
            }, 1500);
        } else {
            // ❌ ROSTRO NO COINCIDE
            throw new Error(`Rostro no coincide. Similitud: ${comparacion.similitud}% (mínimo 40%)`);
        }

    } catch (error) {
        console.error('❌ Error en verificación:', error);
        
        mostrarAlerta('error', error.message);
        
        // Restaurar modal
        document.getElementById('faceAuthContent').style.display = 'block';
        document.getElementById('faceProcessing').style.display = 'none';
    }
}

// ==========================================
// PASO 3B: MODAL DE REGISTRO FACIAL
// ==========================================

async function mostrarModalRegistroFacial() {
    const modal = document.getElementById('faceRegisterModal');
    modal.style.display = 'flex';

    // Cargar modelos
    const modelosOk = await window.FaceRecognition.cargarModelos();
    if (!modelosOk) {
        mostrarAlerta('error', 'Error cargando modelos de reconocimiento');
        return;
    }

    // Iniciar cámara
    try {
        await window.FaceRecognition.iniciarCamara('faceRegisterVideo', 'faceRegisterCanvas');
    } catch (error) {
        mostrarAlerta('error', 'No se pudo acceder a la cámara: ' + error.message);
        cerrarModalRegistro();
        return;
    }

    // Botón registrar
    document.getElementById('btnRegistrarRostro').onclick = async () => {
        await procesarRegistroFacial();
    };

    // Botón cancelar (permitir acceso sin registro)
    document.getElementById('btnCancelarRegistro').onclick = () => {
        console.log('⚠️ Usuario optó por no registrar rostro');
        cerrarModalRegistro();
        completarLogin();
    };
}

async function procesarRegistroFacial() {
    console.log('📸 Registrando rostro...');
    
    mostrarAlerta('info', 'Capturando tu rostro...');

    const maxIntentos = 5;
    let intento = 0;
    
    // Esperar un momento para que el video esté listo
    await new Promise(resolve => setTimeout(resolve, 1000));

    while (intento < maxIntentos) {
        intento++;
        console.log(`🔄 Intento ${intento}/${maxIntentos}`);
        
        try {
            const captura = await window.FaceRecognition.capturarRostro();
            
            if (captura.success) {
                // ✅ ROSTRO DETECTADO
                mostrarAlerta('success', '¡Rostro detectado! Guardando...');
                
                // Enviar descriptor al backend
                const response = await fetch('http://localhost:3000/api/face-auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idUsuario: usuarioPendiente.idUsuario,
                        descriptor: captura.descriptor
                    })
                });

                const data = await response.json();

                if (data.success) {
                    console.log('✅ Rostro registrado correctamente');
                    mostrarAlerta('success', '¡Rostro registrado exitosamente!');
                    
                    cerrarModalRegistro();
                    
                    // Completar login
                    setTimeout(() => {
                        completarLogin();
                    }, 1500);
                    return; // Salir del bucle
                } else {
                    throw new Error(data.error || 'Error al registrar rostro');
                }
            }
            
            // No se detectó rostro, esperar antes de reintentar
            if (intento < maxIntentos) {
                mostrarAlerta('warning', `No se detectó rostro. Reintentando... (${intento}/${maxIntentos})`);
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
        } catch (error) {
            console.error(`❌ Error en intento ${intento}:`, error);
            
            if (intento >= maxIntentos) {
                mostrarAlerta('error', 'No se pudo detectar tu rostro después de varios intentos. Asegúrate de estar bien iluminado y de frente a la cámara.');
                break;
            }
        }
    }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function completarLogin() {
    // Guardar usuario en localStorage
    localStorage.setItem('usuario', JSON.stringify(usuarioPendiente));
    
    // Redirigir según rol
    if (usuarioPendiente.rol === 'Administrador') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'arrendatario.html';
    }
}

function cerrarModalFaceAuth() {
    document.getElementById('faceAuthModal').style.display = 'none';
    window.FaceRecognition.limpiar();
}

function cerrarModalRegistro() {
    document.getElementById('faceRegisterModal').style.display = 'none';
    window.FaceRecognition.limpiar();
}

function restaurarFormularioLogin() {
    document.getElementById('loginForm').style.display = 'block';
    const btnLogin = document.getElementById('btnLogin');
    btnLogin.querySelector('.btn-text').style.display = 'block';
    btnLogin.querySelector('.btn-loader').style.display = 'none';
    btnLogin.disabled = false;
    usuarioPendiente = null;
}

function mostrarAlerta(tipo, mensaje) {
    const alertBox = document.getElementById('alert');
    const alertMessage = alertBox.querySelector('.alert-message');
    
    alertBox.className = `alert alert-${tipo}`;
    alertMessage.textContent = mensaje;
    alertBox.style.display = 'flex';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

// Estilos para los modales
const style = document.createElement('style');
style.textContent = `
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
    }
    
    .modal.show {
        display: flex;
    }
    
    .spinner {
        border: 4px solid #f3f4f6;
        border-top: 4px solid #0f766e;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);