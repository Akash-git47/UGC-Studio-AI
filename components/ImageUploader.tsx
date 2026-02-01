
import React, { useState, useRef, useCallback } from 'react';
import type { ImageState } from '../types';
import { UploadIcon, XCircleIcon } from './Icons';

interface ImageUploaderProps {
  id: string;
  title: string;
  description?: string;
  imageState: ImageState;
  setImageState: React.Dispatch<React.SetStateAction<ImageState>>;
}

/**
 * Resizes an image to a maximum dimension while maintaining aspect ratio.
 * This ensures the payload sent to the Gemini API is within safe limits (usually < 4MB total).
 */
const resizeImage = (file: File, maxDimension: number = 1024): Promise<{ base64: string; preview: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Canvas context failed"));
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // We use JPEG for the optimized version to keep the size small
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, preview: dataUrl });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, title, description, imageState, setImageState }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processFile = useCallback(async (file: File | null) => {
    if (file && file.type.startsWith("image")) {
      setIsProcessing(true);
      try {
        const { base64, preview } = await resizeImage(file);
        setImageState({ 
            file: file, 
            preview: preview, 
            croppedBase64: base64 
        });
      } catch (err) {
        console.error("Image processing error:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [setImageState]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0] ?? null);
  };

  const handleRemoveImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setImageState({ file: null, preview: null, croppedBase64: null });
    if (inputRef.current) {
        inputRef.current.value = "";
    }
  }, [setImageState]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [processFile]);

  const hasImage = !!imageState.preview;

  return (
    <div className="flex flex-col h-full">
        <div className="mb-3 flex justify-between items-end">
             <div>
                <h4 className="text-lg font-bold text-slate-800">{title}</h4>
                {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
             </div>
             {hasImage && !isProcessing && (
                 <button onClick={handleRemoveImage} className="text-xs font-semibold text-red-500 hover:text-red-600">
                     Remove
                 </button>
             )}
        </div>
     
      <div 
        className={`relative w-full h-64 sm:h-[400px] rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden group border-2
        ${hasImage
            ? 'bg-slate-900 border-slate-900' 
            : `bg-slate-50 cursor-pointer ${isDragging ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-100'}` 
        }`}
        onClick={() => !hasImage && !isProcessing && inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={id}
          ref={inputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
        
        {/* State 0: Processing */}
        {isProcessing && (
          <div className="text-center p-6 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-slate-600">Optimizing image...</p>
          </div>
        )}

        {/* State 1: Empty / Drop Zone */}
        {!hasImage && !isProcessing && (
           <div className="text-center p-6 w-full flex flex-col items-center justify-center pointer-events-none">
             <div className={`p-4 rounded-full mb-3 transition-transform duration-300 ${isDragging ? 'bg-indigo-100 scale-110' : 'bg-white shadow-sm group-hover:scale-110'}`}>
                <UploadIcon />
             </div>
             <p className="font-semibold text-slate-700 text-sm sm:text-base">{isDragging ? 'Drop file here' : 'Click to Upload'}</p>
             <p className="text-xs text-slate-400 mt-1">JPG, PNG or WEBP</p>
           </div>
        )}
        
        {/* State 2: Image Preview */}
        {hasImage && !isProcessing && (
            <>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgydjJIMUMxeiIgZmlsbD0iIzMzMyIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-20"></div>
                
                <img 
                    src={imageState.preview!} 
                    alt="Preview" 
                    className="w-full h-full object-contain relative z-10 p-2" 
                />
                
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center z-20">
                    <button
                        onClick={handleRemoveImage}
                        className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transform hover:scale-105 transition-all flex items-center gap-2"
                        title="Remove Image"
                    >
                        <XCircleIcon />
                        <span className="font-bold text-sm">Remove</span>
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};
