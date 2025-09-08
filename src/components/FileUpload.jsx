import React, { useState } from "react";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";

export default function FileUpload({
  label,
  accept,
  setFile,
  required = false,
  multiple = false, 
}) {
  const [fileNames, setFileNames] = useState([]);
  const inputId = label.toLowerCase().replace(/\s+/g, "-");
  // test

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (multiple) {
      setFile(selectedFiles);
      setFileNames(selectedFiles.map((file) => file.name));
    } else {
      const file = selectedFiles[0];
      setFile(file);
      setFileNames([file.name]);
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