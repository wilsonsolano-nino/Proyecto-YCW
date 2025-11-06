const fs = require('fs');
const path = require('path');

class FaceAuth {
    constructor() {
        // Crear carpeta para guardar descriptores faciales si no existe
        this.facesDir = path.join(__dirname, '../../uploads/faces');
        if (!fs.existsSync(this.facesDir)) {
            fs.mkdirSync(this.facesDir, { recursive: true });
        }
    }

    /**
     * Guardar descriptor facial del usuario
     */
    guardarDescriptorFacial(idUsuario, descriptor, callback) {
        try {
            const filePath = path.join(this.facesDir, `${idUsuario}.json`);
            
            const data = {
                idUsuario: idUsuario,
                descriptor: descriptor,
                fechaRegistro: new Date().toISOString()
            };

            fs.writeFileSync(filePath, JSON.stringify(data));
            
            console.log(`✅ Descriptor facial guardado para usuario ${idUsuario}`);
            callback(null, { success: true, mensaje: 'Rostro registrado exitosamente' });
        } catch (error) {
            console.error('❌ Error guardando descriptor:', error);
            callback(error);
        }
    }

    /**
     * Obtener descriptor facial del usuario
     */
    obtenerDescriptorFacial(idUsuario, callback) {
        try {
            const filePath = path.join(this.facesDir, `${idUsuario}.json`);
            
            if (!fs.existsSync(filePath)) {
                return callback(null, { 
                    existe: false, 
                    mensaje: 'No hay registro facial para este usuario' 
                });
            }

            const data = fs.readFileSync(filePath, 'utf8');
            const faceData = JSON.parse(data);
            
            callback(null, { 
                existe: true, 
                descriptor: faceData.descriptor,
                fechaRegistro: faceData.fechaRegistro
            });
        } catch (error) {
            console.error('❌ Error obteniendo descriptor:', error);
            callback(error);
        }
    }

    /**
     * Verificar si el usuario tiene registro facial
     */
    tieneRegistroFacial(idUsuario, callback) {
        const filePath = path.join(this.facesDir, `${idUsuario}.json`);
        const existe = fs.existsSync(filePath);
        callback(null, existe);
    }

    /**
     * Eliminar registro facial (útil para re-registro)
     */
    eliminarDescriptorFacial(idUsuario, callback) {
        try {
            const filePath = path.join(this.facesDir, `${idUsuario}.json`);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Descriptor facial eliminado para usuario ${idUsuario}`);
            }
            
            callback(null, { success: true });
        } catch (error) {
            console.error('❌ Error eliminando descriptor:', error);
            callback(error);
        }
    }
}

module.exports = new FaceAuth();