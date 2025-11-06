const conexion = require('../../config/database');

class GestionLocales {
    static anadirLocal(datosLocal, callback) {
        const query = 'INSERT INTO local (direccion, area, valorArriendo, idAdministrador) VALUES (?, ?, ?, ?)';
        const valores = [datosLocal.direccion, datosLocal.area, datosLocal.valorArriendo, datosLocal.idAdministrador];
        conexion.query(query, valores, callback);
    }

    static consultarLocales(callback) {
    const query = 'SELECT * FROM local ORDER BY idLocal ASC'; // ← Orden ascendente
    conexion.query(query, callback);
}

    static consultarLocalPorId(id, callback) {
        const query = 'SELECT * FROM local WHERE idLocal = ?';
        conexion.query(query, [id], callback);
    }

    static editarLocal(id, datosActualizados, callback) {
    const query = 'UPDATE local SET direccion = ?, area = ?, valorArriendo = ?, idAdministrador = ? WHERE idLocal = ?';
    const valores = [
        datosActualizados.direccion, 
        datosActualizados.area, 
        datosActualizados.valorArriendo, 
        datosActualizados.idAdministrador, // ← Este campo es requerido
        id
    ];
    conexion.query(query, valores, callback);
}

    static eliminarLocal(id, callback) {
    const queries = [
        'DELETE ps FROM pago_servicio ps JOIN pago p ON ps.idPago = p.idPago WHERE p.idLocal = ?',
        'DELETE FROM pago WHERE idLocal = ?',
        'DELETE FROM contratoarrendamiento WHERE idLocal = ?',
        'DELETE FROM local WHERE idLocal = ?'
    ];
    
    let currentQuery = 0;
    
    function executeNextQuery() {
        if (currentQuery >= queries.length) {
            console.log('Local y todas sus dependencias eliminadas:', id);
            return callback(null, { success: true });
        }
        
        conexion.query(queries[currentQuery], [id], (err) => {
            if (err) {
                console.error(`Error en query ${currentQuery + 1}:`, err);
                return callback(err);
            }
            
            console.log(`Query ${currentQuery + 1} ejecutada para local:`, id);
            currentQuery++;
            executeNextQuery();
        });
    }
    
    executeNextQuery();
}
}

module.exports = GestionLocales;
