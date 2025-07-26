import React, { useState } from "react";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";

export default function FileUpload({
  label,
  accept,
  setFile,
  required = false,
  renameWithForm,
  multiple = false, 
}) {
  const [fileNames, setFileNames] = useState([]);
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (multiple) {
      setFile(selectedFiles);
      setFileNames(selectedFiles.map((file) => file.name));
    } else {
      let file = selectedFiles[0];

      if (renameWithForm && label.toLowerCase().includes("w9")) {
        const { firstName, lastName } = renameWithForm;
        const year = new Date().getFullYear();
        const newName = `${firstName}_${lastName}_${year}_W9.pdf`.replace(/\s+/g, "_");
        file = new File([file], newName, { type: file.type });
      }

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