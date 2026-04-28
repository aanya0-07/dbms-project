import React from 'react';

function StatusBadge({ stock }) {
  if (stock === 0) return <span className="badge badge-danger">OUT OF STOCK</span>;
  if (stock < 5)  return <span className="badge badge-warning">LOW STOCK</span>;
  return               <span className="badge badge-success">IN STOCK</span>;
}

export function InventoryTab({ applianceList, inventory, onAdjust, onSetExact, editingItem, setEditingItem, editValue, setEditValue }) {
  const totalUnits = Object.values(inventory).reduce((s, v) => s + v, 0);
  const lowItems   = applianceList.filter(a => (inventory[a.name] || 0) < 5).length;

  const exportToCSV = () => {
    const headers = ['Product Name', 'Unit Price', 'Current Stock', 'Status'];
    
    const rows = applianceList.map(item => {
      const stock = inventory[item.name] || 0;
      let status = 'IN STOCK';
      if (stock === 0) status = 'OUT OF STOCK';
      else if (stock < 5) status = 'LOW STOCK';

      return [
        `"${item.name}"`,
        item.price,
        stock,
        status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Inventory_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* ── SUMMARY CARDS ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Units</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{totalUnits}</div>
          <div className="stat-sub">across all products</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>{applianceList.length}</div>
          <div className="stat-sub">appliance categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Needs Attention</div>
          <div className="stat-value" style={{ color: lowItems > 0 ? 'var(--warning)' : 'var(--success)' }}>{lowItems}</div>
          <div className="stat-sub">low / out of stock</div>
        </div>
      </div>

      {/* ── INVENTORY TABLE ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📦 Stock Levels</div>
          <button className="btn btn-ghost btn-sm" onClick={exportToCSV}>
            📥 Export CSV
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Appliance</th>
                <th className="r">Unit Price</th>
                <th className="c">Stock</th>
                <th className="c">Status</th>
                <th className="c">Quick Adjust</th>
                <th className="c">Set Exact</th>
              </tr>
            </thead>
            <tbody>
              {applianceList.map(item => {
                const stock = inventory[item.name] || 0;
                const isEditing = editingItem === item.name;
                return (
                  <tr key={item.name} style={{
                    background: stock === 0 ? 'rgba(248,113,113,0.04)' : stock < 5 ? 'rgba(251,191,36,0.04)' : 'transparent'
                  }}>
                    <td><span className="td-name">{item.icon} {item.name}</span></td>
                    <td className="r">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="c" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                      {stock}
                    </td>
                    <td className="c"><StatusBadge stock={stock} /></td>
                    <td className="c">
                      <div className="stock-adjuster">
                        <button onClick={() => onAdjust(item.name, -5)} title="−5">−5</button>
                        <button onClick={() => onAdjust(item.name, -1)} title="−1">−</button>
                        <button onClick={() => onAdjust(item.name,  1)} title="+1">+</button>
                        <button onClick={() => onAdjust(item.name,  5)} title="+5">+5</button>
                      </div>
                    </td>
                    <td className="c">
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                          <input
                            className="stock-edit-input"
                            type="number" min="0"
                            value={editValue}
                            onChange={e => setEditValue(parseInt(e.target.value) || 0)}
                            autoFocus
                          />
                          <button className="btn btn-success btn-sm" onClick={() => onSetExact(item.name, editValue)}>✓</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingItem(null)}>✕</button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditingItem(item.name); setEditValue(stock); }}>
                          ✏️ Set
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="note-box">
          <strong>ℹ️ Note:</strong> Items below 5 units are marked as LOW STOCK. Use quick adjust buttons for fast stock changes, or "Set" to enter an exact count.
        </div>
      </div>
    </>
  );
}
