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

  const handleCheckout = async () => {
    if (products.length === 0) { showToast('Add items to the bill before checking out.', 'warning'); return; }

    const summary = products.map(p => p.name).join(', ');
    const total   = products.reduce((s, i) => s + i.price, 0);

    try {
      await axios.post(`${API}/products/save-final-bill`, {
          summary: summary,
          total: total
      });
      alert("✅ Transaction Completed & Saved to History!");
      fetchProducts();    // Clears the active screen
      fetchHistory(); // Updates the history table below
    } catch (error) {
      console.error('Checkout error:', error.response?.data || error.message);
      alert("Checkout failed: " + (error.response?.data?.message || error.message));
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
