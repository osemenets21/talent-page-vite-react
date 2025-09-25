import React, { useState } from "react";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { resizeImageFile } from "../utils/resizeImage";

export default function FileUpload({
  label,
  accept,
  setFile,
  required = false,
  multiple = false, 
}) {
  const [fileNames, setFileNames] = useState([]);
  const inputId = label.toLowerCase().replace(/\s+/g, "-");
  // test 4 

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Only resize images (jpg, jpeg, png, webp, gif)
    const isImage = (file) => /image\/(jpeg|png|webp|gif)/.test(file.type);
    const resizeAll = async (files) => {
      return Promise.all(
        files.map(async (file) => {
          if (isImage(file)) {
            try {
              // Resize to max 1200x1200, 85% quality
              return await resizeImageFile(file, 1200, 1200, 0.85);
            } catch {
              return file; // fallback to original if resize fails
            }
          }
          return file;
        })
      );
    };

    if (multiple) {
      const resizedFiles = await resizeAll(selectedFiles);
      setFile(resizedFiles);
      setFileNames(resizedFiles.map((file) => file.name));
    } else {
      const file = selectedFiles[0];
      const resized = isImage(file) ? await resizeImageFile(file, 1200, 1200, 0.85).catch(() => file) : file;
      setFile(resized);
      setFileNames([resized.name]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-4 py-6">
      <DocumentArrowUpIcon className="h-10 w-10 text-gray-400" />
      <label
        htmlFor={inputId}
        className="mt-4 cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          multiple={multiple} // ✅ NEW
          onChange={handleFileChange}
        />
      </label>

      {fileNames.length > 0 && (
        <ul className="mt-2 text-xs text-gray-600 text-center space-y-1">
          {fileNames.map((name, idx) => (
            <li key={idx}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}