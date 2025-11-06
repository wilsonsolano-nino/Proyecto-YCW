// frontend/js/faceRecognition.js

/**
 * 🎭 Sistema de Reconocimiento Facial
 * Utiliza face-api.js para detección y verificación facial
 */

class FaceRecognition {
    constructor() {
        this.modelsLoaded = false;
        this.videoElement = null;
        this.canvasElement = null;
        this.stream = null;
    }

    /**
     * Cargar modelos de face-api.js
     */
    async cargarModelos() {
        if (this.modelsLoaded) return true;

        try {
            console.log('📦 Cargando modelos de reconocimiento facial...');
            
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
            
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);

            this.modelsLoaded = true;
            console.log('✅ Modelos cargados correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error cargando modelos:', error);
            return false;
        }
    }

    /**
     * Iniciar cámara web
     */
    async iniciarCamara(videoElementId, canvasElementId) {
        try {
            this.videoElement = document.getElementById(videoElementId);
            this.canvasElement = document.getElementById(canvasElementId);

            if (!this.videoElement || !this.canvasElement) {
                throw new Error('Elementos de video o canvas no encontrados');
            }

            // Solicitar permiso para acceder a la cámara
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });

            this.videoElement.srcObject = this.stream;
            
            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    console.log('📹 Cámara iniciada');
                    resolve(true);
                };
            });
        } catch (error) {
            console.error('❌ Error iniciando cámara:', error);
            throw error;
        }
    }

    /**
     * Detener cámara
     */
    detenerCamara() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }
            console.log('🛑 Cámara detenida');
        }
    }

    /**
     * Capturar descriptor facial
     */
    async capturarRostro() {
        if (!this.modelsLoaded) {
            await this.cargarModelos();
        }

        if (!this.videoElement || !this.videoElement.readyState === 4) {
            return { 
                success: false, 
                mensaje: '⚠️ El video no está listo. Espera un momento.' 
            };
        }

        try {
            console.log('📸 Intentando detectar rostro...');
            
            const options = new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5
            });
            
            const detections = await faceapi
                .detectSingleFace(this.videoElement, options)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detections) {
                console.log('❌ No se detectó rostro');
                return { 
                    success: false, 
                    mensaje: '❌ No se detectó ningún rostro. Asegúrate de estar frente a la cámara con buena iluminación.' 
                };
            }

            console.log('✅ Rostro detectado correctamente');

            // Dibujar detección en canvas (retroalimentación visual)
            this.dibujarDeteccion(detections);

            return {
                success: true,
                descriptor: Array.from(detections.descriptor),
                mensaje: '✅ Rostro capturado correctamente',
                confidence: detections.detection.score
            };
        } catch (error) {
            console.error('❌ Error capturando rostro:', error);
            return { 
                success: false, 
                mensaje: 'Error al procesar imagen: ' + error.message 
            };
        }
    }

    /**
     * Dibujar detección facial en canvas
     */
    dibujarDeteccion(detections) {
        if (!this.canvasElement || !this.videoElement) return;

        const displaySize = { 
            width: this.videoElement.videoWidth, 
            height: this.videoElement.videoHeight 
        };

        faceapi.matchDimensions(this.canvasElement, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        const ctx = this.canvasElement.getContext('2d');
        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        faceapi.draw.drawDetections(this.canvasElement, resizedDetections);
        faceapi.draw.drawFaceLandmarks(this.canvasElement, resizedDetections);
    }

    /**
     * Comparar dos descriptores faciales
     */
    compararRostros(descriptor1, descriptor2) {
        const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
        const umbral = 0.6; // Umbral de similitud (menor = más estricto)
        
        const esIgual = distance < umbral;
        const porcentajeSimilitud = Math.max(0, (1 - distance) * 100).toFixed(2);

        return {
            esIgual: esIgual,
            distancia: distance,
            similitud: porcentajeSimilitud,
            umbral: umbral
        };
    }

    /**
     * Limpiar recursos
     */
    limpiar() {
        this.detenerCamara();
        if (this.canvasElement) {
            const ctx = this.canvasElement.getContext('2d');
            ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
    }
}

// Exportar instancia global
window.FaceRecognition = new FaceRecognition();