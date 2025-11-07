// ==============================================
// 🏥 PANEL ADMIN Y EXPORTACIÓN (AGREGAR AL FINAL)
// ==============================================

// ✅ CONFIGURACIÓN DE POSTGRESQL (si no la tienes)
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 📊 PANEL ADMIN PARA VER Y EXPORTAR DATOS
app.get('/admin', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM affiliates ORDER BY created_at DESC');
        
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin - Salud Total EPS</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #0055A4; text-align: center; margin-bottom: 30px; }
                .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
                .count { background: #00A859; color: white; padding: 10px 20px; border-radius: 5px; }
                .export-btn { background: #0055A4; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 5px; display: inline-block; }
                .export-btn:hover { background: #003366; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #0055A4; color: white; }
                tr:hover { background: #f0f7ff; }
                @media (max-width: 768px) {
                    .header-actions { flex-direction: column; align-items: stretch; }
                    table { font-size: 14px; }
                    th, td { padding: 8px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🏥 Salud Total EPS - Panel Admin</h1>
                <div class="header-actions">
                    <div class="count">Total Afiliados: ${result.rows.length}</div>
                    <div>
                        <a href="/admin/export/excel" class="export-btn">📊 Excel</a>
                        <a href="/admin/export/csv" class="export-btn">📄 CSV</a>
                        <a href="/admin/export/json" class="export-btn">📋 JSON</a>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Documento</th>
                            <th>Email</th>
                            <th>Edad</th>
                            <th>Fecha Registro</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        result.rows.forEach(afiliado => {
            html += `
                    <tr>
                        <td><strong>${afiliado.affiliate_id || afiliado.id}</strong></td>
                        <td>${afiliado.nombre}</td>
                        <td>${afiliado.apellido}</td>
                        <td>${afiliado.tipo_documento}: ${afiliado.numero_documento}</td>
                        <td>${afiliado.correo}</td>
                        <td>${afiliado.edad}</td>
                        <td>${new Date(afiliado.created_at).toLocaleString('es-CO')}</td>
                    </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        </body>
        </html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('❌ Error en panel admin:', error);
        res.status(500).send('Error al cargar los datos');
    }
});

// 📥 EXPORTAR A EXCEL
app.get('/admin/export/excel', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM affiliates ORDER BY created_at DESC');
        
        let excelContent = '\\uFEFF'; // BOM para UTF-8
        excelContent += 'ID Afiliado,Nombre,Apellido,Tipo Documento,Numero Documento,Email,Edad,Fecha Nacimiento,Lugar Nacimiento,Fecha Registro\\n';
        
        result.rows.forEach(afiliado => {
            excelContent += `"${afiliado.affiliate_id || afiliado.id}","${afiliado.nombre}","${afiliado.apellido}","${afiliado.tipo_documento}","${afiliado.numero_documento}","${afiliado.correo}","${afiliado.edad}","${afiliado.fecha_nacimiento}","${afiliado.lugar_nacimiento}","${new Date(afiliado.created_at).toLocaleString('es-CO')}"\\n`;
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="afiliados-salud-total-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(excelContent);
        
    } catch (error) {
        console.error('❌ Error exportando Excel:', error);
        res.status(500).send('Error al exportar a Excel');
    }
});

// 📄 EXPORTAR A CSV
app.get('/admin/export/csv', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM affiliates ORDER BY created_at DESC');
        
        let csvContent = '\\uFEFF'; // BOM para UTF-8
        csvContent += 'ID Afiliado,Nombre,Apellido,Tipo Documento,Numero Documento,Email,Edad,Fecha Nacimiento,Lugar Nacimiento,Fecha Registro\\n';
        
        result.rows.forEach(afiliado => {
            csvContent += `"${afiliado.affiliate_id || afiliado.id}","${afiliado.nombre}","${afiliado.apellido}","${afiliado.tipo_documento}","${afiliado.numero_documento}","${afiliado.correo}","${afiliado.edad}","${afiliado.fecha_nacimiento}","${afiliado.lugar_nacimiento}","${new Date(afiliado.created_at).toLocaleString('es-CO')}"\\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="afiliados-salud-total-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
        
    } catch (error) {
        console.error('❌ Error exportando CSV:', error);
        res.status(500).send('Error al exportar a CSV');
    }
});

// 📋 EXPORTAR A JSON
app.get('/admin/export/json', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM affiliates ORDER BY created_at DESC');
        
        const jsonData = {
            sistema: 'Salud Total EPS',
            fecha_exportacion: new Date().toISOString(),
            total_afiliados: result.rows.length,
            afiliados: result.rows
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="afiliados-salud-total-${new Date().toISOString().split('T')[0]}.json"`);
        res.send(JSON.stringify(jsonData, null, 2));
        
    } catch (error) {
        console.error('❌ Error exportando JSON:', error);
        res.status(500).send('Error al exportar a JSON');
    }
});

// ==============================================
// 🚀 MANTÉN TU app.listen AL FINAL
// ==============================================
