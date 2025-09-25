// Utility to resize an image file to a max width/height and return a new File
export async function resizeImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        let newWidth = width;
        let newHeight = height;
        if (width > maxWidth || height > maxHeight) {
          const aspect = width / height;
          if (aspect > 1) {
            newWidth = maxWidth;
            newHeight = Math.round(maxWidth / aspect);
          } else {
            newHeight = maxHeight;
            newWidth = Math.round(maxHeight * aspect);
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Resize failed'));
            const ext = file.name.split('.').pop() || 'jpg';
            const resizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '_resized.' + ext, {
              type: blob.type || 'image/jpeg',
            });
            resolve(resizedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
