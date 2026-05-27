"use client";

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6">
        <p>Upload Modal (coming soon)</p>
        <button type="button" onClick={onClose} className="mt-4 text-sm underline">Close</button>
      </div>
    </div>
  );
}
