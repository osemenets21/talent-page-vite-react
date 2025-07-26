import React, { useState } from "react";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";

export default function TalentForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    instagram: "",
    facebook: "",
    soundcloud: "",
    spotify: "",
    performerName: "",
    city: "",
    country: "USA",
    bio: "",
    role: "DJ",
    roleOther: "",
    paymentMethod: "Venmo",
    venmo: "",
    zelle: "",
  });

  const [portfolio, setPortfolio] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [taxForm, setTaxForm] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!portfolio || !photo || !taxForm) return alert("Upload all required files!");

    const files = [
      { file: portfolio, label: "portfolio" },
      { file: photo, label: "photo" },
      { file: taxForm, label: "tax" },
    ];

    try {
      for (let f of files) {
        const storageRef = ref(storage, `uploads/${f.label}_${Date.now()}_${f.file.name}`);
        await uploadBytes(storageRef, f.file);
      }
      alert("Talent profile submitted!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 mt-4 mb-4">
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white shadow ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Public Performer Profile</h2>

          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
            {/* First/Last Name */}
            <Input label="First Name" id="firstName" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
            <Input label="Last Name" id="lastName" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
            {/* Performer Name */}
            <Input label="Stage / Performer Name" id="performerName" value={form.performerName} onChange={(v) => setForm({ ...form, performerName: v })} className="sm:col-span-3" />
            {/* Role */}
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-900">Your Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option>DJ</option>
                <option>Drag Queen</option>
                <option>Dancer</option>
                <option>Host</option>
                <option>Other</option>
              </select>
              {form.role === "Other" && (
                <input
                  type="text"
                  placeholder="Specify your role"
                  value={form.roleOther}
                  onChange={(e) => setForm({ ...form, roleOther: e.target.value })}
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm"
                />
              )}
            </div>
            {/* Socials */}
            <Input label="Instagram" id="instagram" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} className="sm:col-span-2" />
            <Input label="Facebook" id="facebook" value={form.facebook} onChange={(v) => setForm({ ...form, facebook: v })} className="sm:col-span-2" />
            <Input label="SoundCloud" id="soundcloud" value={form.soundcloud} onChange={(v) => setForm({ ...form, soundcloud: v })} className="sm:col-span-2" />
            <Input label="Spotify" id="spotify" value={form.spotify} onChange={(v) => setForm({ ...form, spotify: v })} className="sm:col-span-2" />
            {/* City / Country */}
            <Input label="City of Origin" id="city" value={form.city} onChange={(v) => setForm({ ...form, city: v })} className="sm:col-span-3" />
            <Input label="Country" id="country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} className="sm:col-span-3" />
            {/* BIO */}
            <div className="sm:col-span-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-900">BIO</label>
              <textarea
                maxLength={200}
                rows={3}
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600"
              />
              <p className="text-xs text-gray-500 text-right">{form.bio.length}/200</p>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-t border-gray-300" />

          {/* Private Info */}
          <h3 className="text-lg font-medium text-gray-900">Private Info</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
            <Input label="Phone" id="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
            <Input label="Email" id="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />

            {/* Payment Method */}
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-900">Form of Payment</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600"
              >
                <option>Venmo</option>
                <option>Zelle</option>
              </select>
            </div>
            {form.paymentMethod === "Venmo" && (
              <Input label="Venmo Name" id="venmo" value={form.venmo} onChange={(v) => setForm({ ...form, venmo: v })} className="sm:col-span-3" required />
            )}
            {form.paymentMethod === "Zelle" && (
              <Input label="Zelle Email or Phone" id="zelle" value={form.zelle} onChange={(v) => setForm({ ...form, zelle: v })} className="sm:col-span-3" required />
            )}
          </div>

          {/* Upload Files */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <FileUpload label="Upload Portfolio (PDF)" accept=".pdf" setFile={setPortfolio} />
            <FileUpload label="Upload Photo" accept="image/*" setFile={setPhoto} />
            <FileUpload label="Upload Tax Form (PDF)" accept=".pdf" setFile={setTaxForm} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
          <button type="submit" className="rounded-md px-4 py-2 text-sm font-semibold text-black hover:bg-indigo-500">
            Submit Talent Profile
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper components
function Input({ label, id, value, onChange, className = "", required = false }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">{label}</label>
      <div className="mt-2">
        <input
          type="text"
          id={id}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600"
        />
      </div>
    </div>
  );
}

function FileUpload({ label, accept, setFile }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-4 py-6">
      <DocumentArrowUpIcon className="h-10 w-10 text-gray-400" />
      <label className="mt-4 cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-500">
        {label}
        <input type="file" accept={accept} onChange={(e) => setFile(e.target.files[0])} className="sr-only" />
      </label>
    </div>
  );
}
