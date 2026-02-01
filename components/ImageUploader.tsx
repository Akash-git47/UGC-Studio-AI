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

export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, title, description, imageState, setImageState }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const processFile = useCallback((file: File | null) => {
    if (file && file.type.startsWith("image")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 data (remove "data:image/xxx;base64," prefix)
        const base64Data = result.split(',')[1];
        
        setImageState({ 
            file: file, 
            preview: result, 
            croppedBase64: base64Data 
        });
      };
      reader.readAsDataURL(file);
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
             {hasImage && (
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
        onClick={() => !hasImage && inputRef.current?.click()}
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
        
        {/* State 1: Empty / Drop Zone */}
        {!hasImage && (
           <div className="text-center p-6 w-full flex flex-col items-center justify-center pointer-events-none">
             <div className={`p-4 rounded-full mb-3 transition-transform duration-300 ${isDragging ? 'bg-indigo-100 scale-110' : 'bg-white shadow-sm group-hover:scale-110'}`}>
                <UploadIcon />
             </div>
             <p className="font-semibold text-slate-700 text-sm sm:text-base">{isDragging ? 'Drop file here' : 'Click to Upload'}</p>
             <p className="text-xs text-slate-400 mt-1">JPG, PNG or WEBP</p>
           </div>
        )}
        
        {/* State 2: Image Preview (No Cropping) */}
        {hasImage && (
            <>
                {/* Checkered pattern for transparency */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgydjJIMUMxeiIgZmlsbD0iIzMzMyIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-20"></div>
                
                <img 
                    src={imageState.preview!} 
                    alt="Preview" 
                    className="w-full h-full object-contain relative z-10 p-2" 
                />
                
                {/* Hover overlay for actions */}
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