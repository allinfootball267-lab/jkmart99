import { useState, useEffect } from 'react';
import { Shield, FileText, RefreshCw, Truck, Mail, Store, Phone, MapPin, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStoredStoreName } from '../lib/utils';

type TabType = 'terms' | 'privacy' | 'refunds' | 'shipping' | 'contact';

export default function TermsAndPolicies() {
  const [activeTab, setActiveTab] = useState<TabType>('terms');
  const [storeInfo, setStoreInfo] = useState({
    store_name: getStoredStoreName(),
    phone: '',
    whatsapp_number: '',
    address: '',
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase.from('settings').select('*').single();
        if (data) {
          setStoreInfo({
            store_name: data.store_name || getStoredStoreName(),
            phone: data.phone || '',
            whatsapp_number: data.whatsapp_number || '',
            address: data.address || '',
          });
        }
      } catch (err) {
        console.error('Error loading settings in policies:', err);
      }
    }

    loadSettings();
  }, []);

  const tabs = [
    { id: 'terms', name: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', name: 'Privacy Policy', icon: Shield },
    { id: 'refunds', name: 'Refund & Cancellation', icon: RefreshCw },
    { id: 'shipping', name: 'Shipping & Delivery', icon: Truck },
    { id: 'contact', name: 'Contact Us', icon: Mail }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 text-center">Store Policies & Terms</h1>
      
      <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-8 justify-center sm:justify-start">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all duration-200 outline-none ${
                isActive 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm prose max-w-none text-slate-600">
        {activeTab === 'terms' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Terms & Conditions</h2>
            <p className="leading-relaxed mb-4">
              Welcome to <strong>{storeInfo.store_name}</strong>. By accessing and using our website or placing an order, you agree to be bound by the following terms and conditions.
            </p>
            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">1. Orders & Pricing</h3>
            <p className="leading-relaxed mb-4">
              All orders are subject to acceptance and product availability. Prices for items are stated in Indian Rupees (₹) and include applicable taxes unless specified otherwise. We reserve the right to revise product listings, prices, and delivery charges at any time without prior notice.
            </p>
            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">2. Product Information & Accuracy</h3>
            <p className="leading-relaxed mb-4">
              We make every effort to display the colors, specifications, and details of our products accurately. However, actual packaging, colors, and materials may slightly vary.
            </p>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Privacy Policy</h2>
            <p className="leading-relaxed mb-4">
              At <strong>{storeInfo.store_name}</strong>, your privacy is of utmost importance to us. This Privacy Policy outlines how your personal data is collected, stored, and used.
            </p>
            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">Information We Collect</h3>
            <p className="leading-relaxed mb-4">
              When you place an order, we collect essential details such as your Name, Phone Number, Delivery Address, and PIN Code to fulfill and dispatch your items.
            </p>
          </div>
        )}

        {activeTab === 'refunds' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Refund & Cancellation Policy</h2>
            <p className="leading-relaxed mb-4">
              We want you to be completely delighted with your purchase. If you experience an issue with your delivered items, please review our refund and return guidelines below.
            </p>
            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">Damaged or Defective Items</h3>
            <p className="leading-relaxed mb-4">
              If an item is delivered in damaged or broken condition, please report it within 24 hours of delivery. We will arrange a replacement or full refund upon inspection.
            </p>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Shipping & Delivery Policy</h2>
            <p className="leading-relaxed mb-4">
              We provide fast and reliable delivery to ensure your products reach you safely and promptly.
            </p>
            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">Delivery Timelines</h3>
            <p className="leading-relaxed mb-4">
              Local deliveries are typically dispatched and delivered within 1–3 business days from order confirmation.
            </p>
          </div>
        )}

        {activeTab === 'contact' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Contact Us</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              If you have any questions, feedback, or complaints regarding orders, payments, or cancellations, please reach out to us:
            </p>
            <div className="space-y-4 not-prose">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Store className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900">{storeInfo.store_name}</h4>
                  <p className="text-slate-600 text-sm">Official Store</p>
                </div>
              </div>

              {storeInfo.phone && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Phone className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Phone Support</h4>
                    <a href={`tel:${storeInfo.phone}`} className="text-blue-600 text-sm hover:underline font-medium">
                      {storeInfo.phone}
                    </a>
                  </div>
                </div>
              )}

              {storeInfo.whatsapp_number && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <MessageSquare className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900">WhatsApp Support</h4>
                    <a
                      href={`https://wa.me/${storeInfo.whatsapp_number.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 text-sm hover:underline font-medium"
                    >
                      {storeInfo.whatsapp_number}
                    </a>
                  </div>
                </div>
              )}

              {storeInfo.address && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Store Address</h4>
                    <p className="text-slate-600 text-sm whitespace-pre-line">{storeInfo.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
