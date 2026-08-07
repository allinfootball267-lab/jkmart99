import React, { useState } from 'react';
import { Shield, FileText, RefreshCw, Truck, Mail, Store } from 'lucide-react';

type TabType = 'terms' | 'privacy' | 'refunds' | 'shipping' | 'contact';

export default function TermsAndPolicies() {
  const [activeTab, setActiveTab] = useState<TabType>('terms');

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

      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 md:p-8 prose prose-slate max-w-none">
        {activeTab === 'terms' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Terms & Conditions</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Welcome to JKmart 99. By accessing our website and placing orders, you agree to comply with and be bound by the following terms and conditions.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">1. Ordering and Guest Checkout</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              We offer guest checkout for your convenience. It is your responsibility to provide accurate billing, shipping, and contact details. Incorrect details may result in delivery delays or cancellation.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">2. Pricing and Availability</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              All prices listed on the website are in Indian Rupees (INR) and are inclusive of local taxes where applicable. Delivery charges are calculated dynamically at checkout. We reserve the right to modify prices and withdraw products due to stock availability.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3. Payment Methods</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              We accept payments via Cash on Delivery (COD) and online UPI/QR Code payments via Razorpay. All online transactions are processed securely through payment gateway integration.
            </p>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Privacy Policy</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              At JKmart 99, we value your privacy and are committed to protecting your personal information.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Information We Collect</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              When you purchase a product using guest checkout, we collect your name, phone number, physical address, city, and pin code to fulfill your order.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">How We Use Your Information</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Your details are used solely to deliver the products you ordered, communicate updates about your order status, and process secure payments. We do not sell or share your data with third-party advertisers.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Security</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              All information is securely stored inside database environments protected by Row Level Security policies.
            </p>
          </div>
        )}

        {activeTab === 'refunds' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Refund & Cancellation Policy</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We strive to make shopping at JKmart 99 a seamless experience. Please read our guidelines on cancellations and refunds:
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">1. Cancellations</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              You can request to cancel your order within 2 hours of placing it. Please call or WhatsApp us on our store phone number immediately for cancellation. Once an order is marked as 'Shipped', it cannot be cancelled.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">2. Returns & Replacements</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Returns are only accepted if the product delivered is damaged, defective, or incorrect. You must raise a claim within 24 hours of delivery by providing images/videos of the package and receipt via WhatsApp.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3. Refunds</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Once a return request is approved, we will pick up the item and initiate a refund. Online prepaid payments (Razorpay) will be refunded to the original source account within 5-7 business days. For COD orders, we will transfer the amount via UPI.
            </p>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Shipping & Delivery Policy</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We aim to deliver products safely and efficiently directly to your doorstep.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">1. Delivery Timeline</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              We offer fast local delivery. Most orders are processed within 24 hours and delivered within 1 to 3 business days depending on your city and local pin code.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">2. Delivery Charges</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              A flat delivery fee is applied based on settings configured by the administrator (standard charge is ₹50). The exact charge is visible on the order checkout page prior to finalizing your purchase.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3. Tracking</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Once your order status changes, we will send an SMS or WhatsApp confirmation with delivery details.
            </p>
          </div>
        )}

        {activeTab === 'contact' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Contact Us</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              If you have any questions, feedback, or complaints regarding orders, payments, or cancellations, please reach out to us:
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Store className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900">JKmart 99</h4>
                  <p className="text-slate-600 text-sm">Neighborhood Electronics Store</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900">Email support</h4>
                  <p className="text-slate-600 text-sm">support@jkmart99.com</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
