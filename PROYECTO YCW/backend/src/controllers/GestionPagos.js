const conexion = require('../../config/database');

class GestionPagos {
    static registrarPago(datosPago, callback) {
        const query = 'INSERT INTO pago (fechaPago, monto, tipoPago, idArrendatario, idAdministrador, idLocal) VALUES (?, ?, ?, ?, ?, ?)';
        const valores = [datosPago.fechaPago, datosPago.monto, datosPago.tipoPago, datosPago.idArrendatario, datosPago.idAdministrador, datosPago.idLocal];
        conexion.query(query, valores, callback);
    }

    // MÉTODO FALTANTE - Consultar todos los pagos
    static consultarPagos(callback) {
        const query = `
            SELECT p.idPago as id, p.fechaPago, p.monto, p.tipoPago, 
                   u.nombre as nombreArrendatario, l.direccion
            FROM pago p 
            JOIN usuarios u ON p.idArrendatario = u.idUsuario 
            JOIN local l ON p.idLocal = l.idLocal 
            ORDER BY p.fechaPago DESC
        `;
        conexion.query(query, callback);
    }

    static generarReportePagos(fechaInicio, fechaFin, callback) {
        const query = 'SELECT p.idPago as id, p.fechaPago, p.monto, p.tipoPago, u.nombre as nombreArrendatario, l.direccion FROM pago p JOIN usuarios u ON p.idArrendatario = u.idUsuario JOIN local l ON p.idLocal = l.idLocal WHERE p.fechaPago BETWEEN ? AND ? ORDER BY p.fechaPago DESC';
        conexion.query(query, [fechaInicio, fechaFin], callback);
    }

    static consultarHistorialPagos(idArrendatario, callback) {
        const query = 'SELECT p.idPago as id, p.fechaPago, p.monto, p.tipoPago, l.direccion FROM pago p JOIN local l ON p.idLocal = l.idLocal WHERE p.idArrendatario = ? ORDER BY p.fechaPago DESC';
        conexion.query(query, [idArrendatario], callback);
    }
}

module.exports = GestionPagos;
