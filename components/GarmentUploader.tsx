
import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { validateGarment } from '../services/geminiService';
import Spinner from './common/Spinner';

interface GarmentUploaderProps {
  onGarmentReady: (imageBase64: string) => void;
}

const GarmentUploader: React.FC<GarmentUploaderProps> = ({ onGarmentReady }) => {
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setGarmentFile(file);
      setError(null);
      setIsValid(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setGarmentPreview(reader.result as string);
        validateAndSetGarment(file);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please select a valid image file (PNG, JPG, etc.).");
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files ? e.target.files[0] : null);
  };
  
  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFileChange(e.dataTransfer.files ? e.dataTransfer.files[0] : null);
  }, []);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const validateAndSetGarment = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const valid = await validateGarment(file);
      setIsValid(valid);
      if (valid) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          onGarmentReady(base64String);
        };
        reader.readAsDataURL(file);
      } else {
        setError("This image does not appear to be a garment. Please upload another.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown validation error occurred.';
      setError(errorMessage);
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 h-full">
      <div className="flex items-center mb-6">
        <div className="bg-printify-green text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold">2</div>
        <h2 className="ml-4 text-2xl font-bold text-gray-800">Upload Garment Design</h2>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative aspect-w-3 aspect-h-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 transition-colors ${isDragOver ? 'border-printify-blue bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
      >
        <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onFileInputChange}
            accept="image/png, image/jpeg"
        />
        {isLoading && <Spinner message="Validating image..." />}
        {garmentPreview && (
            <img src={garmentPreview} alt="Garment Preview" className="max-h-full max-w-full object-contain rounded-md" />
        )}
        {!garmentPreview && (
          <>
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m3-3H7" />
            </svg>
            <label htmlFor="file-upload" className="font-medium text-printify-blue hover:text-blue-700 cursor-pointer">
              Upload a file
            </label>
            <p className="text-xs text-gray-500">or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
          </>
        )}
      </div>
      
      {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
      {isValid === true && <p className="mt-2 text-sm text-green-600 text-center font-semibold">✓ Garment validated successfully!</p>}

    </div>
  );
};

export default GarmentUploader;
