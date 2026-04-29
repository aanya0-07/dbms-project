import React from 'react';

export function DashboardTab({ salesHistory, inventory, applianceList }) {
  // ── CALCULATIONS ──────────────────────────────────
  const totalRevenue = salesHistory.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalBills = salesHistory.length;
  
  // Get today's sales
  const today = new Date().toLocaleDateString('en-IN');
  const todaySales = salesHistory.filter(sale => 
    new Date(sale.saleDate).toLocaleDateString('en-IN') === today
  );
  const todayRevenue = todaySales.reduce((s, sale) => s + sale.totalAmount, 0);

  // Inventory stats
  const lowStockCount = applianceList.filter(a => (inventory[a.name] || 0) < 5).length;
  const outOfStockCount = applianceList.filter(a => (inventory[a.name] || 0) === 0).length;

  // Most Popular Item (Approximate from history summaries)
  const productCounts = {};
  salesHistory.forEach(sale => {
    // Basic parsing of "Item (x2), Item2 (x1)"
    const items = sale.itemsSummary.split(', ');
    items.forEach(itemStr => {
      const name = itemStr.split(' (x')[0];
      const qtyStr = itemStr.match(/\(x(\d+)\)/);
      const qty = qtyStr ? parseInt(qtyStr[1]) : 1;
      productCounts[name] = (productCounts[name] || 0) + qty;
    });
  });

  const sortedProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="dashboard-wrapper">
      {/* ── TOP STATS ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">Lifetime earnings</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Today's Sales</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            ₹{todayRevenue.toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">{todaySales.length} bills generated today</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Inventory Health</div>
          <div className="stat-value" style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {applianceList.length - lowStockCount}/{applianceList.length}
          </div>
          <div className="stat-sub">{lowStockCount} items need restocking</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>
            {totalBills}
          </div>
          <div className="stat-sub">Completed checkouts</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* ── TOP PRODUCTS ── */}
        <div className="card">
          <div className="card-title">🏆 Top Selling Products</div>
          {sortedProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <p>No sales data yet</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="r">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map(([name, count]) => {
                  const appliance = applianceList.find(a => name.includes(a.name));
                  return (
                    <tr key={name}>
                      <td className="td-name">{appliance?.icon} {name}</td>
                      <td className="r" style={{ fontWeight: 700, color: 'var(--accent)' }}>{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── LOW STOCK ALERTS ── */}
        <div className="card">
          <div className="card-title">⚠️ Stock Alerts</div>
          {lowStockCount === 0 && outOfStockCount === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <div className="empty-icon" style={{ fontSize: '2rem' }}>✅</div>
              <p>All items in stock</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {applianceList
                .filter(a => (inventory[a.name] || 0) < 5)
                .map(item => {
                  const stock = inventory[item.name] || 0;
                  return (
                    <div key={item.name} className="stat-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.icon} {item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remaining: {stock} units</div>
                      </div>
                      <span className={`badge ${stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {stock === 0 ? 'OUT' : 'LOW'}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">🕒 Recent Activity</div>
        {salesHistory.length === 0 ? (
          <div className="empty-state">
            <p>No recent transactions</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Items</th>
                <th className="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {salesHistory.slice(-3).reverse().map(sale => (
                <tr key={sale.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(sale.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{sale.itemsSummary.length > 50 ? sale.itemsSummary.substring(0, 50) + '...' : sale.itemsSummary}</td>
                  <td className="r" style={{ fontWeight: 700, color: 'var(--success)' }}>₹{sale.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
