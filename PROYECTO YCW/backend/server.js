const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const conexion = require('./config/database');
const Auth = require('./src/controllers/Auth');
const FaceAuth = require('./src/controllers/FaceAuth');
const GestionLocales = require('./src/controllers/GestionLocales');
const GestionArrendatarios = require('./src/controllers/GestionArrendatarios');
const GestionContratos = require('./src/controllers/GestionContratos');
const GestionPagos = require('./src/controllers/GestionPagos');
const GestionServicios = require('./src/controllers/GestionServicios');

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
app.use(cors());
app.use(express.json());

// ⚠️ IMPORTANTE: Servir archivos estáticos ANTES de las rutas de API
app.use(express.static(path.join(__dirname, '../frontend')));

// ==========================================
// RUTA DE HEALTH CHECK (opcional - para monitoreo)
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        mensaje: 'API de Sistema de Arrendamientos funcionando',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// AUTENTICACIÓN
// ==========================================

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    Auth.iniciarSesion(email, password, (err, usuario) => {
        if (err) return res.status(401).json({ error: err.message });
        res.json({ success: true, usuario, mensaje: 'Inicio de sesión exitoso' });
    });
});

// ==========================================
// GESTIÓN DE LOCALES
// ==========================================

app.get('/api/locales', (req, res) => {
    GestionLocales.consultarLocales((err, locales) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(locales);
    });
});

app.post('/api/locales', (req, res) => {
    GestionLocales.anadirLocal(req.body, (err, resultado) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: resultado.insertId, mensaje: 'Local añadido' });
    });
});

app.get('/api/locales/:id', (req, res) => {
    GestionLocales.consultarLocalPorId(req.params.id, (err, local) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(local[0]);
    });
});

app.put('/api/locales/:id', (req, res) => {
    GestionLocales.editarLocal(req.params.id, req.body, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, mensaje: 'Local actualizado' });
    });
});

app.delete('/api/locales/:id', (req, res) => {
    GestionLocales.eliminarLocal(req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, mensaje: 'Local eliminado' });
    });
});

// ==========================================
// GESTIÓN DE ARRENDATARIOS
// ==========================================

app.get('/api/arrendatarios', (req, res) => {
    const query = `
        SELECT 
            u.idUsuario AS idArrendatario,
            u.idUsuario,
            u.nombre,
            u.documento,
            u.telefono,
            u.correo,
            r.nombreRol AS rol
        FROM usuarios u
        INNER JOIN rol r ON u.idRol = r.idRol
        WHERE u.idRol = 2
    `;
    
    conexion.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json(results);
    });
});

app.post('/api/arrendatarios', (req, res) => {
    GestionArrendatarios.anadirArrendatario(req.body, (err, resultado) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: resultado.insertId, mensaje: 'Arrendatario añadido' });
    });
});

app.get('/api/arrendatarios/:id', (req, res) => {
    GestionArrendatarios.consultarArrendatarioPorId(req.params.id, (err, arrendatario) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(arrendatario[0]);
    });
});

app.put('/api/arrendatarios/:id', (req, res) => {
    GestionArrendatarios.actualizarArrendatario(req.params.id, req.body, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, mensaje: 'Arrendatario actualizado' });
    });
});

app.delete('/api/arrendatarios/:id', (req, res) => {
    GestionArrendatarios.eliminarArrendatario(req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, mensaje: 'Arrendatario eliminado' });
    });
});

app.get('/api/arrendatarios/:id/contratos', (req, res) => {
    const query = `
        SELECT 
            c.idContrato,
            c.fechaInicio,
            c.fechaFin,
            c.condiciones,
            l.idLocal,
            l.direccion,
            l.area,
            l.valorArriendo
        FROM contratoarrendamiento c
        INNER JOIN local l ON c.idLocal = l.idLocal
        WHERE c.idArrendatario = ?
        ORDER BY c.fechaInicio DESC
    `;
    
    conexion.query(query, [req.params.id], (err, resultados) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(resultados);
    });
});

// ==========================================
// GESTIÓN DE CONTRATOS
// ==========================================

app.get('/api/contratos', (req, res) => {
    GestionContratos.consultarContratos((err, contratos) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(contratos);
    });
});

app.post('/api/contratos', (req, res) => {
    GestionContratos.crearContrato(req.body, (err, resultado) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: resultado.insertId, mensaje: 'Contrato creado' });
    });
});

app.get('/api/contratos/:id', (req, res) => {
    GestionContratos.consultarContrato(req.params.id, (err, contrato) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(contrato[0]);
    });
});

app.put('/api/contratos/:id', (req, res) => {
    GestionContratos.modificarContrato(req.params.id, req.body, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, mensaje: 'Contrato actualizado' });
    });
});

app.delete('/api/contratos/:id', (req, res) => {
    GestionContratos.eliminarContrato(req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, mensaje: 'Contrato eliminado' });
    });
});

// ==========================================
// GESTIÓN DE PAGOS
// ==========================================

// Obtener TODOS los pagos (admin)
app.get('/api/pagos', (req, res) => {
    const query = `
        SELECT 
            pv.idPagoVariado as idPago,
            pv.fechaPago,
            pv.monto,
            pv.tipo as tipoPago,
            pv.descripcion,
            pv.metodoPago,
            pv.idArrendatario,
            pv.idLocal,
            pv.idServicio,
            u.nombre as nombreArrendatario,
            u.documento as documentoArrendatario,
            l.direccion
        FROM pago_variados pv
        INNER JOIN usuarios u ON pv.idArrendatario = u.idUsuario
        INNER JOIN local l ON pv.idLocal = l.idLocal
        ORDER BY pv.fechaPago DESC
    `;
    
    conexion.query(query, (err, resultados) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(resultados);
    });
});

// Obtener pagos de un arrendatario específico
app.get('/api/arrendatarios/:id/pagos', (req, res) => {
    const query = `
        SELECT 
            pv.idPagoVariado as idPago,
            pv.fechaPago,
            pv.monto,
            pv.tipo as tipoPago,
            pv.descripcion,
            l.direccion
        FROM pago_variados pv
        INNER JOIN local l ON pv.idLocal = l.idLocal
        WHERE pv.idArrendatario = ?
        ORDER BY pv.fechaPago DESC
    `;
    
    conexion.query(query, [req.params.id], (err, resultados) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(resultados);
    });
});

// Obtener pagos pendientes del mes
app.get('/api/arrendatarios/:id/pagos-pendientes-mes', (req, res) => {
    const idArrendatario = req.params.id;
    
    // Obtener contratos activos
    const queryContratos = `
        SELECT 
            c.idContrato,
            c.idLocal,
            l.direccion,
            l.valorArriendo
        FROM contratoarrendamiento c
        INNER JOIN local l ON c.idLocal = l.idLocal
        WHERE c.idArrendatario = ?
        AND c.fechaFin >= CURDATE()
    `;
    
    conexion.query(queryContratos, [idArrendatario], (err, contratos) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        if (contratos.length === 0) {
            return res.json({
                mesActual: obtenerNombreMesActual(),
                diaLimitePago: 5,
                pagosPendientes: []
            });
        }
        
        // Verificar pagos realizados este mes
        const queryPagosRealizados = `
            SELECT 
                idLocal,
                tipo,
                DATE_FORMAT(fechaPago, '%Y-%m') as mes_pago
            FROM pago_variados
            WHERE idArrendatario = ?
            AND MONTH(fechaPago) = MONTH(CURDATE())
            AND YEAR(fechaPago) = YEAR(CURDATE())
        `;
        
        conexion.query(queryPagosRealizados, [idArrendatario], (err, pagosRealizados) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            
            const pagosRealizadosMap = new Set();
            pagosRealizados.forEach(pago => {
                pagosRealizadosMap.add(`${pago.idLocal}-${pago.tipo}`);
            });
            
            // Consultar servicios de cada local
            const promesasServicios = contratos.map(contrato => {
                return new Promise((resolve) => {
                    const queryServicios = `
                        SELECT 
                            s.idServicio,
                            s.nombreServicio,
                            s.valorServicio
                        FROM local_servicio ls
                        INNER JOIN servicio s ON ls.idServicio = s.idServicio
                        WHERE ls.idLocal = ? 
                        AND ls.incluido = 'Si'
                    `;
                    
                    conexion.query(queryServicios, [contrato.idLocal], (err, servicios) => {
                        resolve({ ...contrato, servicios: servicios || [] });
                    });
                });
            });
            
            Promise.all(promesasServicios).then(contratosConServicios => {
                const pagosPendientes = [];
                const fechaLimite = new Date();
                fechaLimite.setDate(5);
                
                contratosConServicios.forEach(contrato => {
                    // Verificar arriendo
                    const keyArriendo = `${contrato.idLocal}-Arriendo`;
                    if (!pagosRealizadosMap.has(keyArriendo)) {
                        pagosPendientes.push({
                            tipo: 'Arriendo',
                            local: `${contrato.direccion} (Local #${contrato.idLocal})`,
                            idLocal: contrato.idLocal,
                            idContrato: contrato.idContrato,
                            monto: parseFloat(contrato.valorArriendo),
                            descripcion: `Arriendo mensual del local ${contrato.direccion}`,
                            vencimiento: fechaLimite.toISOString().split('T')[0],
                            servicios: []
                        });
                    }
                    
                    // Verificar servicios
                    if (contrato.servicios && contrato.servicios.length > 0) {
                        const keyServicios = `${contrato.idLocal}-Servicio`;
                        if (!pagosRealizadosMap.has(keyServicios)) {
                            const montoServicios = contrato.servicios.reduce((sum, s) => 
                                sum + parseFloat(s.valorServicio), 0
                            );
                            
                            pagosPendientes.push({
                                tipo: 'Servicios',
                                local: `${contrato.direccion} (Local #${contrato.idLocal})`,
                                idLocal: contrato.idLocal,
                                idContrato: contrato.idContrato,
                                monto: montoServicios,
                                descripcion: `Servicios del local: ${contrato.servicios.map(s => s.nombreServicio).join(', ')}`,
                                vencimiento: fechaLimite.toISOString().split('T')[0],
                                servicios: contrato.servicios.map(s => ({
                                    idServicio: s.idServicio,
                                    nombre: s.nombreServicio,
                                    valor: parseFloat(s.valorServicio)
                                }))
                            });
                        }
                    }
                });
                
                res.json({
                    mesActual: obtenerNombreMesActual(),
                    diaLimitePago: 5,
                    pagosPendientes: pagosPendientes.sort((a, b) => {
                        if (a.idLocal === b.idLocal) {
                            return a.tipo === 'Arriendo' ? -1 : 1;
                        }
                        return a.idLocal - b.idLocal;
                    })
                });
            });
        });
    });
});

// Registrar pago
app.post('/api/pagos/registrar', (req, res) => {
    const {
        fechaPago,
        monto,
        tipoPago,
        metodoPago,
        idArrendatario,
        idAdministrador = 11,
        idLocal,
        idContrato,
        servicios = []
    } = req.body;
    
    if (!fechaPago || !monto || !tipoPago || !idArrendatario || !idLocal) {
        return res.status(400).json({ 
            success: false, 
            error: 'Faltan datos requeridos'
        });
    }
    
    let descripcion = '';
    let tipoParaBD = tipoPago;
    
    if (tipoPago === 'Arriendo') {
        descripcion = `Pago de arriendo mensual - Local ${idLocal}`;
    } else if (tipoPago === 'Servicios') {
        const nombresServicios = servicios.map(s => s.nombre || s.nombreServicio).join(', ');
        descripcion = `Pago de servicios: ${nombresServicios} - Local ${idLocal}`;
        tipoParaBD = 'Servicio';
    }
    
    const queryPago = `
        INSERT INTO pago_variados 
        (fechaPago, monto, tipo, descripcion, metodoPago, idArrendatario, idAdministrador, idLocal, idContrato) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const valores = [
        fechaPago, 
        parseFloat(monto), 
        tipoParaBD,
        descripcion,
        metodoPago || 'efectivo', 
        parseInt(idArrendatario), 
        parseInt(idAdministrador), 
        parseInt(idLocal), 
        idContrato || null
    ];
    
    conexion.query(queryPago, valores, (err, resultado) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        const idPagoVariado = resultado.insertId;
        const comprobante = `PAGO-${idPagoVariado}-${Date.now().toString().slice(-6)}`;
        
        res.json({ 
            success: true, 
            idPago: idPagoVariado,
            comprobante: comprobante,
            message: 'Pago registrado correctamente'
        });
    });
});

// Reporte de pagos del mes
app.get('/api/pagos/reporte-pagos-mes', (req, res) => {
    const DIA_LIMITE_PAGO = 5;
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();
    
    const queryContratos = `
        SELECT 
            u.idUsuario,
            u.nombre,
            u.documento,
            c.idLocal,
            l.direccion,
            l.valorArriendo,
            c.idContrato
        FROM usuarios u
        INNER JOIN contratoarrendamiento c ON u.idUsuario = c.idArrendatario
        INNER JOIN local l ON c.idLocal = l.idLocal
        WHERE u.idRol = 2
          AND c.fechaFin >= CURRENT_DATE()
        ORDER BY u.nombre
    `;
    
    conexion.query(queryContratos, async (err, contratos) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        
        const pendientes = [];
        const alDia = [];
        
        for (const contrato of contratos) {
            try {
                // Verificar pago de arriendo
                const queryPagoArriendo = `
                    SELECT COUNT(*) as count 
                    FROM pago_variados 
                    WHERE idArrendatario = ? AND idLocal = ?
                      AND tipo = 'Arriendo'
                      AND MONTH(fechaPago) = ? AND YEAR(fechaPago) = ?
                `;
                
                const resultArriendo = await new Promise((resolve, reject) => {
                    conexion.query(queryPagoArriendo, 
                        [contrato.idUsuario, contrato.idLocal, mesActual, añoActual], 
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result[0].count > 0);
                        }
                    );
                });
                
                // Obtener servicios
                const queryServicios = `
                    SELECT s.idServicio, s.nombreServicio, s.valorServicio
                    FROM local_servicio ls
                    INNER JOIN servicio s ON ls.idServicio = s.idServicio
                    WHERE ls.idLocal = ? AND ls.incluido = 'Si'
                `;
                
                const servicios = await new Promise((resolve, reject) => {
                    conexion.query(queryServicios, [contrato.idLocal], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
                
                let resultServicios = true;
                
                if (servicios.length > 0) {
                    const queryPagoServicios = `
                        SELECT COUNT(*) as count 
                        FROM pago_variados 
                        WHERE idArrendatario = ? AND idLocal = ?
                          AND tipo = 'Servicio'
                          AND MONTH(fechaPago) = ? AND YEAR(fechaPago) = ?
                    `;
                    
                    resultServicios = await new Promise((resolve, reject) => {
                        conexion.query(queryPagoServicios, 
                            [contrato.idUsuario, contrato.idLocal, mesActual, añoActual], 
                            (err, result) => {
                                if (err) reject(err);
                                else resolve(result[0].count > 0);
                            }
                        );
                    });
                }
                
                const valorServicios = servicios.reduce((sum, s) => 
                    sum + parseFloat(s.valorServicio), 0
                );
                
                const pagadoArriendo = resultArriendo;
                const pagadoServicios = resultServicios;
                const tieneServicios = servicios.length > 0;
                
                if (!pagadoArriendo || (tieneServicios && !pagadoServicios)) {
                    let totalPendiente = 0;
                    const conceptosPendientes = [];
                    
                    if (!pagadoArriendo) {
                        totalPendiente += parseFloat(contrato.valorArriendo);
                        conceptosPendientes.push('Arriendo');
                    }
                    
                    if (tieneServicios && !pagadoServicios) {
                        totalPendiente += valorServicios;
                        conceptosPendientes.push('Servicios');
                    }
                    
                    pendientes.push({
                        nombre: contrato.nombre,
                        documento: contrato.documento,
                        direccion: contrato.direccion,
                        pagadoArriendo,
                        valorArriendo: parseFloat(contrato.valorArriendo),
                        pagadoServicios,
                        valorServicios,
                        serviciosPendientes: tieneServicios && !pagadoServicios ? servicios.length : 0,
                        totalPendiente,
                        conceptosPendientes: conceptosPendientes.join(', '),
                        montoArriendo: !pagadoArriendo ? parseFloat(contrato.valorArriendo) : 0,
                        montoServicios: (tieneServicios && !pagadoServicios) ? valorServicios : 0
                    });
                } else {
                    alDia.push({
                        nombre: contrato.nombre,
                        documento: contrato.documento,
                        direccion: contrato.direccion,
                        pagadoArriendo,
                        pagadoServicios: tieneServicios ? pagadoServicios : true,
                        tieneServicios
                    });
                }
                
            } catch (error) {
                console.error('Error procesando contrato:', error);
            }
        }
        
        res.json({
            success: true,
            pendientes,
            alDia,
            fecha: hoy.toISOString().split('T')[0],
            mes: hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
            diaLimitePago: DIA_LIMITE_PAGO,
            totalPendientes: pendientes.length,
            totalAlDia: alDia.length
        });
    });
});

// ==========================================
// GESTIÓN DE SERVICIOS
// ==========================================

app.get('/api/servicios', (req, res) => {
    GestionServicios.consultarServicios((err, servicios) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(servicios);
    });
});

app.post('/api/servicios', (req, res) => {
    GestionServicios.registrarServicio(req.body, (err, resultado) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: resultado.insertId, mensaje: 'Servicio registrado' });
    });
});

app.get('/api/locales/:id/servicios', (req, res) => {
    const query = `
        SELECT 
            s.idServicio,
            s.nombreServicio,
            s.valorServicio
        FROM servicio s
        INNER JOIN local_servicio ls ON s.idServicio = ls.idServicio
        WHERE ls.idLocal = ? AND ls.incluido = 'Si'
    `;
    
    conexion.query(query, [req.params.id], (error, results) => {
        if (error) return res.status(500).json({ success: false, error: error.message });
        res.json(results);
    });
});

app.get('/api/servicios-por-local', (req, res) => {
    const query = `
        SELECT 
            l.idLocal,
            l.direccion,
            COALESCE(GROUP_CONCAT(DISTINCT s.nombreServicio SEPARATOR ', '), 'Sin servicios') AS servicios,
            COALESCE(SUM(DISTINCT s.valorServicio), 0) AS valorTotalServicios
        FROM local l
        LEFT JOIN local_servicio ls ON l.idLocal = ls.idLocal
        LEFT JOIN servicio s ON ls.idServicio = s.idServicio
        GROUP BY l.idLocal, l.direccion
        ORDER BY l.idLocal
    `;
    
    conexion.query(query, (error, results) => {
        if (error) return res.status(500).json({ success: false, error: error.message });
        res.json(results);
    });
});

app.post('/api/servicios-por-local', (req, res) => {
    const { idLocal, idServicio } = req.body;
    
    if (!idLocal || !idServicio) {
        return res.status(400).json({ success: false, error: 'Se requieren idLocal e idServicio' });
    }
    
    const checkQuery = 'SELECT * FROM local_servicio WHERE idLocal = ? AND idServicio = ?';
    
    conexion.query(checkQuery, [idLocal, idServicio], (error, results) => {
        if (error) return res.status(500).json({ success: false, error: error.message });
        
        if (results.length > 0) {
            return res.status(400).json({ success: false, error: 'Este servicio ya está asignado' });
        }
        
        const insertQuery = 'INSERT INTO local_servicio (idLocal, idServicio, incluido) VALUES (?, ?, "Si")';
        
        conexion.query(insertQuery, [idLocal, idServicio], (error, results) => {
            if (error) return res.status(500).json({ success: false, error: error.message });
            res.json({ success: true, message: 'Servicio agregado exitosamente', insertId: results.insertId });
        });
    });
});

// ==========================================
// MANTENIMIENTO
// ==========================================

app.get('/api/mantenimiento/solicitudes', (req, res) => {
    const query = `
        SELECT 
            m.idMantenimiento as id,
            m.tipoMantenimiento as tipo_servicio,
            m.descripcion,
            m.prioridad,
            m.estado,
            m.idLocal as local_id,
            l.direccion as local_nombre,
            a.nombre as arrendatario_nombre,
            m.fecha_creacion
        FROM mantenimiento m
        INNER JOIN local l ON m.idLocal = l.idLocal
        INNER JOIN usuarios a ON m.idArrendatario = a.idUsuario
        ORDER BY 
            CASE m.prioridad
                WHEN 'urgente' THEN 1
                WHEN 'normal' THEN 2
                WHEN 'baja' THEN 3
            END,
            m.idMantenimiento DESC
    `;
    
    conexion.query(query, (err, resultados) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(resultados);
    });
});

app.post('/api/mantenimiento/solicitud', (req, res) => {
    const { idLocal, idArrendatario, tipoMantenimiento, descripcion, prioridad } = req.body;
    
    if (!idLocal || !idArrendatario || !tipoMantenimiento || !descripcion) {
        return res.status(400).json({
            success: false,
            message: 'Faltan campos requeridos'
        });
    }
    
    const query = `
        INSERT INTO mantenimiento 
        (idLocal, idArrendatario, tipoMantenimiento, descripcion, prioridad, estado, idAdministrador) 
        VALUES (?, ?, ?, ?, ?, 'pendiente', 11)
    `;
    
    const valores = [idLocal, idArrendatario, tipoMantenimiento, descripcion, prioridad || 'normal'];
    
    conexion.query(query, valores, (err, resultado) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, id: resultado.insertId, message: 'Solicitud creada' });
    });
});

app.post('/api/mantenimiento/actualizar-estado', (req, res) => {
    const { id, estado } = req.body;
    
    if (!id || !estado) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }
    
    const query = 'UPDATE mantenimiento SET estado = ? WHERE idMantenimiento = ?';
    
    conexion.query(query, [estado, id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Estado actualizado' });
    });
});

app.get('/api/arrendatarios/:id/solicitudes-mantenimiento', (req, res) => {
    const query = `
        SELECT 
            m.idMantenimiento as id,
            m.tipoMantenimiento as tipo_servicio,
            m.descripcion,
            m.prioridad,
            m.estado,
            l.direccion as local_nombre,
            m.fecha_creacion
        FROM mantenimiento m
        INNER JOIN local l ON m.idLocal = l.idLocal
        WHERE m.idArrendatario = ?
        ORDER BY m.fecha_creacion DESC
    `;
    
    conexion.query(query, [req.params.id], (err, resultados) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(resultados);
    });
});

// ==========================================
// AUTENTICACIÓN FACIAL
// ==========================================

app.get('/api/face-auth/check/:idUsuario', (req, res) => {
    FaceAuth.tieneRegistroFacial(req.params.idUsuario, (err, existe) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ existe, mensaje: existe ? 'Usuario tiene registro facial' : 'Usuario sin registro facial' });
    });
});

app.post('/api/face-auth/register', (req, res) => {
    const { idUsuario, descriptor } = req.body;
    
    if (!idUsuario || !descriptor) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }

    FaceAuth.guardarDescriptorFacial(idUsuario, descriptor, (err, resultado) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(resultado);
    });
});

app.post('/api/face-auth/verify', (req, res) => {
    const { idUsuario, descriptor } = req.body;
    
    if (!idUsuario || !descriptor) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }

    FaceAuth.obtenerDescriptorFacial(idUsuario, (err, data) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        if (!data.existe) {
            return res.json({ 
                success: false, 
                requiresRegistration: true,
                mensaje: 'Debes registrar tu rostro primero' 
            });
        }

        res.json({ 
            success: true, 
            descriptorGuardado: data.descriptor,
            mensaje: 'Descriptor obtenido correctamente'
        });
    });
});

app.delete('/api/face-auth/delete/:idUsuario', (req, res) => {
    FaceAuth.eliminarDescriptorFacial(req.params.idUsuario, (err, resultado) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, mensaje: 'Registro facial eliminado' });
    });
});

// ==========================================
// ESTADÍSTICAS
// ==========================================

app.get('/api/estadisticas', (req, res) => {
    const queries = {
        totalLocales: 'SELECT COUNT(*) as total FROM local',
        totalArrendatarios: 'SELECT COUNT(*) as total FROM usuarios WHERE idRol = 2',
        contratosActivos: 'SELECT COUNT(*) as total FROM contratoarrendamiento WHERE fechaFin >= CURDATE()',
        pagosRegistrados: 'SELECT COUNT(*) as total FROM pago_variados',
        serviciosActivos: 'SELECT COUNT(*) as total FROM servicio',
        ingresosTotales: 'SELECT COALESCE(SUM(monto), 0) as total FROM pago_variados'
    };
    
    const resultados = {};
    let completadas = 0;
    
    Object.keys(queries).forEach(key => {
        conexion.query(queries[key], (err, result) => {
            resultados[key] = err ? 0 : result[0].total;
            completadas++;
            
            if (completadas === Object.keys(queries).length) {
                res.json(resultados);
            }
        });
    });
});

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function obtenerNombreMesActual() {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const fecha = new Date();
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// ==========================================
// ⚠️ CRÍTICO: CATCH-ALL DEBE IR AL FINAL
// Esta ruta sirve el HTML para todas las rutas que no sean /api/*
// ==========================================

app.get('*', (req, res) => {
    // Solo servir HTML para rutas que NO empiezan con /api
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Ruta API no encontrada' });
    }
    res.sendFile(path.join(__dirname, '../frontend', 'ycw.html'));
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});