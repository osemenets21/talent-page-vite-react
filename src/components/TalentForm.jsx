import React, { useState, useEffect } from "react";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import FileUpload from "./FileUpload";
import { PhotoIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import PhotoCropModal from "./PhotoCropModal";
import Modal from "./Modal";

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
    youtube: "",
    tiktok: "",
    performerName: "",
    city: "",
    country: "USA",
    bio: "",
    role: "DJ",
    roleOther: "",
    paymentMethod: "Venmo",
    venmo: "",
    zelle: "",
    submissionId: generateId(),
  });

  // Portfolio removed
  const [photo, setPhoto] = useState(null);
  const [taxForm, setTaxForm] = useState(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawPhotoFile, setRawPhotoFile] = useState(null);
  const [performerImages, setPerformerImages] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [bioError, setBioError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to validate bio text to prevent repetitive content
  const validateBioText = (text) => {
    if (!text || text.length < 3) return { isValid: true, error: "" };

    // Check for repetitive characters (more than 10 consecutive same characters)
    const repetitiveChars = /(.)\1{9,}/;
    if (repetitiveChars.test(text)) {
      return {
        isValid: false,
        error: "Bio cannot contain more than 10 consecutive same characters",
      };
    }

    // Check for repetitive words (same word repeated more than 5 times)
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = {};
    for (const word of words) {
      if (word.length > 1) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
        if (wordCounts[word] > 5) {
          return {
            isValid: false,
            error: "Bio cannot repeat the same word more than 5 times",
          };
        }
      }
    }

    // Check for repetitive phrases (3+ word phrases repeated more than 2 times)
    const phrases = [];
    for (let i = 0; i <= words.length - 3; i++) {
      phrases.push(words.slice(i, i + 3).join(" "));
    }
    const phraseCounts = {};
    for (const phrase of phrases) {
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
      if (phraseCounts[phrase] > 2) {
        return {
          isValid: false,
          error: "Bio cannot repeat the same phrase more than 2 times",
        };
      }
    }

    return { isValid: true, error: "" };
  };

  function generateId(length = 10) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < length; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  useEffect(() => {
    localStorage.setItem("submissionId", form.submissionId);
  }, [form.submissionId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    await submitTalentProfile();
  };

  const submitTalentProfile = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    if (!agreeTerms) {
      setModalTitle("Terms Required");
      setModalMessage(
        "You must agree to our terms and conditions before submitting."
      );
      setIsSuccessModal(false);
      setShowModal(true);
      return;
    }

    // Validate bio text
    const bioValidation = validateBioText(form.bio);
    if (!bioValidation.isValid) {
      setModalTitle("Bio Validation Error");
      setModalMessage(bioValidation.error);
      setIsSuccessModal(false);
      setShowModal(true);
      return;
    }

    setIsSubmitting(true);

    if (!taxForm || !photo) {
      setModalTitle("Files Required");
      setModalMessage(
        "Upload your profile photo and tax form W9"
      );
      setIsSuccessModal(false);
      setShowModal(true);
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();

    // Append form fields
    for (const [key, value] of Object.entries(form)) {
      formData.append(key, value);
    }

    // Add NYC Eastern Time formatted timestamp
    const usaTimestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    formData.append("timestamp", usaTimestamp);

    // Append files
    formData.append("photo", photo);
    formData.append("taxForm", taxForm);

    performerImages.forEach((file, index) => {
      formData.append("performerImages[]", file);
    });

    try {
      const apiDomain = import.meta.env.VITE_API_DOMAIN;
      const response = await fetch(`${apiDomain}/backend/talent_submit.php`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.status === "success") {
        setModalTitle("Submission Successful");
        setModalMessage(
          "Your talent profile has been submitted. You will be logged out after you close this message."
        );
        setIsSuccessModal(true);
        setShowModal(true);
        setIsSubmitting(false);
      } else {
        setModalTitle("Submission Failed");
        setModalMessage(result.message || "Please try again.");
        setIsSuccessModal(false);
        setShowModal(true);
        setIsSubmitting(false);
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 mt-4 mb-4">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-3xl bg-white shadow ring-1 ring-gray-900/5 sm:rounded-xl"
      >
        <div className="absolute top-3 right-3 z-10">
          <button onClick={handleLogout} title="Logout" type="button">
            <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-red-600 transition duration-150" />
          </button>
        </div>

        <div className="px-4 py-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Public Performer Profile
          </h2>

          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-900">
              Photo
            </label>
            <div className="mt-2 flex items-center gap-x-3">
              {photo ? (
                <img
                  src={URL.createObjectURL(photo)}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover ring-1 ring-gray-300"
                />
              ) : (
                <UserCircleIcon
                  aria-hidden="true"
                  className="w-20 h-20 text-gray-300"
                />
              )}

              <div>
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                >
                  Change
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setRawPhotoFile(file);
                      setShowCropModal(true);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
            <Input
              label="First Name"
              id="firstName"
              value={form.firstName}
              onChange={(v) => setForm({ ...form, firstName: v })}
              required
            />
            <Input
              label="Last Name"
              id="lastName"
              value={form.lastName}
              onChange={(v) => setForm({ ...form, lastName: v })}
              required
            />
            <Input
              label="Stage / Performer Name"
              id="performerName"
              value={form.performerName}
              onChange={(v) => setForm({ ...form, performerName: v })}
              className="sm:col-span-3"
              hint="Optional, but If entered this will take the place of first / last name on profile"
            />

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-900">
                Your Role<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600"
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
                  onChange={(e) =>
                    setForm({ ...form, roleOther: e.target.value })
                  }
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm"
                />
              )}
            </div>

            <Input
              label="Instagram"
              id="instagram"
              value={form.instagram}
              onChange={(v) => setForm({ ...form, instagram: v })}
              className="sm:col-span-2"
            />
            <Input
              label="Facebook"
              id="facebook"
              value={form.facebook}
              onChange={(v) => setForm({ ...form, facebook: v })}
              className="sm:col-span-2"
            />
            <Input
              label="SoundCloud"
              id="soundcloud"
              value={form.soundcloud}
              onChange={(v) => setForm({ ...form, soundcloud: v })}
              className="sm:col-span-2"
            />
            <Input
              label="Spotify"
              id="spotify"
              value={form.spotify}
              onChange={(v) => setForm({ ...form, spotify: v })}
              className="sm:col-span-2"
            />
            <Input
              label="Youtube"
              id="youtube"
              value={form.youtube}
              onChange={(v) => setForm({ ...form, youtube: v })}
              className="sm:col-span-2"
            />

            <Input
              label="Tiktok"
              id="tiktok"
              value={form.tiktok}
              onChange={(v) => setForm({ ...form, tiktok: v })}
              className="sm:col-span-2"
            />
            <Input
              label="City of Origin"
              id="city"
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              className="sm:col-span-3"
              required
            />
            <Input
              label="Country"
              id="country"
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v })}
              className="sm:col-span-3"
              required
            />

            <div className="sm:col-span-6">
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-900"
              >
                Brief BIO<span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="bio"
                required
                rows={3}
                maxLength={1500}
                value={form.bio}
                onChange={(e) => {
                  const newBio = e.target.value;
                  setForm({ ...form, bio: newBio });
                  const validation = validateBioText(newBio);
                  setBioError(validation.error);
                }}
                className={`mt-2 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600 ${
                  bioError
                    ? "border-red-300 focus:ring-red-600"
                    : "border-gray-300"
                }`}
              />
              {bioError && (
                <p className="text-xs text-red-500 mt-1">{bioError}</p>
              )}
              <p className="text-xs text-gray-500 text-right">
                {form.bio.length}/1500
              </p>
            </div>
          </div>

          <hr className="border-t border-gray-300" />

          <h3 className="text-lg font-medium text-gray-900">Private Info</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
            <Input
              label="Phone"
              id="phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              required
            />
            <Input
              label="Email"
              id="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              required
            />

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-900">
                Form of Payment<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                required
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({ ...form, paymentMethod: e.target.value })
                }
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600"
              >
                <option>Venmo</option>
                <option>Zelle</option>
              </select>
            </div>

            {form.paymentMethod === "Venmo" && (
              <Input
                label="Venmo Name"
                id="venmo"
                value={form.venmo}
                onChange={(v) => setForm({ ...form, venmo: v })}
                className="sm:col-span-3"
                required
              />
            )}
            {form.paymentMethod === "Zelle" && (
              <Input
                label="Zelle Email or Phone"
                id="zelle"
                value={form.zelle}
                onChange={(v) => setForm({ ...form, zelle: v })}
                className="sm:col-span-3"
                required
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <FileUpload
              label="Performer Images / LOGO (JPG/PNG)"
              accept="image/*"
              setFile={setPerformerImages}
              multiple
            />
            <FileUpload
              label="Upload W9 (PDF)"
              accept=".pdf"
              setFile={setTaxForm}
              required
              renameWithForm={form}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 pt-4 sm:px-8">
          <label className="flex items-start text-sm text-gray-700 gap-2">
            <input
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                className="underline text-indigo-600"
              >
                Terms and Conditions
              </a>{" "}
              and understand that my data will be collected for profile
              submission purposes.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8 mt-2.5">
          <button
            type="submit" 
            disabled={isSubmitting}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-200 text-black hover:bg-indigo-500"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Talent Profile"}
          </button>
        </div>

        <PhotoCropModal
          open={showCropModal}
          setOpen={setShowCropModal}
          imageFile={rawPhotoFile}
          onCropDone={(croppedBlob) => setPhoto(croppedBlob)}
        />
      </form>
      <Modal
        open={showModal}
        setOpen={(open) => {
          setShowModal(open);
          if (!open && isSuccessModal) {
            // Only logout and navigate on successful submission
            signOut(auth)
              .then(() => navigate("/"))
              .catch(console.error);
          }
        }}
        title={modalTitle}
        message={modalMessage}
      />
    </div>
  );
}

function Input({
  label,
  id,
  value,
  onChange,
  className = "",
  required = false,
  type = "text",
  hint,
}) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-900 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && (
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="ml-1 w-5 h-3 p-2 flex items-center justify-center rounded-full bg-red-200 text-xs font-bold text-gray-700 hover:bg-gray-300"
            title="Show hint"
          >
            ?
          </button>
        )}
      </label>
      <div className="mt-2">
        <input
          type={type}
          id={id}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600"
        />
        {showHint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
      </div>
    </div>
  );
}
