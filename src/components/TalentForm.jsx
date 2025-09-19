const ROLE_AGREEMENTS = {
  DJ: [
    'I agree to conduct myself in a professional manner and will not become intoxicated or otherwise impaired in a way that would prevent me from fulfilling my hired duties.',
    "I agree to optionally provide my guest list of up to five (5) individuals no later than 24 hours prior to my scheduled start time.",
  ],
  'Drag Queen': [
    'I agree to conduct myself in a professional manner and will not become intoxicated or otherwise impaired in a way that would prevent me from fulfilling my hired duties.',
    "I agree to have only one designated helper accompany me in the green room.",
  ],
  Dancer: [
    'I agree to conduct myself in a professional manner and will not become intoxicated or otherwise impaired in a way that would prevent me from fulfilling my hired duties.',
    "I agree to have only one designated helper accompany me in the green room.",
  ],
  Host: [
    'I agree to conduct myself in a professional manner and will not become intoxicated or otherwise impaired in a way that would prevent me from fulfilling my hired duties.',
    "I agree to have only one designated helper accompany me in the green room.",
  ]
};
import React, { useState, useEffect } from "react";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/solid";
import W9RequestModal from "./W9RequestModal";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import FileUpload from "./FileUpload";
import { PhotoIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import PhotoCropModal from "./PhotoCropModal";
import Modal from "./Modal";

export default function TalentForm() {
  const [hasW9, setHasW9] = useState(null); // null, true, or false
  const [isRequestingW9, setIsRequestingW9] = useState(false);
  const [showW9Modal, setShowW9Modal] = useState(false);
  const [w9Form, setW9Form] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [w9Error, setW9Error] = useState('');
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
    music_genres: ""
  });


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
  const [roleAgreementsChecked, setRoleAgreementsChecked] = useState({});
  const [bioError, setBioError] = useState("");
  const [inputErrors, setInputErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFromDC, setIsFromDC] = useState(null); // null, true, or false
  const [isFromDCError, setIsFromDCError] = useState("");


  const validateBioText = (text) => {
    if (!text || text.length < 3) return { isValid: true, error: "" };

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

  // Function to extract username from social media URLs
  const extractUsername = (input) => {
    if (!input) return "";

    // Remove common URL prefixes and extract username
    let cleaned = input
      .replace(/^https?:\/\//, "") // Remove http:// or https://
      .replace(/^www\./, "") // Remove www.
      .replace(
        /^(instagram\.com|facebook\.com|soundcloud\.com|spotify\.com|youtube\.com|tiktok\.com)\//,
        ""
      ) // Remove domain
      .replace(/^@/, "") // Remove @ symbol
      .split("?")[0] // Remove query parameters
      .split("/")[0]; // Take only the first part (username)

    return cleaned;
  };

  useEffect(() => {
    localStorage.setItem("submissionId", form.submissionId);
  }, [form.submissionId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      // Logout failed - handle silently
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    await submitTalentProfile();
  };


  const validateInputs = () => {
    const errors = {};
    // First Name
    if (!form.firstName.trim()) {
      errors.firstName = "First name is required.";
    } else if (!/^[A-Za-z\s'-]{2,100}$/.test(form.firstName.trim())) {
      errors.firstName = "First name must be 2-100 letters, spaces, apostrophes, or hyphens.";
    }
    // Last Name
    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required.";
    } else if (!/^[A-Za-z\s'-]{2,100}$/.test(form.lastName.trim())) {
      errors.lastName = "Last name must be 2-100 letters, spaces, apostrophes, or hyphens.";
    }
    // Phone
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^[0-9+\-() ]{7,20}$/.test(form.phone.trim())) {
      errors.phone = "Phone must be 7-20 digits, +, -, (), or spaces.";
    }
    // Email
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    // Instagram
    if (form.instagram && !/^@[a-zA-Z0-9._]{1,30}$/.test(form.instagram.trim())) {
      errors.instagram = "Instagram must start with @ and be 1-30 letters, numbers, . or _.";
    }
    // Performer Name
    if (form.performerName && !/^.{0,150}$/.test(form.performerName)) {
      errors.performerName = "Performer name must be up to 150 characters.";
    }
    // City
    if (!form.city.trim()) {
      errors.city = "City is required.";
    } else if (!/^.{2,100}$/.test(form.city.trim())) {
      errors.city = "City must be 2-100 characters.";
    }
    // Country
    if (!form.country.trim()) {
      errors.country = "Country is required.";
    } else if (!/^.{2,100}$/.test(form.country.trim())) {
      errors.country = "Country must be 2-100 characters.";
    }
    // Bio
    if (!form.bio.trim()) {
      errors.bio = "Bio is required.";
    } else if (!/^.{20,1500}$/.test(form.bio.trim())) {
      errors.bio = "Bio must be 20-1500 characters.";
    }
    // Role Other
    if (form.role === "Other" && form.roleOther && !/^.{0,100}$/.test(form.roleOther)) {
      errors.roleOther = "Other role must be up to 100 characters.";
    }
    // Venmo
    if (form.paymentMethod === "Venmo" && !form.venmo.trim()) {
      errors.venmo = "Venmo name is required.";
    } else if (form.venmo && !/^.{0,150}$/.test(form.venmo)) {
      errors.venmo = "Venmo name must be up to 150 characters.";
    }
    // Zelle
    if (form.paymentMethod === "Zelle" && !form.zelle.trim()) {
      errors.zelle = "Zelle email or phone is required.";
    } else if (form.zelle && !/^.{0,150}$/.test(form.zelle)) {
      errors.zelle = "Zelle must be up to 150 characters.";
    }
    // Music genres for DJ
    if (form.role === "DJ" && !form.music_genres.trim()) {
      errors.music_genres = "Music genres are required for DJs.";
    } else if (form.music_genres && !/^.{1,255}$/.test(form.music_genres)) {
      errors.music_genres = "Music genres must be 1-255 characters.";
    }
    return errors;
  };

  const submitTalentProfile = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    function Input({
      label,
      id,
      value,
      onChange,
      className = "",
      required = false,
      type = "text",
      hint,
      error,
      valid
    }) {
      const [showHint, setShowHint] = useState(false);

      // Use box-shadow for validation feedback
      let boxShadow = undefined;
      if (error) {
        boxShadow = '0 0 0 5px #ef4444'; // Tailwind red-500, bigger shadow
      } else if (valid) {
        boxShadow = '0 0 0 5px #22c55e'; // Tailwind green-500, bigger shadow
      }

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
              className={`block w-full rounded-md px-3 py-2 text-sm text-black shadow-sm focus:ring-2 placeholder-gray-400`}
              style={boxShadow ? { boxShadow } : {}}
            />
            {showHint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
          </div>
        </div>
      );
    }

    setIsSubmitting(true);

    if (!photo) {
      setModalTitle("Files Required");
      setModalMessage("Upload your profile photo and tax form W9");
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

    // Add checked agreements as an array
    let agreementsList = ROLE_AGREEMENTS[form.role] || [];
    if (form.role === "DJ" && isFromDC === false) {
      agreementsList = [
        ...agreementsList,
        "I agree not to DJ within a 20-mile radius of Washington, DC for 45 days before and 45 days after any scheduled performance dates, unless otherwise agreed upon in advance."
      ];
    }
    const checkedAgreements = agreementsList.filter((_, idx) => roleAgreementsChecked[idx]);
    formData.append('agreements', JSON.stringify(checkedAgreements));

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

    // Append files with proper naming
    formData.append("photo", photo);
    
    // Rename tax form to have consistent naming
    if (taxForm) {
      const taxFormExtension = taxForm.name.split('.').pop();
      const renamedTaxForm = new File([taxForm], `tax_form.${taxFormExtension}`, {
        type: taxForm.type
      });
      formData.append("taxForm", renamedTaxForm);
    }

    // Rename performer images with consistent numbering
    performerImages.forEach((file, index) => {
      const fileExtension = file.name.split('.').pop();
      const renamedFile = new File([file], `performer_${index + 1}.${fileExtension}`, {
        type: file.type
      });
      formData.append("performerImages[]", renamedFile);
    });

    try {
      const apiDomain = import.meta.env.VITE_API_DOMAIN;
      const response = await fetch(`${apiDomain}/talent/submit`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.status === "success") {
        setModalTitle("Submission Successful");
        setModalMessage(
          "Your talent profile has been submitted successfully! You will be redirected to your profile page when you close this message."
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
              Profile photo<span className="text-red-500 ml-1">*</span>
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
              error={inputErrors.firstName}
              valid={form.firstName && !inputErrors.firstName && /^[A-Za-z\s'-]{2,100}$/.test(form.firstName.trim())}
            />
            {inputErrors.firstName && <p className="text-xs text-red-500 mt-1 ml-1">{inputErrors.firstName}</p>}
            <Input
              label="Last Name"
              id="lastName"
              value={form.lastName}
              onChange={(v) => setForm({ ...form, lastName: v })}
              required
              error={inputErrors.lastName}
              valid={form.lastName && !inputErrors.lastName && /^[A-Za-z\s'-]{2,100}$/.test(form.lastName.trim())}
            />
            {inputErrors.lastName && <p className="text-xs text-red-500 mt-1 ml-1">{inputErrors.lastName}</p>}
            <Input
              label="Stage / Performer Name"
              id="performerName"
              value={form.performerName}
              onChange={(v) => setForm({ ...form, performerName: v })}
              className="sm:col-span-3"
              hint="Optional, but If entered this will take the place of first / last name on profile"
              error={inputErrors.performerName}
              valid={form.performerName !== undefined && !inputErrors.performerName && /^.{0,150}$/.test(form.performerName)}
            />

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-900">
                Your Role<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                required
                value={form.role}
                onChange={(e) => {
                  setForm({ ...form, role: e.target.value });
                  if (e.target.value !== "DJ") setIsFromDC(null);
                }}
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
              {form.role === "DJ" && (
                <>
                  <Input
                    label="Music Genres (comma separated)"
                    id="music_genres"
                    value={form.music_genres}
                    onChange={(v) => setForm({ ...form, music_genres: v })}
                    className="mt-2"
                    hint="e.g. House, Techno, Hip-Hop, Disco, Latin etc."
                    error={inputErrors.music_genres}
                    valid={form.music_genres && !inputErrors.music_genres && /^.{1,255}$/.test(form.music_genres)}
                  />
                  {inputErrors.music_genres && <p className="text-xs text-red-500 mt-1 ml-1">{inputErrors.music_genres}</p>}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Are you from Washington, DC Area? <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      id="isFromDC-select"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600"
                      value={isFromDC === null ? "" : isFromDC ? "yes" : "no"}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "yes") setIsFromDC(true);
                        else if (val === "no") setIsFromDC(false);
                        else setIsFromDC(null);
                      }}
                      required={form.role === "DJ"}
                    >
                      <option value="" disabled>Select an option</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {isFromDCError && (
                      <p className="text-xs text-red-500 mt-1">{isFromDCError}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <Input
              label="Instagram"
              id="instagram"
              value={form.instagram}
              onChange={(v) =>
                setForm({ ...form, instagram: extractUsername(v) })
              }
              className="sm:col-span-2"
              error={inputErrors.instagram}
              valid={form.instagram && !inputErrors.instagram && /^@[a-zA-Z0-9._]{1,30}$/.test(form.instagram.trim())}
            />
            <Input
              label="Facebook"
              id="facebook"
              value={form.facebook}
              onChange={(v) =>
                setForm({ ...form, facebook: extractUsername(v) })
              }
              className="sm:col-span-2"
              error={inputErrors.facebook}
              valid={form.facebook && !inputErrors.facebook}
            />
            <Input
              label="SoundCloud"
              id="soundcloud"
              value={form.soundcloud}
              onChange={(v) =>
                setForm({ ...form, soundcloud: extractUsername(v) })
              }
              className="sm:col-span-2"
              error={inputErrors.soundcloud}
              valid={form.soundcloud && !inputErrors.soundcloud}
            />
            <Input
              label="Spotify"
              id="spotify"
              value={form.spotify}
              onChange={(v) =>
                setForm({ ...form, spotify: extractUsername(v) })
              }
              className="sm:col-span-2"
              error={inputErrors.spotify}
              valid={form.spotify && !inputErrors.spotify}
            />
            <Input
              label="Youtube"
              id="youtube"
              value={form.youtube}
              onChange={(v) =>
                setForm({ ...form, youtube: extractUsername(v) })
              }
              className="sm:col-span-2"
              error={inputErrors.youtube}
              valid={form.youtube && !inputErrors.youtube}
            />

            <Input
              label="Tiktok"
              id="tiktok"
              value={form.tiktok}
              onChange={(v) => setForm({ ...form, tiktok: extractUsername(v) })}
              className="sm:col-span-2"
              error={inputErrors.tiktok}
              valid={form.tiktok && !inputErrors.tiktok}
            />
            <Input
              label="Current City of Residence"
              id="city"
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              className="sm:col-span-3"
              required
              error={inputErrors.city}
              valid={form.city && !inputErrors.city && /^.{2,100}$/.test(form.city.trim())}
            />
            {inputErrors.city && <p className="text-xs text-red-500 mt-1 ml-1">{inputErrors.city}</p>}
            <Input
              label="Country"
              id="country"
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v })}
              className="sm:col-span-3"
              required
              error={inputErrors.country}
              valid={form.country && !inputErrors.country && /^.{2,100}$/.test(form.country.trim())}
            />
            {inputErrors.country && <p className="text-xs text-red-500 mt-1 ml-1">{inputErrors.country}</p>}

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
                className={`mt-2 block w-full rounded-md border px-3 py-2 text-sm text-black shadow-sm focus:ring-2 focus:ring-indigo-600 ${
                  bioError
                    ? "border-red-300 focus:ring-red-600"
                    : "border-gray-300"
                } placeholder-gray-400`}
              />
              {bioError && (
                <p className="text-xs text-red-500 mt-1">{bioError}</p>
              )}
              <p className="text-xs text-gray-500 text-right">
                {form.bio.length}/1500
              </p>
              <div className="pt-5">
                <FileUpload
                  label="Performer Images / LOGO (JPG/PNG)"
                  accept="image/*"
                  setFile={setPerformerImages}
                  multiple
                />
              </div>
            </div>
          </div>

          <hr className="border-t border-gray-300" />

          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Private Encrypted Info
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
              <Input
                label="Phone"
                id="phone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                required
                error={inputErrors.phone}
                valid={form.phone && !inputErrors.phone && /^[0-9+\-() ]{7,20}$/.test(form.phone.trim())}
              />
              {inputErrors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{inputErrors.phone}</p>}
              <Input
                label="Email"
                id="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
                error={inputErrors.email}
                valid={form.email && !inputErrors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())}
              />
              {inputErrors.email && <p className="text-xs text-red-500 mt-1 ml-1">{inputErrors.email}</p>}

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
                <>
                  <Input
                    label="Venmo Name"
                    id="venmo"
                    value={form.venmo}
                    onChange={(v) => setForm({ ...form, venmo: v })}
                    className="sm:col-span-3"
                    required
                    error={inputErrors.venmo}
                    valid={form.venmo && !inputErrors.venmo && /^.{0,150}$/.test(form.venmo)}
                  />
                  {inputErrors.venmo && <p className="text-xs text-red-500 mt-1 ml-1">{inputErrors.venmo}</p>}
                </>
              )}
              {form.paymentMethod === "Zelle" && (
                <>
                  <Input
                    label="Zelle Email or Phone"
                    id="zelle"
                    value={form.zelle}
                    onChange={(v) => setForm({ ...form, zelle: v })}
                    className="sm:col-span-3"
                    required
                    error={inputErrors.zelle}
                    valid={form.zelle && !inputErrors.zelle && /^.{0,150}$/.test(form.zelle)}
                  />
                  {inputErrors.zelle && <p className="text-xs text-red-500 mt-1 ml-1">{inputErrors.zelle}</p>}
                </>
              )}
            </div>
            <div className="pt-5">
              {/* W9 Question */}
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Do you have W9 tax form already? <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-1 text-black">
                  <input
                    type="radio"
                    name="hasW9"
                    value="yes"
                    className="appearance-none h-4 w-4 border  rounded-full checked:bg-black checked:border-black focus:ring-2 focus:ring-black transition-all duration-150 cursor-pointer align-middle"
                    checked={hasW9 === true}
                    onChange={() => setHasW9(true)}
                    required
                  />
                  Yes
                </label>
                <label className="flex items-center gap-1 text-black">
                  <input
                    type="radio"
                    name="hasW9"
                    value="no"
                    className="appearance-none h-4 w-4 border  rounded-full checked:bg-black checked:border-black focus:ring-2 focus:ring-black transition-all duration-150 cursor-pointer align-middle"
                    checked={hasW9 === false}
                    onChange={() => setHasW9(false)}
                    required
                  />
                  No
                </label>
              </div>
              {/* If Yes, show upload */}
              {hasW9 === true && (
                <FileUpload
                  label="Upload W9 (PDF)"
                  accept=".pdf"
                  setFile={setTaxForm}
                  required
                />
              )}
              {/* If No, show request button */}
              {hasW9 === false && (
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-2"
                  onClick={() => {
                    setW9Form({
                      firstName: form.firstName,
                      lastName: form.lastName,
                      email: form.email,
                      phone: form.phone
                    });
                    setShowW9Modal(true);
                  }}
                >
                  Request W9 Tax Form from manager
                </button>
              )}
      <W9RequestModal
        open={showW9Modal}
        onClose={() => setShowW9Modal(false)}
        w9Form={w9Form}
        setW9Form={setW9Form}
        w9Error={w9Error}
        isRequestingW9={isRequestingW9}
        onRequest={async () => {
          setW9Error("");
          if (!w9Form.firstName.trim() || !w9Form.lastName.trim() || !w9Form.email.trim() || !w9Form.phone.trim()) {
            setW9Error("All fields are required.");
            return;
          }
          setIsRequestingW9(true);
          try {
            const apiUrl = '/backend/request_w9.php';
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                firstName: w9Form.firstName,
                lastName: w9Form.lastName,
                email: w9Form.email,
                phone: w9Form.phone,
                submissionId: form.submissionId
              })
            });
            const data = await res.json();
            setShowW9Modal(false);
            alert('Your request for a W9 form has been sent to the manager. You may now continue filling out your profile.');
          } catch (err) {
            setW9Error('Failed to send request. Please try again.');
          } finally {
            setIsRequestingW9(false);
          }
        }}
      />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 pt-4 sm:px-8">
          {/* Role-specific agreements */}
          <div className="flex flex-col gap-2 mt-2">
            {(() => {
              let agreements = ROLE_AGREEMENTS[form.role] || [];
              if (form.role === "DJ" && isFromDC === false) {
                agreements = [
                  ...agreements,
                  "I agree not to DJ within a 20-mile radius of Washington, DC for 45 days before and 45 days after any scheduled performance dates, unless otherwise agreed upon in advance."
                ];
              }
              return agreements.map((text, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 rounded-md px-2 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-gray-900 text-[15px] font-normal"
                  style={{ minHeight: 44 }}
                >
                  <input
                    type="checkbox"
                    required
                    checked={!!roleAgreementsChecked[idx]}
                    onChange={e => {
                      setRoleAgreementsChecked(prev => ({ ...prev, [idx]: e.target.checked }));
                    }}
                    className="h-3 w-3 appearance-none border border-gray-300 bg-white checked:bg-indigo-600 checked:border-indigo-600 focus:ring-2 focus:ring-indigo-500 transition-all duration-150 cursor-pointer align-middle mt-0.5"
                    style={{ borderRadius: 4 }}
                  />
                  <p className="leading-snug m-0">{text}<span className="text-red-500 ml-1">*</span></p>
                </label>
              ));
            })()}
            {/* General agreement */}
            <label
              className="flex items-center gap-3 rounded-md px-2 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-gray-900 text-[15px] font-normal"
              style={{ minHeight: 44 }}
            >
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-3 w-3 appearance-none border border-gray-300 bg-white checked:bg-indigo-600 checked:border-indigo-600 focus:ring-2 focus:ring-indigo-500 transition-all duration-150 cursor-pointer align-middle mt-0.5"
                style={{ borderRadius: 4 }}
              />
              <p className="leading-snug m-0">
                I agree to the{' '}
                <a
                  href="https://drive.google.com/file/d/1Wp36AhlsiazCJTvflEqH4YYucS3dF3hw/view?usp=sharing"
                  target="_blank"
                  className="underline text-indigo-600 font-medium"
                >
                  Terms & Conditions and Privacy Policy
                </a>{' '}
                and understand that my data will be collected for profile
                submission purposes.
                <span className="text-red-500 ml-1">*</span>
              </p>
            </label>
          </div>
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
            navigate("/my-profile");
          }
          if (!open) {
            setModalTitle("");
            setModalMessage("");
            setIsSuccessModal(false);
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
  error,
  valid
}) {
  const [showHint, setShowHint] = useState(false);

  let borderColor = "border-gray-300 focus:ring-indigo-600";
  if (error) borderColor = "border-red-500 focus:ring-red-500";
  else if (valid) borderColor = "border-green-500 focus:ring-green-500";

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
          className={`block w-full rounded-md px-3 py-2 text-sm text-black shadow-sm focus:ring-2 placeholder-gray-400 ${borderColor}`}
        />
        {showHint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
      </div>
    </div>
  );
}
