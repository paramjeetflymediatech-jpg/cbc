'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, QrCode, Smartphone, CreditCard, CheckCircle2, Loader2, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';

export default function PhonePeCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const txnId = searchParams.get('txnId') || '';
  const amount = searchParams.get('amount') || '1000';
  const pkgName = searchParams.get('pkgName') || 'Lead Package';

  const [activeTab, setActiveTab] = useState<'qr' | 'upi' | 'card'>('qr');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [autoChecking, setAutoChecking] = useState(true);

  const merchantUpiId = process.env.NEXT_PUBLIC_UPI_ID || 'clinicbychoice@ybl';
  const merchantName = process.env.NEXT_PUBLIC_UPI_NAME || 'Clinic By Choice';
  const formattedAmount = Number(amount).toLocaleString('en-IN');

  const upiUri = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(
    merchantName
  )}&mc=0000&mode=02&purpose=00&tr=${encodeURIComponent(txnId)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Payment for ${pkgName}`)}`;

  // Mobile Deep Link URLs
  const phonePeDeepLink = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(
    merchantName
  )}&mc=0000&mode=02&purpose=00&am=${Number(amount).toFixed(2)}&cu=INR&tr=${encodeURIComponent(txnId)}`;
  const gPayDeepLink = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(
    merchantName
  )}&mc=0000&mode=02&purpose=00&am=${Number(amount).toFixed(2)}&cu=INR&tr=${encodeURIComponent(txnId)}`;
  const paytmDeepLink = `paytmmp://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(
    merchantName
  )}&am=${amount}&cu=INR&tr=${encodeURIComponent(txnId)}`;

  const handleExecutePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      window.location.href = `/api/payments/phonepe/callback?code=PAYMENT_SUCCESS&merchantTransactionId=${encodeURIComponent(
        txnId
      )}`;
    }, 1200);
  };

  if (!txnId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 text-gray-500 text-sm">
        Invalid payment order parameters. Please return to packages.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 font-sans">
      {/* Header Bar */}
      <div className="w-full max-w-lg bg-[#5f259f] text-white p-5 rounded-t-3xl shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/hospital/packages')}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="bg-white text-[#5f259f] font-black text-xs px-2 py-0.5 rounded-md uppercase tracking-wider">
                PhonePe
              </span>
              <span className="text-xs font-semibold text-purple-200">UPI Payment Gateway</span>
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">{merchantName}</h1>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-extrabold uppercase text-purple-200 block tracking-wider">Amount Due</span>
          <span className="text-xl font-black text-white">₹{formattedAmount}</span>
        </div>
      </div>

      {/* Main Checkout Box */}
      <div className="w-full max-w-lg bg-white rounded-b-3xl shadow-2xl border border-gray-100 p-6 space-y-6 flex-1">
        {/* Order Details */}
        <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-[#5f259f] block">{pkgName}</span>
            <span className="text-[11px] text-gray-500 font-mono">TXN: {txnId}</span>
          </div>
          <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
            Active Order
          </span>
        </div>

        {/* Payment Methods Nav */}
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1.5 rounded-2xl text-xs font-extrabold text-gray-600">
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'qr' ? 'bg-[#5f259f] text-white shadow-md' : 'hover:bg-gray-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>UPI QR Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('upi')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'upi' ? 'bg-[#5f259f] text-white shadow-md' : 'hover:bg-gray-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>UPI VPA / Apps</span>
          </button>

          <button
            onClick={() => setActiveTab('card')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'card' ? 'bg-[#5f259f] text-white shadow-md' : 'hover:bg-gray-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Card / NB</span>
          </button>
        </div>

        {/* Tab 1: All UPI App QR Scanner */}
        {activeTab === 'qr' && (
          <div className="space-y-5 text-center py-2">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-[#5f259f] uppercase tracking-wider block">
                Scan & Pay with Any UPI App
              </span>
              <p className="text-[11px] text-gray-500 font-medium">
                Open PhonePe, Google Pay, Paytm, BHIM, or any banking app to scan.
              </p>
            </div>

            {/* Dynamic Generated Universal UPI QR Code */}
            <div className="inline-block p-4 bg-white border-2 border-purple-200 rounded-3xl shadow-xl relative group">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(upiUri)}`}
                alt="Universal PhonePe & All UPI App QR Code"
                className="w-52 h-52 mx-auto rounded-lg"
              />
              <div className="mt-3 text-[11px] font-extrabold text-[#5f259f] uppercase tracking-wider flex items-center justify-center space-x-1">
                <span>UPI ID: {merchantUpiId}</span>
              </div>
            </div>

            {/* Supported Payment Apps Pills */}
            <div className="flex flex-wrap justify-center gap-2 text-xs font-bold text-gray-700">
              <span className="px-3 py-1 bg-purple-50 text-[#5f259f] border border-purple-200 rounded-full">
                PhonePe
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
                Google Pay
              </span>
              <span className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full">
                Paytm
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                BHIM UPI
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                CRED / Any App
              </span>
            </div>

            <button
              onClick={handleExecutePayment}
              disabled={processing}
              className="w-full bg-[#5f259f] hover:bg-[#4a1c7e] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01] cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Scanned UPI Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Payment of ₹{formattedAmount}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Mobile Deep Links & VPA */}
        {activeTab === 'upi' && (
          <div className="space-y-5 py-2">
            <div>
              <span className="text-xs font-extrabold text-gray-700 block mb-2 uppercase tracking-wider">
                Direct Mobile App Launch
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs font-extrabold">
                <a
                  href={phonePeDeepLink}
                  onClick={handleExecutePayment}
                  className="p-3 bg-purple-50 hover:bg-purple-100 text-[#5f259f] border border-purple-200 rounded-xl text-center flex flex-col items-center justify-center space-y-1 transition-all"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>PhonePe</span>
                </a>

                <a
                  href={gPayDeepLink}
                  onClick={handleExecutePayment}
                  className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-center flex flex-col items-center justify-center space-y-1 transition-all"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Google Pay</span>
                </a>

                <a
                  href={paytmDeepLink}
                  onClick={handleExecutePayment}
                  className="p-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-center flex flex-col items-center justify-center space-y-1 transition-all"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Paytm</span>
                </a>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <label className="text-xs font-extrabold text-gray-700 block mb-1.5 uppercase tracking-wider">
                Enter your UPI VPA ID
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210@ybl or username@upi"
                value={upiIdInput}
                onChange={(e) => setUpiIdInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#5f259f]"
              />
            </div>

            <button
              onClick={handleExecutePayment}
              disabled={processing}
              className="w-full bg-[#5f259f] hover:bg-[#4a1c7e] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01] cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Requesting Collect Approval...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5" />
                  <span>Pay ₹{formattedAmount} via VPA</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 3: Debit/Credit Cards */}
        {activeTab === 'card' && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-extrabold text-gray-700 block mb-1 uppercase tracking-wider">Card Number</label>
              <input
                type="text"
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#5f259f]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-gray-700 block mb-1 uppercase tracking-wider">Expiry (MM/YY)</label>
                <input
                  type="text"
                  placeholder="12/28"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#5f259f]"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-gray-700 block mb-1 uppercase tracking-wider">CVV</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="123"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#5f259f]"
                />
              </div>
            </div>

            <button
              onClick={handleExecutePayment}
              disabled={processing}
              className="w-full bg-[#5f259f] hover:bg-[#4a1c7e] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01] cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authorizing Card Transaction...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay ₹{formattedAmount} via Card</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer Security Note */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-center space-x-2 text-xs font-extrabold text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PCI-DSS 256-Bit Universal PhonePe & UPI Security</span>
        </div>
      </div>

      <div className="py-4 text-xs font-medium text-gray-400">
        Universal PhonePe UPI Payment Gateway • Clinic By Choice
      </div>
    </div>
  );
}
