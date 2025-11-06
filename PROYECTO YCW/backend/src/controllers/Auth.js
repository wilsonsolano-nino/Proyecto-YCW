const conexion = require('../../config/database');

class Auth {
    static iniciarSesion(email, password, callback) {
        const query = `
            SELECT u.idUsuario, u.nombre, u.correo, u.documento, r.idRol, r.nombreRol 
            FROM usuarios u 
            INNER JOIN rol r ON u.idRol = r.idRol 
            WHERE u.correo = ? AND u.documento = ?
        `;
        
        conexion.query(query, [email, password], (err, resultados) => {
            if (err) {
                callback(err, null);
                return;
            }
            
            if (resultados.length > 0) {
                const usuario = {
                    idUsuario: resultados[0].idUsuario,
                    nombre: resultados[0].nombre,
                    correo: resultados[0].correo,
                    documento: resultados[0].documento,
                    idRol: resultados[0].idRol,
                    rol: resultados[0].nombreRol
                };
                callback(null, usuario);
            } else {
                callback(new Error("Credenciales inválidas"), null);
            }
        });
    }
}

module.exports = Auth;
