import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function W9RequestModal({
  open,
  onClose,
  w9Form,
  setW9Form,
  w9Error,
  isRequestingW9,
  onRequest,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/60 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-gray-200">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Request W9 Tax Form</h2>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="First Name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
              value={w9Form.firstName}
              onChange={e => setW9Form(f => ({ ...f, firstName: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">Enter your legal first name as shown on your government ID.</p>
          </div>
          <div>
            <input
              type="text"
              placeholder="Last Name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
              value={w9Form.lastName}
              onChange={e => setW9Form(f => ({ ...f, lastName: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">Enter your legal last name as shown on your government ID.</p>
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
              value={w9Form.email}
              onChange={e => setW9Form(f => ({ ...f, email: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">Enter the email address where you want to receive the W9 form.</p>
          </div>
          <div>
            <input
              type="text"
              placeholder="Phone Number"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
              value={w9Form.phone}
              onChange={e => setW9Form(f => ({ ...f, phone: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">Enter your mobile phone number (for manager contact if needed).</p>
          </div>
          {w9Error && <p className="text-xs text-red-500 text-center">{w9Error}</p>}
          <button
            className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            disabled={
              isRequestingW9 ||
              !w9Form.firstName.trim() ||
              !w9Form.lastName.trim() ||
              !w9Form.email.trim() ||
              !w9Form.phone.trim()
            }
            onClick={onRequest}
          >
            {isRequestingW9 ? "Sending..." : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}
