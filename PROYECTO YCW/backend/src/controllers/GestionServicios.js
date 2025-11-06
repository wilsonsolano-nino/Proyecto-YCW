const conexion = require('../../config/database');

class GestionServicios {
    
  static agregarServicioALocal(datos, callback) {
    const query = 'INSERT INTO local_servicio (idLocal, idServicio, incluido) VALUES (?, ?, "Si")';
    const valores = [datos.idLocal, datos.idServicio];
    console.log('🔍 Ejecutando query:', query, 'con valores:', valores);
    conexion.query(query, valores, callback);
}

    static consultarServicios(callback) {
        const query = 'SELECT idServicio as id, nombreServicio, valorServicio FROM servicio';
        conexion.query(query, callback);
    }

    static vincularServicioAPago(idPago, idServicio, callback) {
        const query = 'INSERT INTO pago_servicio (idPago, idServicio) VALUES (?, ?)';
        conexion.query(query, [idPago, idServicio], callback);
    }

    static consultarServiciosDePago(idPago, callback) {
        const query = 'SELECT s.idServicio as id, s.nombreServicio, s.valorServicio FROM servicio s JOIN pago_servicio ps ON s.idServicio = ps.idServicio WHERE ps.idPago = ?';
        conexion.query(query, [idPago], callback);
    }

    // AGREGAR ESTE MÉTODO NUEVO
    static consultarServiciosPorLocal(callback) {
        const query = `
            SELECT 
                l.idLocal,
                l.direccion,
                GROUP_CONCAT(DISTINCT s.nombreServicio SEPARATOR ', ') AS servicios,
                COALESCE(SUM(DISTINCT s.valorServicio), 0) AS valorTotalServicios
            FROM local l
            LEFT JOIN local_servicio ls ON l.idLocal = ls.idLocal AND ls.incluido = 'Si'
            LEFT JOIN servicio s ON ls.idServicio = s.idServicio
            GROUP BY l.idLocal, l.direccion
        `;
        conexion.query(query, callback);
    }
}

module.exports = GestionServicios;
