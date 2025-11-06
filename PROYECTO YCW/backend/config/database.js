const mysql = require('mysql2');

// Railway provee MYSQL como URL de conexión
const connection = process.env.MYSQL 
  ? mysql.createConnection(process.env.MYSQL)
  : mysql.createConnection({
      host: process.env.MYSQLHOST || 'localhost',
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || '',
      database: process.env.MYSQLDATABASE || 'bd_arrendamientos',
      port: process.env.MYSQLPORT || 3306
    });

module.exports = connection;