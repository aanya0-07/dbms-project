import React from 'react';

function StockHint({ stock }) {
  if (stock === 0)  return <div className="stock-hint"><span className="stock-dot out"/><span style={{color:'var(--danger)'}}>Out of stock — cannot add to bill</span></div>;
  if (stock < 5)    return <div className="stock-hint"><span className="stock-dot low"/><span style={{color:'var(--warning)'}}>Only {stock} unit{stock>1?'s':''} left</span></div>;
  return              <div className="stock-hint"><span className="stock-dot in"/><span style={{color:'var(--success)'}}>{stock} units available</span></div>;
}

export function BillingTab({ 
  applianceList, products, inventory, quantity, setQuantity, 
  selectedItem, setSelectedItem, onAddToBill, onRemove, onCheckout, onPrint,
  customerName, setCustomerName, customerPhone, setCustomerPhone,
  taxRate, setTaxRate, discountRate, setDiscountRate
}) {
  const appliance = applianceList.find(a => a.name === selectedItem);
  const stock = inventory[selectedItem] || 0;
  const previewPrice = (appliance?.price || 0) * quantity;
  
  // Calculate total from frontend appliance list
  const subtotal = products.reduce((s, i) => {
    const baseName = i.name.split(' (x')[0];
    const unit = applianceList.find(a => baseName.includes(a.name));
    return s + ((unit?.price || 0) * (i.stockQty || 1));
  }, 0);
  
  const discountAmt = subtotal * (discountRate / 100);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = afterDiscount * (taxRate / 100);
  const finalTotal = afterDiscount + taxAmt;

  return (
    <>
      {/* ── CUSTOMER DETAILS ── */}
      <div className="card no-print">
        <div className="card-title">👥 Customer Details</div>
        <div className="form-row">
          <div className="form-group flex-2">
            <label className="form-label">Customer Name</label>
            <input 
              className="form-control" 
              placeholder="e.g. John Doe" 
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>
          <div className="form-group flex-2">
            <label className="form-label">Phone Number</label>
            <input 
              className="form-control" 
              placeholder="e.g. 9876543210" 
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── ADD ITEM PANEL ── */}
      <div className="card no-print">
        <div className="card-title">🛒 Add Item to Bill</div>
        <div className="form-row">
          <div className="form-group flex-2">
            <label className="form-label">Select Appliance</label>
            <select
              className="form-control"
              value={selectedItem}
              onChange={e => setSelectedItem(e.target.value)}
            >
              {applianceList.map(item => (
                <option key={item.name} value={item.name}>
                  {item.icon} {item.name} — ₹{item.price.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
            <StockHint stock={stock} />
          </div>

          <div className="form-group flex-1">
            <label className="form-label">Quantity</label>
            <div className="qty-stepper">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
              <input
                type="number" min="1" value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button onClick={() => setQuantity(q => q + 1)}>+</button>
            </div>
          </div>

          <button
            className="btn btn-success"
            onClick={onAddToBill}
            disabled={stock === 0}
            style={{ marginBottom: '1px' }}
          >
            {stock === 0 ? '🚫 Out of Stock' : '➕ Add to Bill'}
          </button>
        </div>

        {/* Price preview */}
        {stock > 0 && (
          <div className="price-preview">
            <span className="pp-label">
              {appliance?.icon} {selectedItem} × {quantity}
            </span>
            <span className="pp-amount">₹{previewPrice.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* ── CURRENT BILL ── */}
      <div className="card invoice-content" style={{ marginTop: 20 }}>
        <div className="card-title">🧾 Invoice</div>

        {/* Invoice Header for printing */}
        <div className="invoice-header-print" style={{ display: 'none' }}>
          <h2 style={{ marginBottom: '10px' }}>⚡ A3 Tech</h2>
          <p><strong>Customer:</strong> {customerName || 'N/A'}</p>
          <p><strong>Phone:</strong> {customerPhone || 'N/A'}</p>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <hr className="divider" style={{ margin: '15px 0' }} />
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <p>No items added yet</p>
            <span>Select an appliance above and click Add to Bill</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="c">Qty</th>
                    <th className="r">Unit Price</th>
                    <th className="r">Total</th>
                    <th className="c no-print">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const baseName = p.name.split(' (x')[0];
                    const unit = applianceList.find(a => p.name.includes(a.name));
                    const unitTotal = (unit?.price || 0) * (p.stockQty || 1);
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="td-name">{unit?.icon} {baseName}</span>
                        </td>
                        <td className="c">{p.stockQty || 1}</td>
                        <td className="r">₹{(unit?.price || 0).toLocaleString('en-IN')}</td>
                        <td className="r" style={{ color: 'var(--success)', fontWeight: 700 }}>
                          ₹{unitTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="c no-print">
                          <button className="btn btn-danger-ghost btn-sm" onClick={() => onRemove(p.id)}>
                            ✕ Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals Section */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <table style={{ width: '300px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px 0' }}>Subtotal</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>₹{subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="no-print">
                      <td style={{ padding: '8px 0' }}>Discount (%)</td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" className="form-control" style={{ width: '80px', padding: '4px', textAlign: 'right' }} value={discountRate} onChange={e => setDiscountRate(e.target.value)} />
                      </td>
                    </tr>
                    <tr style={{ display: 'none' }} className="print-only">
                      <td style={{ padding: '8px 0' }}>Discount ({discountRate}%)</td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-₹{discountAmt.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="no-print">
                      <td style={{ padding: '8px 0' }}>Tax / GST (%)</td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" className="form-control" style={{ width: '80px', padding: '4px', textAlign: 'right' }} value={taxRate} onChange={e => setTaxRate(e.target.value)} />
                      </td>
                    </tr>
                    <tr style={{ display: 'none' }} className="print-only">
                      <td style={{ padding: '8px 0' }}>Tax ({taxRate}%)</td>
                      <td style={{ textAlign: 'right' }}>+₹{taxAmt.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid var(--border)', fontSize: '1.2rem' }}>
                      <td style={{ padding: '12px 0', fontWeight: 700, color: 'var(--text-primary)' }}>Grand Total</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>₹{finalTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="action-bar no-print">
              <button className="btn btn-ghost" onClick={onPrint}>
                🖨️ Print Invoice
              </button>
              <button className="btn btn-warning" onClick={onCheckout}>
                ✅ Finalize &amp; Save
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
