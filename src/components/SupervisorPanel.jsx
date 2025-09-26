import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { XMarkIcon } from "@heroicons/react/24/solid";

import { authenticatedGet, authenticatedPost, authenticatedDelete } from "../utils/apiUtils";
import logoUrl from "../pictures/logo.png";

export default function SupervisorPanel() {
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [bioError, setBioError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({}); // New state for field-level errors
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

  // Field validation function
  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Invalid email format';
        }
        break;
      case 'phone':
        if (value && !/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,}$/.test(value)) {
          errors.phone = 'Invalid phone number format';
        }
        break;
      case 'bio':
        const bioValidation = validateBioText(value);
        if (!bioValidation.isValid) {
          errors.bio = bioValidation.error;
        }
        break;
      default:
        break;
    }
    
    return errors;
  };

  useEffect(() => {
    // Fetch all talent records from backend PHP endpoint with authentication
    const loadTalents = async () => {
      try {
        const response = await authenticatedGet(`${import.meta.env.VITE_API_DOMAIN}/talent/all`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
          setTalents(result.data || []);
        } else {
          throw new Error(result.message || 'Failed to load talent data');
        }
        setLoading(false);
      } catch (err) {
  // ...removed console.error
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadTalents();
  }, []);

  // Handle delete
  const handleDelete = async (submissionId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setActionLoading(true);
    
    try {
      const response = await authenticatedPost(`${import.meta.env.VITE_API_DOMAIN}/talent/delete`, {
        submissionId
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
  // ...removed console.log
      
      if (result.status === "success") {
        setTalents((prev) => prev.filter((t) => t.submissionId !== submissionId));
      } else {
        alert(result.message || "Delete failed");
      }
    } catch (err) {
  // ...removed console.error
      alert("Error: " + err.message);
    }
    setActionLoading(false);
  };

  // Handle edit
  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditForm({ ...talents[idx] });
    setBioError(""); // Clear bio errors when starting edit
    setFieldErrors({}); // Clear field errors when starting edit
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    
    // Validate the specific field
    const fieldValidationErrors = validateField(name, value);
    
    // Update field errors
    setFieldErrors((prev) => ({
      ...prev,
      ...fieldValidationErrors,
      // Clear error if validation passes
      ...(Object.keys(fieldValidationErrors).length === 0 ? { [name]: undefined } : {})
    }));
    
    // Validate bio field specifically (legacy support)
    if (name === "bio") {
      const validation = validateBioText(value);
      setBioError(validation.error);
    }
  };
  const handleSave = async (submissionId) => {
    // Validate all fields before saving
    const allErrors = {};
    Object.entries(editForm).forEach(([key, value]) => {
      const fieldErrors = validateField(key, value);
      Object.assign(allErrors, fieldErrors);
    });
    
    // Check if there are any validation errors
    const hasErrors = Object.values(allErrors).some(error => error);
    if (hasErrors) {
      alert("Please fix all validation errors before saving:\n" + Object.values(allErrors).filter(e => e).join('\n'));
      return;
    }
    
    setActionLoading(true);
    setBioError(""); // Clear any previous bio errors
    setFieldErrors({}); // Clear any previous field errors
    
    try {
      // Prepare the data for supervisor edit (using JSON instead of FormData for simplicity)
      const updateData = { ...editForm };
      
      // Remove read-only fields that shouldn't be updated
      delete updateData.files;
      delete updateData.updated_at;
      delete updateData.timestamp;
      delete updateData.id; // Don't send the database ID
      
      // Ensure submissionId is included
      updateData.submissionId = submissionId;
      
      
      const response = await authenticatedPost(
        `${import.meta.env.VITE_API_DOMAIN}/talent/supervisor-edit`, 
        updateData
      );
      
      if (!response.ok) {
        const errorText = await response.text();
  // ...removed console.error
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status === "success") {
        // Update the local state with the edited data
        setTalents((prev) => prev.map((t, idx) => 
          idx === editIdx 
            ? { 
                ...editForm, 
                files: t.files, // Preserve files data
                updated_at: new Date().toISOString() 
              } 
            : t
        ));
        setEditIdx(null);
        alert("Talent updated successfully!");
      } else {
  // ...removed console.error
        alert(result.message || "Update failed");
      }
    } catch (err) {
  // ...removed console.error
      alert("Error: " + err.message);
    }
    setActionLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      // Logout failed - handle silently
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-1 relative">
      <div className="absolute top-3 left-3 z-10">
        <button 
          onClick={() => navigate('/admin-dashboard')} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
          title="Back to Dashboard"
          type="button"
        >
          ← Dashboard
        </button>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <button onClick={handleLogout} title="Logout" type="button">
          <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-red-600 transition duration-150" />
        </button>
      </div>
      <div className="flex justify-center mb-8">
        <img src={logoUrl} alt="Company Logo" className="h-30 w-auto" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 shadow-lg rounded-lg" style={{tableLayout: 'fixed'}}>
          <thead className="bg-orange-100">
            <tr>
              <th style={{width:'40px', minWidth:'40px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">#</th>
              <th style={{width:'80px', minWidth:'80px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Photo</th>
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
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Last updated</th>
              <th style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {talents.map((talent, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-orange-50"}>
                <td style={{width:'40px', minWidth:'40px'}} className="px-4 py-2 text-xs text-gray-700 font-bold">{idx + 1}</td>
                {editIdx === idx ? (
                  <>
                    <td style={{width:'80px', minWidth:'80px'}} className="px-4 py-2">
                      {talent.files?.photo ? (
                        <img
                          src={`${import.meta.env.VITE_API_DOMAIN}/uploads/${talent.submissionId}/${talent.files.photo}`}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Photo</span>
                        </div>
                      )}
                    </td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="firstName" value={editForm.firstName || ''} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="lastName" value={editForm.lastName || ''} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">
                      <input 
                        name="phone" 
                        value={editForm.phone || ''} 
                        onChange={handleEditChange} 
                        className={`border rounded px-2 py-1 w-full min-w-0 ${
                          fieldErrors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        style={{width:'118px'}}
                        title={fieldErrors.phone || undefined}
                      />
                      {fieldErrors.phone && <div className="text-xs text-red-500 mt-1">{fieldErrors.phone}</div>}
                    </td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900">
                      <input 
                        name="email" 
                        value={editForm.email || ''} 
                        onChange={handleEditChange} 
                        className={`border rounded px-2 py-1 w-full min-w-0 ${
                          fieldErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        style={{width:'118px'}}
                        title={fieldErrors.email || undefined}
                      />
                      {fieldErrors.email && <div className="text-xs text-red-500 mt-1">{fieldErrors.email}</div>}
                    </td>
                    <td style={{width:'150px', minWidth:'150px'}} className="px-4 py-2 text-xs text-gray-900"><input name="instagram" value={editForm.instagram} onChange={handleEditChange} className="border rounded px-2 py-1 w-full min-w-0" style={{width:'118px'}} /></td>
                    {/* Facebook field removed */}
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
                        value={editForm.bio || ''} 
                        onChange={handleEditChange} 
                        className={`border rounded px-2 py-1 w-full min-w-0 ${
                          fieldErrors.bio || bioError ? 'border-red-300' : 'border-gray-300'
                        }`}
                        style={{width:'118px'}}
                        title={(fieldErrors.bio || bioError) || undefined}
                      />
                      {(fieldErrors.bio || bioError) && <div className="text-xs text-red-500 mt-1">{fieldErrors.bio || bioError}</div>}
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
                      <button 
                        className="bg-green-500 text-white px-3 py-1 rounded mr-2 mb-1 text-xs w-15 disabled:bg-gray-400 disabled:cursor-not-allowed" 
                        disabled={actionLoading || bioError || Object.values(fieldErrors).some(error => error)} 
                        onClick={() => handleSave(editForm.submissionId)}
                        title={
                          actionLoading ? "Saving..." :
                          bioError ? bioError :
                          Object.values(fieldErrors).some(error => error) ? "Please fix validation errors" :
                          "Save changes"
                        }
                      >
                        {actionLoading ? "Saving..." : "Save"}
                      </button>
                      <button className="bg-gray-400 text-white px-3 py-1 rounded text-xs w-15" disabled={actionLoading} onClick={() => setEditIdx(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{width:'80px', minWidth:'80px'}} className="px-4 py-2">
                      {talent.files?.photo ? (
                        <img
                          src={`${import.meta.env.VITE_API_DOMAIN}/uploads/${talent.submissionId}/${talent.files.photo}`}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Photo</span>
                        </div>
                      )}
                    </td>
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
                                href={`${import.meta.env.VITE_API_DOMAIN}/uploads/${talent.submissionId}/${talent.files.photo}`}
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
                                href={`${import.meta.env.VITE_API_DOMAIN}/uploads/${talent.submissionId}/${talent.files.taxForm}`}
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
                                    href={`${import.meta.env.VITE_API_DOMAIN}/uploads/${talent.submissionId}/${img}`}
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
