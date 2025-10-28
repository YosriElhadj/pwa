'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string, file: File) => void;
  loading?: boolean;
}

export default function CameraCapture({ onCapture, loading }: CameraCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onCapture(dataUrl, file);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            id="camera-input"
            disabled={loading}
          />
          <label
            htmlFor="camera-input"
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-16 h-16 mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-700 font-semibold">
                📸 Prendre une photo de vos ingrédients
              </p>
              <p className="text-xs text-gray-500">
                ou cliquez pour télécharger une image
              </p>
            </div>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full h-64 rounded-2xl overflow-hidden border-2 border-gray-200">
            <Image
              src={preview}
              alt="Captured ingredients"
              fill
              className="object-cover"
            />
          </div>
          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            📷 Reprendre une photo
          </button>
        </div>
      )}
    </div>
  );
}