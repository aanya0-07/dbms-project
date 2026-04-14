import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  // 1. STATE MANAGEMENT
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [selectedItem, setSelectedItem] = useState('Refrigerator');
  const [quantity, setQuantity] = useState(1);

  // 2. FIXED APPLIANCE DATA
  const applianceList = [
    { name: 'Refrigerator', price: 45000 },
    { name: 'Washing Machine', price: 32000 },
    { name: 'Microwave Oven', price: 15000 },
    { name: 'Air Conditioner', price: 55000 },
    { name: 'LED TV', price: 48000 }
  ];

  // 3. API CALLS (TALKING TO INTELLIJ)
  const fetchBill = async () => {
    const response = await axios.get('http://localhost:8080/api/products');
    setProducts(response.data);
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/products/history');
      setSalesHistory(response.data);
    } catch (error) {
      console.error("Error loading history", error);
    }
  };

  useEffect(() => {
    fetchBill();
    fetchHistory();
  }, []);

  // 4. BUTTON LOGIC
  const addToBill = async () => {
    try {
      await axios.post('http://localhost:8080/api/products/validate-and-add', { 
        name: selectedItem,
        quantity: quantity
      });
      fetchBill();
      setQuantity(1);
    } catch (error) {
      alert("Error adding to bill. Check if Java is running!");
    }
  };

  const saveAndCheckout = async () => {
    if (products.length === 0) return alert("Add items to the bill first!");

    const summary = products.map(p => p.name).join(", ");
    const total = products.reduce((s, i) => s + i.price, 0);
    
    try {
      await axios.post('http://localhost:8080/api/products/save-final-bill', {
          summary: summary,
          total: total
      });
      alert("✅ Transaction Completed & Saved to History!");
      fetchBill();    // Clears the active screen
      fetchHistory(); // Updates the history table below
    } catch (error) {
      alert("Save failed. Check console for details.");
    }
  };

  const deleteProduct = async (id) => {
    await axios.delete(`http://localhost:8080/api/products/${id}`);
    fetchBill();
  };

  const handlePrint = () => window.print();

  // 5. THE USER INTERFACE
  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <style>
        {`
          @media print { .no-print { display: none !important; } }
          .col-desc { width: 45%; }
          .col-qty { width: 15%; text-align: center; }
          .col-uprice { width: 20%; text-align: right; }
          .col-total { width: 20%; text-align: right; }
          th { border-bottom: 2px solid #333; padding: 10px 0; }
        `}
      </style>

      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>⚡ Spark Electronics Ltd.</h1>
      <p style={{ textAlign: 'center', color: '#7f8c8d' }} className="no-print">Premium Appliances Management System</p>

      {/* INPUT SECTION */}
      <div className="no-print" style={{ backgroundColor: '#f4f7f6', padding: '20px', borderRadius: '10px', display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div style={{ flex: 2 }}>
          <label>Select Appliance:</label>
          <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
            {applianceList.map(item => <option key={item.name} value={item.name}>{item.name} (₹{item.price})</option>)}
          </select>
        </div>
        
        <div style={{ flex: 1 }}>
          <label>Quantity:</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
        </div>

        <button onClick={addToBill} style={{ padding: '10px 25px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', height: '40px', fontWeight: 'bold' }}>
          Add Item
        </button>
      </div>

      {/* ACTIVE BILL TABLE */}
      <div style={{ minHeight: '300px' }}>
        <div style={{ display: 'flex', fontWeight: 'bold', borderBottom: '2px solid #2c3e50', paddingBottom: '10px' }}>
          <span className="col-desc">ITEM DESCRIPTION</span>
          <span className="col-qty">QTY</span>
          <span className="col-uprice">UNIT PRICE</span>
          <span className="col-total">TOTAL</span>
        </div>

        {products.map(p => {
          const unitPrice = applianceList.find(a => p.name.includes(a.name))?.price || 0;
          return (
            <div key={p.id} style={{ display: 'flex', padding: '15px 0', borderBottom: '1px solid #eee', alignItems: 'center' }}>
              <span className="col-desc">
                {p.name.split(" (x")[0]}
                <button onClick={() => deleteProduct(p.id)} className="no-print" style={{ marginLeft: '10px', color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>(Remove)</button>
              </span>
              <span className="col-qty">{p.stockQty}</span>
              <span className="col-uprice">₹{unitPrice.toLocaleString('en-IN')}</span>
              <span className="col-total">₹{p.price.toLocaleString('en-IN')}</span>
            </div>
          );
        })}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <h2>Grand Total: ₹{products.reduce((s, i) => s + i.price, 0).toLocaleString('en-IN')}</h2>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="no-print" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <button onClick={handlePrint} style={{ flex: 1, padding: '15px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          🖨️ PRINT INVOICE
        </button>
        <button onClick={saveAndCheckout} style={{ flex: 1, padding: '15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          💾 FINALIZE & SAVE SALE
        </button>
      </div>

      {/* SALES HISTORY - ADMIN LOG */}
      <div className="no-print" style={{ marginTop: '80px', borderTop: '5px double #2c3e50', paddingTop: '30px' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>📜 Past Sales Audit Log (Database Records)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #2c3e50' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Transaction ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Summary</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {salesHistory.map(sale => (
              <tr key={sale.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{new Date(sale.saleDate).toLocaleDateString()}</td>
                <td style={{ padding: '10px', fontFamily: 'monospace' }}>{sale.transactionId}</td>
                <td style={{ padding: '10px', fontSize: '13px' }}>{sale.itemsSummary}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>
                  ₹{sale.totalAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;