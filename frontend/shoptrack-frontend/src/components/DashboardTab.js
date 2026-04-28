import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export function DashboardTab({ inventory, salesHistory }) {
  // Compute low stock items
  const lowStockThreshold = 5;
  const lowStockItems = Object.entries(inventory)
    .map(([name, stock]) => ({ name, stock }))
    .filter(item => item.stock < lowStockThreshold);

  // Compute total revenue
  const totalRevenue = salesHistory.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalItemsSold = salesHistory.length;

  // Prepare chart data for inventory
  const inventoryData = Object.entries(inventory).map(([name, stock]) => ({
    name,
    stock
  }));

  // Prepare chart data for sales (grouped by date)
  // Assuming salesHistory might not have dates, we'll mock dates or group by ID chunks if dates are missing
  // Let's look for timestamp, if not we just show a sequence
  const salesData = salesHistory.map((item, index) => ({
    sequence: `Sale ${index + 1}`,
    amount: item.price || 0
  })).slice(-15); // Last 15 sales

  return (
    <div className="dashboard-wrapper">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value text-success">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <div className="stat-sub">Lifetime sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Items Sold</div>
          <div className="stat-value">{totalItemsSold}</div>
          <div className="stat-sub">Total products shipped</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock Alerts</div>
          <div className="stat-value text-warning">{lowStockItems.length}</div>
          <div className="stat-sub">Items below {lowStockThreshold} units</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <div className="card-title">📊 Current Stock Levels</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                <Bar dataKey="stock" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">📈 Recent Sales</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" />
                <XAxis dataKey="sequence" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="amount" stroke="var(--success)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-card)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="card" style={{ marginTop: '20px', borderColor: 'var(--warning-border)', background: 'var(--warning-bg)' }}>
          <div className="card-title" style={{ color: 'var(--warning)' }}>⚠️ Low Stock Warning</div>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-primary)' }}>
            {lowStockItems.map(item => (
              <li key={item.name} style={{ marginBottom: '8px' }}>
                <strong>{item.name}</strong> — Only {item.stock} left in stock
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
