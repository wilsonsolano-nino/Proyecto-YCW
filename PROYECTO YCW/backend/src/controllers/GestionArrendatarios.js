const conexion = require('../../config/database');

class GestionArrendatarios {
    static anadirArrendatario(datosArrendatario, callback) {
        const query = 'INSERT INTO usuarios (nombre, documento, telefono, correo, idRol) VALUES (?, ?, ?, ?, 2)';
        const valores = [datosArrendatario.nombre, datosArrendatario.documento, datosArrendatario.telefono, datosArrendatario.correo];
        conexion.query(query, valores, callback);
    }

    static consultarArrendatarios(callback) {
    const query = 'SELECT * FROM usuarios WHERE idRol = 2 ORDER BY idUsuario ASC'; // ← Orden ascendente
    conexion.query(query, callback);
}

    // MÉTODO FALTANTE - Consultar arrendatario por ID
    static consultarArrendatarioPorId(id, callback) {
        const query = 'SELECT * FROM usuarios WHERE idUsuario = ? AND idRol = 2';
        conexion.query(query, [id], callback);
    }

    static actualizarArrendatario(id, datosActualizados, callback) {
    const query = 'UPDATE usuarios SET nombre = ?, documento = ?, telefono = ?, correo = ? WHERE idUsuario = ?';
    const valores = [
        datosActualizados.nombre,
        datosActualizados.documento, 
        datosActualizados.telefono,
        datosActualizados.correo,
        id
    ];
    conexion.query(query, valores, callback);
}

    static eliminarArrendatario(id, callback) {
    const queries = [
        'DELETE ps FROM pago_servicio ps JOIN pago p ON ps.idPago = p.idPago WHERE p.idArrendatario = ?',
        'DELETE FROM pago WHERE idArrendatario = ?',
        'DELETE FROM contratoarrendamiento WHERE idArrendatario = ?',
        'DELETE FROM usuarios WHERE idUsuario = ?'
    ];
    
    let currentQuery = 0;
    
    function executeNextQuery() {
        if (currentQuery >= queries.length) {
            console.log('Arrendatario y todas sus dependencias eliminadas:', id);
            return callback(null, { success: true });
        }
        
        conexion.query(queries[currentQuery], [id], (err) => {
            if (err) {
                console.error(`Error en query ${currentQuery + 1}:`, err);
                return callback(err);
            }
            
            console.log(`Query ${currentQuery + 1} ejecutada para arrendatario:`, id);
            currentQuery++;
            executeNextQuery();
        });
    }
    
    executeNextQuery();
}
}

module.exports = GestionArrendatarios;
