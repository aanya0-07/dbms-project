import React from 'react';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function HistoryTab({ salesHistory }) {
  const totalRevenue      = salesHistory.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalTransactions = salesHistory.length;
  const avgOrder          = totalTransactions ? Math.round(totalRevenue / totalTransactions) : 0;

  const exportToCSV = () => {
    if (salesHistory.length === 0) return;

    // Headers
    const headers = ['Date', 'Transaction ID', 'Customer Name', 'Customer Phone', 'Items', 'Total Amount'];
    
    // Rows
    const rows = salesHistory.map(sale => {
      let customerName = 'N/A';
      let customerPhone = '';
      let items = sale.itemsSummary;

      // Extract customer info from summary if present: [Name - Phone] Items...
      const match = items.match(/^\[(.*?)\] (.*)$/);
      if (match) {
        const customerDetails = match[1].split(' - ');
        customerName = customerDetails[0] || 'N/A';
        customerPhone = customerDetails[1] || '';
        items = match[2];
      }

      return [
        formatDate(sale.saleDate),
        sale.transactionId,
        customerName,
        customerPhone,
        `"${items}"`, // quote items to avoid comma issues in CSV
        sale.totalAmount
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Sales_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* ── STATS ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>{totalTransactions}</div>
          <div className="stat-sub">completed sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: '1.45rem' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">lifetime earnings</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Order Value</div>
          <div className="stat-value" style={{ color: 'var(--warning)', fontSize: '1.45rem' }}>
            ₹{avgOrder.toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">per transaction</div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📜 Transaction Log</div>
          <button className="btn btn-ghost btn-sm" onClick={exportToCSV} disabled={salesHistory.length === 0}>
            📥 Export CSV
          </button>
        </div>

        {salesHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No sales records yet</p>
            <span>Completed transactions will appear here</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[...salesHistory].reverse().map(sale => {
                  let customerName = 'N/A';
                  let items = sale.itemsSummary;

                  // Extract customer info from summary if present
                  const match = items.match(/^\[(.*?)\] (.*)$/);
                  if (match) {
                    const customerDetails = match[1].split(' - ');
                    customerName = customerDetails[0] || 'N/A';
                    items = match[2];
                  }

                  return (
                    <tr key={sale.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {formatDate(sale.saleDate)}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {sale.transactionId}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {customerName}
                      </td>
                      <td style={{ maxWidth: 220 }}>{items}</td>
                      <td className="r" style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1rem' }}>
                        ₹{sale.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
