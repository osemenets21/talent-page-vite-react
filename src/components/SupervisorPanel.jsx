import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function SupervisorPanel() {
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all talent records from backend PHP endpoint (CORS safe)
    fetch("http://localhost:8000/backend/get_all_talent.php")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch talent data");
        return res.json();
      })
      .then((data) => {
        setTalents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handle delete
  const handleDelete = async (submissionId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("http://localhost:8000/backend/delete_talent.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId })
      });
      const result = await res.json();
      if (result.status === "success") {
        setTalents((prev) => prev.filter((t) => t.submissionId !== submissionId));
      } else {
        alert(result.message || "Delete failed");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setActionLoading(false);
  };

  // Handle edit
  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditForm({ ...talents[idx] });
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSave = async (submissionId) => {
    setActionLoading(true);
    const formData = new FormData();
    Object.entries(editForm).forEach(([key, value]) => {
      if (key !== "files" && key !== "updated_at" && key !== "timestamp") {
        formData.append(key, value);
      }
    });
    formData.append("submissionId", submissionId);
    try {
      const res = await fetch("http://localhost:8000/backend/edit_talent.php", {
        method: "POST",
        body: formData
      });
      const result = await res.json();
      if (result.status === "success") {
        setTalents((prev) => prev.map((t, idx) => idx === editIdx ? { ...editForm, files: t.files, updated_at: new Date().toISOString() } : t));
        setEditIdx(null);
      } else {
        alert(result.message || "Update failed");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setActionLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 relative">
      <div className="absolute top-3 right-3 z-10">
        <button onClick={handleLogout} title="Logout" type="button">
          <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-red-600 transition duration-150" />
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-orange-400 text-center">Supervisor Panel</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 shadow-lg rounded-lg">
          <thead className="bg-orange-100">
            <tr>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">#</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">First Name</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Last Name</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Phone</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Email</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Instagram</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Facebook</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">SoundCloud</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Spotify</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">YouTube</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Tiktok</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Performer Name</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">City</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Country</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Bio</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Role</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Role Other</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Payment Method</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Venmo</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Zelle</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Submission ID</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Files</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Timestamp</th>
              <th style={{width:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {talents.map((talent, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-orange-50"}>
                <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-700 font-bold">{idx + 1}</td>
                {editIdx === idx ? (
                  <>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="firstName" value={editForm.firstName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="lastName" value={editForm.lastName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="phone" value={editForm.phone} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="email" value={editForm.email} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="instagram" value={editForm.instagram} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="facebook" value={editForm.facebook} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="soundcloud" value={editForm.soundcloud} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="spotify" value={editForm.spotify} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="youtube" value={editForm.youtube} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="tiktok" value={editForm.tiktok} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="performerName" value={editForm.performerName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="city" value={editForm.city} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="country" value={editForm.country} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900 max-w-xs truncate"><input name="bio" value={editForm.bio} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="role" value={editForm.role} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="roleOther" value={editForm.roleOther} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="paymentMethod" value={editForm.paymentMethod} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="venmo" value={editForm.venmo} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="zelle" value={editForm.zelle} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900 font-mono">{editForm.submissionId}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">(Files not editable inline)</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">
                      <button className="bg-green-500 text-white px-3 py-1 rounded mr-2 text-xs" disabled={actionLoading} onClick={() => handleSave(editForm.submissionId)}>{actionLoading ? "Saving..." : "Save"}</button>
                      <button className="bg-gray-400 text-white px-3 py-1 rounded text-xs" disabled={actionLoading} onClick={() => setEditIdx(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.firstName || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.lastName || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.phone || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.email || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.instagram || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.facebook || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.soundcloud || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.spotify || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.youtube || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.tiktok || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.performerName || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.city || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.country || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900 max-w-xs truncate">{talent.bio || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.role || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.roleOther || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.paymentMethod || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.venmo || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.zelle || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900 font-mono">{talent.submissionId || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">
                      {talent.files && typeof talent.files === "object" ? (
                        <ul className="list-disc pl-4">
                          {talent.files.photo ? <li className="text-xs text-gray-700">Photo: <span className="font-mono">{talent.files.photo}</span></li> : <li className="text-xs text-gray-400">Photo: no data</li>}
                          {talent.files.taxForm ? <li className="text-xs text-gray-700">TaxForm: <span className="font-mono">{talent.files.taxForm}</span></li> : <li className="text-xs text-gray-400">TaxForm: no data</li>}
                          {Array.isArray(talent.files.performerImages) && talent.files.performerImages.length > 0 ? (
                            <li className="text-xs text-gray-700">Performer Images: <span className="font-mono">{talent.files.performerImages.join(", ")}</span></li>
                          ) : <li className="text-xs text-gray-400">Performer Images: no data</li>}
                        </ul>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.timestamp || talent.updated_at || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px'}} className="px-4 py-2 text-xs text-gray-900">
                      <button className="bg-yellow-400 text-black px-3 py-1 rounded mr-2 mb-1 text-xs w-15" disabled={actionLoading} onClick={() => handleEdit(idx)}>{actionLoading ? "..." : "Edit"}</button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded text-xs w-15" disabled={actionLoading} onClick={() => handleDelete(talent.submissionId)}>{actionLoading ? "..." : "Delete"}</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
