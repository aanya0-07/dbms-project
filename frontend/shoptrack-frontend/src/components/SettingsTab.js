import React, { useState } from 'react';

export function SettingsTab({ applianceList, setApplianceList, inventory, setInventory }) {
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newIcon, setNewIcon] = useState('📦');

  const handleAdd = () => {
    if (!newName || !newPrice) return;
    const priceNum = parseInt(newPrice) || 0;
    
    // Add to appliance list
    const updatedList = [...applianceList, { name: newName, price: priceNum, icon: newIcon }];
    setApplianceList(updatedList);
    localStorage.setItem('shoptrack_appliances', JSON.stringify(updatedList));

    // Initialize inventory for new item
    if (!(newName in inventory)) {
      const updatedInventory = { ...inventory, [newName]: 0 };
      setInventory(updatedInventory);
      localStorage.setItem('shoptrack_inventory', JSON.stringify(updatedInventory));
    }

    setNewName('');
    setNewPrice('');
    setNewIcon('📦');
  };

  const handleRemove = (nameToRemove) => {
    const updatedList = applianceList.filter(a => a.name !== nameToRemove);
    setApplianceList(updatedList);
    localStorage.setItem('shoptrack_appliances', JSON.stringify(updatedList));
  };

  return (
    <div className="settings-wrapper">
      <div className="card">
        <div className="card-title">⚙️ Manage Product Categories</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
          Add or remove product categories. Adding a category here will make it available in the Billing and Inventory tabs.
        </p>

        <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: '24px' }}>
          <div className="form-group flex-1">
            <label className="form-label">Icon (Emoji)</label>
            <input 
              className="form-control" 
              value={newIcon} 
              onChange={e => setNewIcon(e.target.value)} 
              maxLength={2}
            />
          </div>
          <div className="form-group flex-2">
            <label className="form-label">Product Name</label>
            <input 
              className="form-control" 
              placeholder="e.g. Laptop"
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
            />
          </div>
          <div className="form-group flex-2">
            <label className="form-label">Default Price (₹)</label>
            <input 
              type="number"
              className="form-control" 
              placeholder="e.g. 50000"
              value={newPrice} 
              onChange={e => setNewPrice(e.target.value)} 
            />
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            ➕ Add Product
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Product Name</th>
              <th className="r">Default Price</th>
              <th className="c">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applianceList.map(item => (
              <tr key={item.name}>
                <td style={{ fontSize: '1.2rem' }}>{item.icon}</td>
                <td className="td-name">{item.name}</td>
                <td className="r">₹{item.price.toLocaleString('en-IN')}</td>
                <td className="c">
                  <button className="btn btn-danger-ghost btn-sm" onClick={() => handleRemove(item.name)}>
                    ✕ Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
