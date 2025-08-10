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
  const [bioError, setBioError] = useState("");
  const navigate = useNavigate();

  // Function to format timestamp to NYC Eastern Time
  const formatUSATimestamp = (timestamp) => {
    if (!timestamp) return "no data";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timestamp; // Return original if parsing fails
    }
  };

  // Function to validate bio text to prevent repetitive content
  const validateBioText = (text) => {
    if (!text || text.length < 3) return { isValid: true, error: "" };
    
    // Check for repetitive characters (more than 10 consecutive same characters)
    const repetitiveChars = /(.)\1{9,}/;
    if (repetitiveChars.test(text)) {
      return { isValid: false, error: "Bio cannot contain more than 10 consecutive same characters" };
    }
    
    // Check for repetitive words (same word repeated more than 5 times)
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = {};
    for (const word of words) {
      if (word.length > 1) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
        if (wordCounts[word] > 5) {
          return { isValid: false, error: "Bio cannot repeat the same word more than 5 times" };
        }
      }
    }
    
    // Check for repetitive phrases (3+ word phrases repeated more than 2 times)
    const phrases = [];
    for (let i = 0; i <= words.length - 3; i++) {
      phrases.push(words.slice(i, i + 3).join(' '));
    }
    const phraseCounts = {};
    for (const phrase of phrases) {
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
      if (phraseCounts[phrase] > 2) {
        return { isValid: false, error: "Bio cannot repeat the same phrase more than 2 times" };
      }
    }
    
    return { isValid: true, error: "" };
  };

  useEffect(() => {
    // Fetch all talent records from backend PHP endpoint (CORS safe)
    fetch(`${import.meta.env.VITE_API_DOMAIN}/backend/get_all_talent.php`)
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
      const res = await fetch(`${import.meta.env.VITE_API_DOMAIN}/backend/delete_talent.php`, {
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
    
    // Validate bio field specifically
    if (name === "bio") {
      const validation = validateBioText(value);
      setBioError(validation.error);
    }
  };
  const handleSave = async (submissionId) => {
    // Validate bio text before saving
    const bioValidation = validateBioText(editForm.bio);
    if (!bioValidation.isValid) {
      alert(bioValidation.error);
      return;
    }
    
    setActionLoading(true);
    const formData = new FormData();
    Object.entries(editForm).forEach(([key, value]) => {
      if (key !== "files" && key !== "updated_at" && key !== "timestamp") {
        formData.append(key, value);
      }
    });
    formData.append("submissionId", submissionId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_DOMAIN}/backend/edit_talent.php`, {
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
        <table className="min-w-full divide-y divide-gray-200 shadow-lg rounded-lg" style={{tableLayout: 'fixed'}}>
          <thead className="bg-orange-100">
            <tr>
              <th style={{width:'40px', minWidth:'40px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">#</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">First Name</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Last Name</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Phone</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Email</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Instagram</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Facebook</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">SoundCloud</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Spotify</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">YouTube</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Tiktok</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Performer Name</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">City</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Country</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Bio</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Role</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Role Other</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Payment Method</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Venmo</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Zelle</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Submission ID</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Files</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Timestamp</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {talents.map((talent, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-orange-50"}>
                <td style={{width:'40px', minWidth:'40px'}} className="px-4 py-2 text-xs text-gray-700 font-bold">{idx + 1}</td>
                {editIdx === idx ? (
                  <>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="firstName" value={editForm.firstName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="lastName" value={editForm.lastName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="phone" value={editForm.phone} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="email" value={editForm.email} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="instagram" value={editForm.instagram} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="facebook" value={editForm.facebook} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="soundcloud" value={editForm.soundcloud} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="spotify" value={editForm.spotify} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="youtube" value={editForm.youtube} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="tiktok" value={editForm.tiktok} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="performerName" value={editForm.performerName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="city" value={editForm.city} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="country" value={editForm.country} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900 max-w-xs truncate">
                      <input 
                        name="bio" 
                        value={editForm.bio} 
                        onChange={handleEditChange} 
                        className={`border rounded px-2 py-1 w-full min-w-0 ${
                          bioError ? 'border-red-300' : 'border-gray-300'
                        }`}
                        style={{width:'118px'}}
                        title={bioError || undefined}
                      />
                      {bioError && <div className="text-xs text-red-500 mt-1">{bioError}</div>}
                    </td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="role" value={editForm.role} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="roleOther" value={editForm.roleOther} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="paymentMethod" value={editForm.paymentMethod} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="venmo" value={editForm.venmo} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="zelle" value={editForm.zelle} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900 font-mono">{editForm.submissionId}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">(Files not editable inline)</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{formatUSATimestamp(editForm.timestamp || editForm.updated_at)}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">
                      <button className="bg-green-500 text-white px-3 py-1 rounded mr-2 mb-1 text-xs w-15" disabled={actionLoading || bioError} onClick={() => handleSave(editForm.submissionId)}>{actionLoading ? "Saving..." : "Save"}</button>
                      <button className="bg-gray-400 text-white px-3 py-1 rounded text-xs w-15" disabled={actionLoading} onClick={() => setEditIdx(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.firstName || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.lastName || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.phone || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.email || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.instagram || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.facebook || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.soundcloud || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.spotify || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.youtube || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.tiktok || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.performerName || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.city || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.country || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900 max-w-xs truncate">{talent.bio || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.role || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.roleOther || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.paymentMethod || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.venmo || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{talent.zelle || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900 font-mono">{talent.submissionId || <span className="text-gray-400">no data</span>}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">
                      {talent.files && typeof talent.files === "object" ? (
                        <ul className="list-disc pl-4">
                          {talent.files.photo ? (
                            <li className="text-xs text-gray-700">
                              Photo: 
                              <a 
                                href={`${import.meta.env.VITE_API_DOMAIN}/backend/uploads/${talent.submissionId}/${talent.files.photo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline ml-1"
                              >
                                View
                              </a>
                            </li>
                          ) : (
                            <li className="text-xs text-gray-400">Photo: no data</li>
                          )}
                          {talent.files.taxForm ? (
                            <li className="text-xs text-gray-700">
                              TaxForm: 
                              <a 
                                href={`${import.meta.env.VITE_API_DOMAIN}/backend/uploads/${talent.submissionId}/${talent.files.taxForm}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline ml-1"
                              >
                                Download
                              </a>
                            </li>
                          ) : (
                            <li className="text-xs text-gray-400">TaxForm: no data</li>
                          )}
                          {Array.isArray(talent.files.performerImages) && talent.files.performerImages.length > 0 ? (
                            <li className="text-xs text-gray-700">
                              Performer Images: 
                              <div className="flex flex-wrap gap-1 mt-1">
                                {talent.files.performerImages.map((img, imgIdx) => (
                                  <a 
                                    key={imgIdx}
                                    href={`${import.meta.env.VITE_API_DOMAIN}/backend/uploads/${talent.submissionId}/${img}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                                  >
                                    Image {imgIdx + 1}
                                  </a>
                                ))}
                              </div>
                            </li>
                          ) : (
                            <li className="text-xs text-gray-400">Performer Images: no data</li>
                          )}
                        </ul>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">{formatUSATimestamp(talent.timestamp || talent.updated_at)}</td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">
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
