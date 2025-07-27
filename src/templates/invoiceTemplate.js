const createInvoiceHTML = (data) => {
  const articlesTotal = data.articles.reduce((sum, art) => sum + parseFloat(art.totalPrice || 0), 0);
  const servicesTotal = data.services.reduce((sum, srv) => sum + parseFloat(srv.cost || 0), 0);
  const subtotal = articlesTotal + servicesTotal;
  const reduction = parseFloat(data.vente.reduction || 0);
  const total = parseFloat(data.vente.totalCost || 0);

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Facture de Vente - ${data.vente._id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #ffffff;
          padding: 20px;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .content {
          padding: 30px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          margin-bottom: 30px;
        }
        
        .info-box {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        
        .info-box h3 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 18px;
          font-weight: 600;
        }
        
        .info-box p {
          margin: 8px 0;
          font-size: 14px;
        }
        
        .info-box strong {
          color: #495057;
        }
        
        .section {
          margin: 30px 0;
        }
        
        .section h3 {
          color: #667eea;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
          margin-bottom: 20px;
          font-size: 20px;
          font-weight: 600;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
        }
        
        td {
          padding: 15px 12px;
          border-bottom: 1px solid #e9ecef;
          font-size: 14px;
        }
        
        tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        tr:hover {
          background: #e9ecef;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .total-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 10px;
          margin: 25px 0;
          text-align: right;
        }
        
        .total-section h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .total-section p {
          margin: 8px 0;
          font-size: 16px;
          opacity: 0.9;
        }
        
        .installments {
          background: #fff3cd;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #ffc107;
        }
        
        .installments h3 {
          color: #856404;
          margin-bottom: 15px;
        }
        
        .notes {
          background: #d1ecf1;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #17a2b8;
        }
        
        .notes h3 {
          color: #0c5460;
          margin-bottom: 15px;
        }
        
        .footer {
          background: #f8f9fa;
          padding: 25px;
          text-align: center;
          border-top: 1px solid #e9ecef;
        }
        
        .footer p {
          color: #6c757d;
          font-size: 14px;
          margin: 5px 0;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .badge-primary {
          background: #667eea;
          color: white;
        }
        
        .badge-success {
          background: #28a745;
          color: white;
        }
        
        @media print {
          body { margin: 0; }
          .invoice-container { 
            max-width: none; 
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <h1>FACTURE DE VENTE</h1>
          <p>SERAT - Système de Gestion Automatisé</p>
        </div>
        
        <div class="content">
          <!-- Info Grid -->
          <div class="info-grid">
            <div class="info-box">
              <h3>📋 Informations Facture</h3>
              <p><strong>N° Facture:</strong> ${data.vente._id}</p>
              <p><strong>Date:</strong> ${new Date(data.vente.createdAt).toLocaleDateString('fr-FR')}</p>
              <p><strong>Heure:</strong> ${new Date(data.vente.createdAt).toLocaleTimeString('fr-FR')}</p>
              <p><strong>Type de paiement:</strong> 
                <span class="badge badge-${data.vente.paymentType === 'comptant' ? 'success' : 'primary'}">
                  ${data.vente.paymentType}
                </span>
              </p>
            </div>
            
            <div class="info-box">
              <h3>👤 Client</h3>
              <p><strong>Nom:</strong> ${data.customer.name}</p>
              <p><strong>CIN:</strong> ${data.customer.cin}</p>
              <p><strong>Téléphone:</strong> ${data.customer.phoneNumber}</p>
            </div>
          </div>
          
          <!-- Articles -->
          ${data.articles && data.articles.length > 0 ? `
            <div class="section">
              <h3>📦 Articles</h3>
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th class="text-center">Quantité</th>
                    <th class="text-right">Prix Unit.</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.articles.map(art => `
                    <tr>
                      <td>${art.product.title}</td>
                      <td class="text-center">${art.quantity}</td>
                      <td class="text-right">${parseFloat(art.unitPrice).toFixed(2)} DA</td>
                      <td class="text-right">${parseFloat(art.totalPrice).toFixed(2)} DA</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <!-- Services -->
          ${data.services && data.services.length > 0 ? `
            <div class="section">
              <h3>🔧 Services</h3>
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Description</th>
                    <th class="text-right">Coût</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.services.map(srv => `
                    <tr>
                      <td>${srv.service.title}</td>
                      <td>${srv.description || ''}</td>
                      <td class="text-right">${parseFloat(srv.cost).toFixed(2)} DA</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <!-- Financial Summary -->
          <div class="total-section">
            <p><strong>Sous-total:</strong> ${subtotal.toFixed(2)} DA</p>
            ${reduction > 0 ? `<p><strong>Réduction:</strong> ${reduction.toFixed(2)} DA</p>` : ''}
            <h2>Total: ${total.toFixed(2)} DA</h2>
          </div>
          
          <!-- Installments -->
          ${data.vente.installments && data.vente.installments.length > 0 ? `
            <div class="installments">
              <h3>📅 Échéances</h3>
              ${data.vente.installments.map((inst, idx) => `
                <p style="margin: 8px 0; padding: 8px; background: white; border-radius: 4px;">
                  <strong>${idx + 1}.</strong> ${parseFloat(inst.amount).toFixed(2)} DA - 
                  ${new Date(inst.dueDate).toLocaleDateString('fr-FR')}
                </p>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Notes -->
          ${data.vente.notes ? `
            <div class="notes">
              <h3>📝 Notes</h3>
              <p>${data.vente.notes}</p>
            </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Merci pour votre achat!</p>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { createInvoiceHTML }; 