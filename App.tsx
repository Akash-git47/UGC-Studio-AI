
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Spinner } from './components/Spinner';
import { SparklesIcon, DownloadIcon } from './components/Icons';
import type { ImageState } from './types';
import { generateUGCImage } from './services/geminiService';

const CATEGORIES = [
  {
    id: "lifestyle",
    label: "Lifestyle & Daily Routine",
    icon: "🏠",
    subOptions: [
      "Home",
      "Living Room",
      "Bedroom",
      "Kitchen",
      "Balcony",
      "Office desk setup / workspace",
      "Co-working space",
      "Study table / college library",
      "Gym or fitness studio",
      "Morning routine bathroom setup",
      "Kitchen countertop"
    ]
  },
  {
    id: "outdoor",
    label: "Outdoor & Public Spaces",
    icon: "🏙️",
    subOptions: [
      "Café / Coffee shop",
      "Street style shots",
      "Shopping mall / storefronts",
      "Park or garden",
      "Beach / lake side",
      "Rooftop terrace",
      "Outdoor market",
      "Metro station aesthetics"
    ]
  },
  {
    id: "creative",
    label: "Creative & Aesthetic Spots",
    icon: "🎨",
    subOptions: [
      "Neon light rooms",
      "Art gallery or museum",
      "Vintage/retro-themed cafés",
      "Bookstore or reading corner",
      "Graffiti walls",
      "Minimal clean white wall",
      "Wooden textured background",
      "Aesthetic curtains with natural light"
    ]
  },
  {
    id: "social",
    label: "Social & Event Spaces",
    icon: "🎉",
    subOptions: [
      "Night club environment",
      "College campus",
      "Event stalls",
      "Music concert ambience",
      "Friends’ hangout spaces",
      "Restaurant table setup"
    ]
  },
  {
    id: "nature",
    label: "Nature & Travel Themes",
    icon: "🌿",
    subOptions: [
      "Forest trail",
      "Hill station viewpoint",
      "Waterfall spot",
      "Bicycle ride background",
      "Car interior shots",
      "Travel suitcase / airport lounge"
    ]
  },
  {
    id: "product",
    label: "Product-Focused",
    icon: "📸",
    subOptions: [
      "Flat-lay studio setup",
      "Solid color backdrop",
      "Minimal aesthetic shelf styling",
      "Marble/stone textured surface",
      "Wooden tabletop",
      "Soft fabric textures",
      "LED-lit product table"
    ]
  }
];

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<ImageState>({ file: null, preview: null, croppedBase64: null });
  const [productImage, setProductImage] = useState<ImageState>({ file: null, preview: null, croppedBase64: null });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection State
  const [activeCategory, setActiveCategory] = useState<string>("lifestyle");
  const [selectedSubScene, setSelectedSubScene] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!personImage.croppedBase64 || !productImage.croppedBase64) {
      setError("Please upload both a person and a product image.");
      return;
    }

    if (!selectedSubScene) {
      setError("Please select a specific scene atmosphere.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // The ImageUploader now resizes and converts to image/jpeg, 
      // so we use 'image/jpeg' as the explicit MIME type for best compatibility.
      const resultBase64 = await generateUGCImage(
        personImage.croppedBase64,
        'image/jpeg',
        productImage.croppedBase64,
        'image/jpeg',
        selectedSubScene
      );

      setGeneratedImage(`data:image/png;base64,${resultBase64}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [personImage, productImage, selectedSubScene]);
  
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ugc-gen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isButtonDisabled = !personImage.croppedBase64 || !productImage.croppedBase64 || !selectedSubScene || isLoading;

  const currentCategoryData = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-50 selection:bg-indigo-500 selection:text-white pb-20 w-full">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-40 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Header */}
        <header className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6">
          <h1 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            UGC Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI</span>
          </h1>
          <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
            Generate authentic social media content in seconds. Blend your product with any model in any vibe.
          </p>
        </header>

        {/* Main Work Surface */}
        <main className="space-y-6 md:space-y-8">
          
          {/* Step 1: Uploads */}
          <section className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-5 md:p-10">
            <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-slate-200/60 pb-4 md:pb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm shrink-0">1</div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Upload Assets</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <ImageUploader
                id="person-uploader"
                title="Model / Person"
                description="Upload a clear photo of the person."
                imageState={personImage}
                setImageState={setPersonImage}
              />
              <ImageUploader
                id="product-uploader"
                title="Product"
                description="Upload the product image."
                imageState={productImage}
                setImageState={setProductImage}
              />
            </div>
          </section>

          {/* Step 2: Scene Selection */}
          <section className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-5 md:p-10 transition-all duration-300">
             <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm shrink-0">2</div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Select Atmosphere</h2>
            </div>

            <div className="space-y-6">
              {/* Main Categories */}
              <div className="flex flex-wrap gap-2 md:gap-3 pb-4 border-b border-slate-200/50">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl transition-all duration-200 text-xs md:text-sm font-semibold
                      ${activeCategory === category.id
                        ? 'bg-slate-800 text-white shadow-md transform scale-[1.02]'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-indigo-300'
                      }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>

              {/* Sub Options */}
              <div>
                <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">
                  {currentCategoryData?.label} Options
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentCategoryData?.subOptions.map((subOption) => (
                    <button
                      key={subOption}
                      onClick={() => setSelectedSubScene(subOption)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 text-sm
                        ${selectedSubScene === subOption
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500 font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm'
                        }`}
                    >
                      {subOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Action Area */}
          <div className="flex flex-col items-center justify-center pt-8 pb-12">
             <button
              onClick={handleGenerate}
              disabled={isButtonDisabled}
              className={`group relative inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-bold text-white rounded-2xl transition-all duration-300 w-full md:w-auto
                ${isButtonDisabled
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-1 active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <>
                  <Spinner /> <span>Creating magic...</span>
                </>
              ) : (
                <>
                  <SparklesIcon /> <span>Generate Content</span>
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-6 px-6 py-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100 flex flex-col items-center gap-2 animate-fade-in w-full max-w-xl text-center">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-bold uppercase tracking-wider text-xs">Generation Failed</span>
                </div>
                <p className="opacity-90">{error}</p>
                <button 
                  onClick={handleGenerate}
                  className="mt-2 text-xs font-bold underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Results */}
          {generatedImage && (
            <section className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
               <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white font-bold text-sm shrink-0">✓</div>
                    <h2 className="text-xl font-bold text-slate-900">UGC Content Ready</h2>
                 </div>
                 <button 
                  onClick={handleDownload}
                  className="hidden sm:flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                 >
                   <DownloadIcon /> Download
                 </button>
               </div>
               
               <div className="p-8 flex flex-col items-center">
                 <div className="relative group rounded-xl overflow-hidden shadow-lg ring-1 ring-slate-200">
                    <img 
                      src={generatedImage} 
                      alt="Generated UGC" 
                      className="max-h-[700px] w-full object-contain block"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                       <button
                          onClick={handleDownload}
                          className="bg-white text-slate-900 font-bold py-3 px-6 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-200 flex items-center gap-2"
                      >
                          <DownloadIcon /> Download Image
                      </button>
                    </div>
                 </div>
                 <button 
                  onClick={handleDownload}
                  className="mt-6 flex sm:hidden items-center gap-2 text-sm font-bold text-white bg-indigo-600 px-6 py-3 rounded-xl shadow-lg w-full justify-center"
                 >
                   <DownloadIcon /> Download Image
                 </button>
               </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;
