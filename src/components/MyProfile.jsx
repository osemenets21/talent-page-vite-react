import React, { useEffect, useState } from "react";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get submissionId from localStorage or prompt user
    const submissionId = localStorage.getItem("submissionId");
    if (!submissionId) {
      setError("No submission ID found. Please submit your profile first.");
      setLoading(false);
      return;
    }

    // Fetch all profiles from backend
    fetch("/backend/submissions/talent_data.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile data");
        return res.json();
      })
      .then((data) => {
        // Find the profile with the matching submissionId
        const found = data.find((entry) => entry.submissionId === submissionId);
        if (!found) {
          setError("Profile not found.");
        } else {
          setProfile(found);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!profile) return null;

  // Build file URLs
  const uploadFolder = `${profile.firstName}_${profile.lastName}`;
  const photoUrl = profile.files && profile.files.photo
    ? `/backend/uploads/${uploadFolder}/${profile.files.photo}`
    : null;
  const pdfUrl = profile.files && profile.files.taxForm
    ? `/backend/uploads/${uploadFolder}/${profile.files.taxForm}`
    : null;

  return (
    <div className="max-w-xl mx-auto bg-white shadow p-6 rounded-lg mt-8">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      {photoUrl && (
        <img src={photoUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover mb-4" />
      )}
      <div className="space-y-2">
        <div><strong>Name:</strong> {profile.firstName} {profile.lastName}</div>
        <div><strong>Stage Name:</strong> {profile.performerName}</div>
        <div><strong>Phone:</strong> {profile.phone}</div>
        <div><strong>Email:</strong> {profile.email}</div>
        <div><strong>Instagram:</strong> {profile.instagram}</div>
        <div><strong>Facebook:</strong> {profile.facebook}</div>
        <div><strong>SoundCloud:</strong> {profile.soundcloud}</div>
        <div><strong>Spotify:</strong> {profile.spotify}</div>
        <div><strong>Youtube:</strong> {profile.youtube}</div>
        <div><strong>Tiktok:</strong> {profile.tiktok}</div>
        <div><strong>City:</strong> {profile.city}</div>
        <div><strong>Country:</strong> {profile.country}</div>
        <div><strong>Role:</strong> {profile.role} {profile.roleOther && `(${profile.roleOther})`}</div>
        <div><strong>Bio:</strong> {profile.bio}</div>
        <div><strong>Payment Method:</strong> {profile.paymentMethod}</div>
        {profile.paymentMethod === "Venmo" && <div><strong>Venmo:</strong> {profile.venmo}</div>}
        {profile.paymentMethod === "Zelle" && <div><strong>Zelle:</strong> {profile.zelle}</div>}
        {pdfUrl && (
          <div>
            <strong>Tax Form (PDF):</strong> <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
          </div>
        )}
      </div>
    </div>
  );
}
