import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TalentProfile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const submissionId = localStorage.getItem("submissionId");

  useEffect(() => {
    if (!submissionId) return;

    fetch(`https://takeoverpresents.com/takeoverpresents.com/get_talent.php?submissionId=${submissionId}`)
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error("Failed to load profile:", err));
  }, [submissionId]);

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your profile?");
    if (!confirmed) return;

    try {
      const response = await fetch(
        "https://takeoverpresents.com/takeoverpresents.com/delete_talent.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId }),
        }
      );

      const result = await response.json();
      if (result.status === "success") {
        alert("Profile deleted.");
        localStorage.removeItem("submissionId");
        navigate("/");
      } else {
        alert("Delete failed: " + result.message);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Your Talent Profile</h1>
      <p><strong>Name:</strong> {profile.performerName || `${profile.firstName} ${profile.lastName}`}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Phone:</strong> {profile.phone}</p>
      <p><strong>Instagram:</strong> {profile.instagram}</p>
      <p><strong>City:</strong> {profile.city}</p>
      <p><strong>Country:</strong> {profile.country}</p>
      {/* Add more fields as needed */}

      {profile.files?.photo && (
        <div className="mt-4">
          <img
            src={`https://takeoverpresents.com/takeoverpresents.com/uploads/${submissionId}/${profile.files.photo}`}
            alt="Profile"
            className="w-24 h-24 object-cover rounded-full"
          />
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => navigate("/edit")}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
