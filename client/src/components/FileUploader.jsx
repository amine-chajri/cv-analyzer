import { useCallback, useRef, useState } from 'react';

const ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg,.webp,.bmp,.txt';
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB — must match server limit
const ALLOWED_EXT = /\.(pdf|docx|png|jpe?g|webp|bmp|txt)$/i;

export default function FileUploader({ file, onChange, onError }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const validateAndSet = useCallback(
    (picked) => {
      if (!picked) return;
      const isAllowed = ALLOWED_EXT.test(picked.name || '');
      if (!isAllowed) {
        onError?.('Only PDF, DOCX, image (PNG/JPG/WEBP/BMP) or TXT files are allowed.');
        return;
      }
      if (picked.size > MAX_SIZE) {
        onError?.('File too large. Maximum size is 10 MB.');
        return;
      }
      onChange(picked);
    },
    [onChange, onError]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const clearFile = (e) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-pill border-2 border-border-soft p-6 text-center transition ${
        dragging ? 'border-primary bg-primary/5' : 'border-slate-300 bg-slate-50 hover:border-primary/20'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => validateAndSet(e.target.files?.[0])}
      />

      {file ? (
        <>
          <div
            className="flex items-center gap-3 rounded-lg border border-hairline bg-white px-4 py-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              📄
            </span>
            <div className="text-left">
              <p className="max-w-[220px] truncate font-semibold text-ink">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Remove file"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Click to replace the file</p>
        </>
      ) : (
        <>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-pill bg-primary/10 text-primary"
          >
            ⬆️
          </div>
          <p className="mt-3 font-semibold text-slate-700">
            Drag & drop your CV here, or click to browse
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PDF, DOCX, image (PNG/JPG — we'll OCR it), or TXT · up to 10 MB
          </p>
        </>
      )}
    </div>
  );
}