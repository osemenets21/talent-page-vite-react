import React, { useState, useCallback, useEffect, useMemo } from "react";
import Cropper from "react-easy-crop";
import { Dialog } from "@headlessui/react";
import getCroppedImg from "../utils/cropImage";

export default function PhotoCropModal({
  open,
  setOpen,
  imageFile,
  onCropDone,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Safely memoized image URL
  const imageSrc = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return null;
  }, [imageFile]);

  // Revoke object URL on cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Get the original file extension, default to jpg if not available
      const originalExtension = imageFile?.name?.split('.').pop() || 'jpg';
      
      // Create a File object from the cropped blob with proper naming
      const croppedFile = new File([croppedBlob], `profile_photo.${originalExtension}`, {
        type: croppedBlob.type || "image/jpeg",
      });
      
      // Just return the cropped file to the parent component
      // Don't upload it immediately - let the form submission handle that
      onCropDone(croppedFile);
      setOpen(false);
    } catch (err) {
  // ...removed console.error
      alert("Cropping failed. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/60" />
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="bg-white rounded shadow p-4 w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">Adjust Photo</h2>

          <div className="relative w-full h-64 bg-gray-100">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-3 w-full"
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-1 rounded bg-gray-200 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              className="px-4 py-1 rounded bg-indigo-600 text-white text-sm"
            >
              Crop Photo
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}