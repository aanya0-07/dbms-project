import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

import { Toast, useToast } from './components/Toast';
import { BillingTab }      from './components/BillingTab';
import { InventoryTab }    from './components/InventoryTab';
import { HistoryTab }      from './components/HistoryTab';
import { SettingsTab }     from './components/SettingsTab';
import { generateBillNumber } from './utils/CouponManager';

const API = 'http://localhost:8080/api';

// Configure axios for better network handling
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

const APPLIANCE_LIST = [
  { name: 'Refrigerator', icon: '🧊', price: 25000 },
  { name: 'Washing Machine', icon: '🌊', price: 18000 },
  { name: 'Microwave Oven', icon: '🔥', price: 8000 },
  { name: 'Air Conditioner', icon: '❄️', price: 35000 },
  { name: 'LED TV', icon: '📺', price: 22000 },
];

const EMPTY_INVENTORY = {
  'Refrigerator': 0, 'Washing Machine': 0,
  'Microwave Oven': 0, 'Air Conditioner': 0, 'LED TV': 0,
};

const DEFAULT_SETTINGS = {
  storeName: 'Spark Electronics',
  ownerName: '',
  phone: '',
  email: '',
  address: '',
  cityState: '',
  gst: '',
  paymentMethods: ['cash', 'card'],
  coupons: {},
  newCouponCode: '',
  newCouponDiscount: 0,
};

const NAV = [
  { id: 'bill',      label: 'Billing',   icon: '🧾' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'history',   label: 'History',   icon: '📜' },
  { id: 'settings',  label: 'Settings',  icon: '⚙️' },
];

function App() {
  // ── STATE ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('bill');
  const [products, setProducts]   = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [inventory, setInventory] = useState(EMPTY_INVENTORY);
  const [billNumber, setBillNumber] = useState(generateBillNumber());
  const [applianceList, setApplianceList] = useState(() => {
    const saved = localStorage.getItem('shoptrack_appliances');
    return saved ? JSON.parse(saved) : APPLIANCE_LIST;
  });

  // Store Settings
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('shoptrack_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Billing inputs
  const [selectedItem, setSelectedItem] = useState('Refrigerator');
  const [quantity, setQuantity]         = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [discountRate, setDiscountRate] = useState(0);

  // Inventory edit state
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue]     = useState(0);

  const { toasts, showToast, removeToast } = useToast();

  // ── DATA FETCHING ──────────────────────────────────
  const checkBackendHealth = async () => {
    try {
      const response = await axios.get(`${API}/products`, { timeout: 5000 });
      console.log('✅ Backend is connected');
      return true;
    } catch (err) {
      console.error('❌ Backend connection failed:', err.message);
      showToast('⚠️ Backend not reachable. Make sure Spring Boot is running on http://localhost:8080', 'warning');
      return false;
    }
  };

  const fetchProducts = async () => {
    try { 
      const r = await axios.get(`${API}/products`); 
      setProducts(r.data); 
    }
    catch (err) { 
      console.error('Error fetching products:', err.message); 
    }
  };

  const fetchHistory = async () => {
    try { 
      const r = await axios.get(`${API}/products/history`); 
      setSalesHistory(r.data); 
    }
    catch (err) { 
      console.error('Error loading history:', err.message); 
    }
  };

  const fetchInventory = async () => {
    try {
      const r = await axios.get(`${API}/inventory`);
      setInventory(r.data);
    } catch {
      const saved = localStorage.getItem('shoptrack_inventory');
      if (saved) setInventory(JSON.parse(saved));
    }
  };

  useEffect(() => {
    console.log('App initialized. Checking backend connection...');
    checkBackendHealth();
    fetchProducts();
    fetchHistory();
    fetchInventory();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('shoptrack_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  // Save appliances to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('shoptrack_appliances', JSON.stringify(applianceList));
  }, [applianceList]);

  // ── BILLING ACTIONS ────────────────────────────────
  const handleAddToBill = async () => {
    const stock = inventory[selectedItem] || 0;
    if (stock === 0) { showToast(`${selectedItem} is out of stock.`, 'error'); return; }
    if (stock < quantity) { showToast(`Only ${stock} unit(s) available for ${selectedItem}.`, 'warning'); return; }
    try {
      await axios.post(`${API}/products/validate-and-add`, { name: selectedItem, quantity });
      fetchProducts();
      setQuantity(1);
      showToast(`${selectedItem} × ${quantity} added to bill.`, 'success');
    } catch (error) {
      console.error('Add to bill error:', error.response?.data || error.message);
      showToast(`Error: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleRemove = async (id) => {
    try { 
      await axios.delete(`${API}/products/${id}`); 
      fetchProducts(); 
    }
    catch (error) { 
      console.error('Remove error:', error.response?.data || error.message);
      showToast('Could not remove item: ' + error.message, 'error'); 
    }
  };

  const handlePrint = () => window.print();

  // Generate and download bill as PDF
  const generateAndDownloadBill = () => {
    if (products.length === 0) return;

    // Calculate totals
    const subtotal = products.reduce((s, i) => {
      const baseName = i.name.split(' (x')[0];
      const unit = applianceList.find(a => baseName.includes(a.name));
      return s + ((unit?.price || 0) * (i.stockQty || 1));
    }, 0);
    
    const discountAmt = subtotal * (discountRate / 100);
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = afterDiscount * (taxRate / 100);
    const finalTotal = afterDiscount + taxAmt;
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');

    // Generate bill HTML content
    const billHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid #333; padding-bottom: 15px;">
          <h1 style="margin: 0; font-size: 28px; color: #000;">⚡ ${storeSettings.storeName || 'Spark Electronics'}</h1>
          <p style="margin: 8px 0; color: #000; font-size: 12px;">
            ${storeSettings.address ? storeSettings.address + ' | ' : ''}${storeSettings.cityState || ''}
          </p>
          <p style="margin: 4px 0; color: #000; font-size: 12px;">
            ${storeSettings.phone ? '📞 ' + storeSettings.phone : ''}${storeSettings.email ? ' | ' + storeSettings.email : ''}
          </p>
          ${storeSettings.gst ? `<p style="margin: 4px 0; color: #000; font-size: 12px;">GST: ${storeSettings.gst}</p>` : ''}
        </div>

        <!-- Bill Number and Date -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px;">
          <div>
            <p style="margin: 4px 0;"><strong>Bill #:</strong> ${billNumber}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${currentDate}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${currentTime}</p>
          </div>
        </div>

        <!-- Customer Information -->
        <div style="background-color: #f9f9f9; padding: 12px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #000;">Customer Information</h3>
          <table style="width: 100%; font-size: 12px; color: #000;">
            <tr>
              <td style="padding: 4px 0;"><strong>Name:</strong></td>
              <td style="padding: 4px 0;">${customerName || 'Not Provided'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Phone:</strong></td>
              <td style="padding: 4px 0;">${customerPhone || 'Not Provided'}</td>
            </tr>
          </table>
        </div>

        <!-- Items Table -->
        <h3 style="font-size: 14px; margin: 15px 0 10px 0; color: #000;">Items Purchased</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <thead>
            <tr style="background-color: #f0f0f0; border-bottom: 2px solid #333;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Item</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Unit Price</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((p, idx) => {
              const baseName = p.name.split(' (x')[0];
              const unit = applianceList.find(a => p.name.includes(a.name));
              const unitPrice = unit?.price || 0;
              const qty = p.stockQty || 1;
              const itemTotal = unitPrice * qty;
              return `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px; border: 1px solid #ddd;">${unit?.icon || ''} ${baseName}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${qty}</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">₹${unitPrice.toLocaleString('en-IN')}</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;">₹${itemTotal.toLocaleString('en-IN')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Totals Section -->
        <table style="width: 100%; margin-bottom: 20px; font-size: 12px; margin-left: auto; margin-right: 0; border-collapse: collapse;">
          <tr style="border-top: 1px solid #ddd;">
            <td style="padding: 8px 0; text-align: right; width: 200px;">Subtotal</td>
            <td style="padding: 8px 0 8px 15px; text-align: right; font-weight: bold; border-bottom: 1px solid #ddd;">₹${subtotal.toLocaleString('en-IN')}</td>
          </tr>
          ${discountRate > 0 ? `
            <tr>
              <td style="padding: 8px 0; text-align: right;">Discount (${discountRate}%)</td>
              <td style="padding: 8px 0 8px 15px; text-align: right; color: #000; font-weight: bold;">-₹${discountAmt.toLocaleString('en-IN')}</td>
            </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; text-align: right;">Subtotal after Discount</td>
            <td style="padding: 8px 0 8px 15px; text-align: right; font-weight: bold;">₹${afterDiscount.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; text-align: right;">Tax/GST (${taxRate}%)</td>
            <td style="padding: 8px 0 8px 15px; text-align: right; font-weight: bold;">+₹${taxAmt.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-top: 3px solid #333; border-bottom: 3px solid #333;">
            <td style="padding: 12px 0; text-align: right; font-size: 16px; font-weight: bold;">Grand Total</td>
            <td style="padding: 12px 0 12px 15px; text-align: right; font-weight: bold; font-size: 18px; color: #000;">₹${finalTotal.toLocaleString('en-IN')}</td>
          </tr>
        </table>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #000;">
          <p style="margin: 0;">Thank you for your purchase!</p>
          <p style="margin: 5px 0 0 0;">This is a computer-generated receipt. No signature required.</p>
        </div>
      </div>
    `;

    // Create a temporary element to hold the HTML
    const element = document.createElement('div');
    element.innerHTML = billHTML;

    // Configure PDF options
    const options = {
      margin: 8,
      filename: `Bill_${billNumber}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate and download PDF
    html2pdf().set(options).from(element).save();
  };

  const handleCheckout = async () => {
    if (products.length === 0) { showToast('Add items to the bill before checking out.', 'warning'); return; }

    const summary = products.map(p => p.name).join(', ');
    const total   = products.reduce((s, i) => s + i.price, 0);

    try {
      // Download bill as PDF first
      generateAndDownloadBill();
      
      // Then save to history
      await axios.post(`${API}/products/save-final-bill`, {
          summary: summary,
          total: total
      });
      showToast('✅ Bill downloaded & transaction saved to history!', 'success');
      setProducts([]); // Clear the bill
      setCustomerName(''); // Clear customer details
      setCustomerPhone('');
      setBillNumber(generateBillNumber()); // Generate next bill number
      fetchHistory(); // Updates the history table
    } catch (error) {
      console.error('Checkout error:', error.response?.data || error.message);
      showToast('Checkout failed: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const deleteProduct = async (id) => {
    await axios.delete(`${API}/products/${id}`);
    fetchProducts();
  };

  // ── INVENTORY ACTIONS ──────────────────────────────
  const persistInventory = async (itemName, newStock) => {
    const updated = { ...inventory, [itemName]: Math.max(0, newStock) };
    setInventory(updated);
    localStorage.setItem('shoptrack_inventory', JSON.stringify(updated));
    try { await axios.put(`${API}/inventory/${itemName}`, { stock: updated[itemName] }); }
    catch { /* persisted locally */ }
  };

  const handleAdjust = (name, delta) => {
    persistInventory(name, (inventory[name] || 0) + delta);
  };

  const handleSetExact = (name, value) => {
    persistInventory(name, value);
    setEditingItem(null);
  };

  // ── RENDER ─────────────────────────────────────────
  const PAGE_TITLES = {
    bill:      { title: '🧾 Billing',          sub: 'Create and manage the current customer bill' },
    inventory: { title: '📦 Inventory',        sub: 'Monitor and adjust stock levels' },
    history:   { title: '📜 Sales History',    sub: 'Review past transactions and revenue' },
    settings:  { title: '⚙️ Settings',          sub: 'Configure store information and payment methods' },
  };

  return (
    <div className="app-layout">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── SIDEBAR ── */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">⚡ Spark Electronics</div>
          <div className="brand-sub">Inventory & Billing System</div>
        </div>

        <div className="sidebar-nav">
          {NAV.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
              {id === 'bill' && products.length > 0 && (
                <span className="nav-badge">{products.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          v1.0 · Spark Electronics
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="main-content">
        <div className="page-header">
          <h2>{PAGE_TITLES[activeTab].title}</h2>
          <p>{PAGE_TITLES[activeTab].sub}</p>
        </div>

        {activeTab === 'bill' && (
          <BillingTab
            applianceList={APPLIANCE_LIST}
            products={products}
            inventory={inventory}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            onAddToBill={handleAddToBill}
            onRemove={handleRemove}
            onCheckout={handleCheckout}
            onPrint={handlePrint}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            taxRate={taxRate}
            setTaxRate={setTaxRate}
            discountRate={discountRate}
            setDiscountRate={setDiscountRate}
            billNumber={billNumber}
            storeSettings={storeSettings}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            applianceList={APPLIANCE_LIST}
            inventory={inventory}
            onAdjust={handleAdjust}
            onSetExact={handleSetExact}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            editValue={editValue}
            setEditValue={setEditValue}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab salesHistory={salesHistory} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            applianceList={applianceList}
            setApplianceList={setApplianceList}
            inventory={inventory}
            setInventory={setInventory}
          />
        )}
      </main>
    </div>
  );
}

export default App;
