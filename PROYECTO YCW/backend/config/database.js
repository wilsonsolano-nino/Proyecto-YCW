const mysql = require('mysql2');

const connection = mysql.createConnection(process.env.MYSQL || {
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'bd_arrendamientos',
  port: process.env.MYSQLPORT || 3306
});