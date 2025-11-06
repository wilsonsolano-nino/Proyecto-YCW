const conexion = require('../../config/database');

class GestionContratos {
    static crearContrato(datosContrato, callback) {
        const query = 'INSERT INTO contratoarrendamiento (fechaInicio, fechaFin, condiciones, idLocal, idArrendatario, idAdministrador) VALUES (?, ?, ?, ?, ?, ?)';
        const valores = [datosContrato.fechaInicio, datosContrato.fechaFin, datosContrato.condiciones, datosContrato.idLocal, datosContrato.idArrendatario, datosContrato.idAdministrador];
        conexion.query(query, valores, callback);
    }

    static modificarContrato(id, datosActualizados, callback) {
    const query = 'UPDATE contratoarrendamiento SET fechaInicio = ?, fechaFin = ?, condiciones = ? WHERE idContrato = ?';
    const valores = [
        datosActualizados.fechaInicio,
        datosActualizados.fechaFin, 
        datosActualizados.condiciones,
        id
    ];
    conexion.query(query, valores, callback);
}

    static consultarContrato(id, callback) {
        const query = 'SELECT c.idContrato as id, c.fechaInicio, c.fechaFin, c.condiciones, c.idLocal, c.idArrendatario, c.idAdministrador, l.direccion, u.nombre as nombreArrendatario FROM contratoarrendamiento c JOIN local l ON c.idLocal = l.idLocal JOIN usuarios u ON c.idArrendatario = u.idUsuario WHERE c.idContrato = ?';
        conexion.query(query, [id], callback);
    }

static consultarContratos(callback) {
    const query = `
        SELECT c.idContrato as id, c.fechaInicio, c.fechaFin, c.condiciones, 
               l.direccion, u.nombre as nombreArrendatario, l.valorArriendo, l.area
        FROM contratoarrendamiento c 
        JOIN local l ON c.idLocal = l.idLocal 
        JOIN usuarios u ON c.idArrendatario = u.idUsuario
        ORDER BY c.idContrato ASC  -- ← Esto asegura el orden 1, 2, 3...
    `;
    conexion.query(query, callback);
}

    static consultarContratosPorArrendatario(idArrendatario, callback) {
        const query = 'SELECT c.idContrato as id, c.fechaInicio, c.fechaFin, c.condiciones, l.direccion, l.valorArriendo, l.area FROM contratoarrendamiento c JOIN local l ON c.idLocal = l.idLocal WHERE c.idArrendatario = ?';
        conexion.query(query, [idArrendatario], callback);
    }

    static eliminarContrato(id, callback) {
    const query = 'DELETE FROM contratoarrendamiento WHERE idContrato = ?';
    conexion.query(query, [id], callback);
}
}

module.exports = GestionContratos;
