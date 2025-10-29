import React, { useState, useEffect } from 'react';
import { createMockup, reimagineMockup, generateFashionVideo } from '../services/geminiService';
import Spinner from './common/Spinner';

interface MockupStudioProps {
  modelImage: string;
  garmentImage: string;
  onGoBack: () => void;
}

type VideoGenerationStatus = 'idle' | 'loading' | 'success' | 'error';
interface VideoGenerationState {
    status: VideoGenerationStatus;
    url?: string;
    error?: string;
}

const MockupStudio: React.FC<MockupStudioProps> = ({ modelImage, garmentImage, onGoBack }) => {
  const [mainMockup, setMainMockup] = useState<string | null>(null);
  const [reimaginedImages, setReimaginedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReimagining, setIsReimagining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reimagineError, setReimagineError] = useState<string | null>(null);
  const [reimaginePrompt, setReimaginePrompt] = useState('');
  const [videoGenerationState, setVideoGenerationState] = useState<Record<number, VideoGenerationState>>({});

  useEffect(() => {
    const generateInitialMockup = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const mockupBase64 = await createMockup(modelImage, garmentImage);
        setMainMockup(`data:image/jpeg;base64,${mockupBase64}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create mockup.');
      } finally {
        setIsLoading(false);
      }
    };

    generateInitialMockup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelImage, garmentImage]);

  const handleReimagine = async () => {
    if (!mainMockup || !reimaginePrompt.trim()) return;
    setIsReimagining(true);
    setReimagineError(null);

    try {
        const mainMockupBase64 = mainMockup.split(',')[1];
        const newImageBase64 = await reimagineMockup(mainMockupBase64, reimaginePrompt);
        setReimaginedImages(prev => [...prev, `data:image/jpeg;base64,${newImageBase64}`]);
        setReimaginePrompt('');
    } catch (err) {
        setReimagineError(err instanceof Error ? err.message : 'Failed to reimagine scene.');
    } finally {
        setIsReimagining(false);
    }
  };

  const handleGenerateVideo = async (index: number) => {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        await window.aistudio.openSelectKey();
    }

    setVideoGenerationState(prev => ({ ...prev, [index]: { status: 'loading' } }));
    try {
        const imageBase64 = reimaginedImages[index].split(',')[1];
        const videoUrl = await generateFashionVideo(imageBase64);
        setVideoGenerationState(prev => ({ ...prev, [index]: { status: 'success', url: videoUrl } }));
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setVideoGenerationState(prev => ({ ...prev, [index]: { status: 'error', error: errorMessage } }));
    }
  };


  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="text-center mb-8 relative">
         <button
          onClick={onGoBack}
          className="absolute left-0 top-0 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition duration-300 flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">Mockup Studio</h1>
        <p className="mt-3 text-lg text-gray-500">Your generated mockup. Now, let's get creative!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="relative aspect-w-3 aspect-h-4 bg-gray-100 rounded-2xl shadow-lg overflow-hidden border">
          {isLoading && <Spinner message="Generating your mockup..." />}
          {error && <div className="p-4 text-red-600">{error}</div>}
          {mainMockup && <img src={mainMockup} alt="Generated Mockup" className="w-full h-full object-cover" />}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Reimagine the Scene</h2>
          <p className="text-gray-600 mb-6">Describe a new environment or situation for your model.</p>
          <div className="flex flex-col gap-4">
            <textarea
                value={reimaginePrompt}
                onChange={(e) => setReimaginePrompt(e.target.value)}
                placeholder="e.g., in a cozy, rustic coffee shop"
                className="w-full p-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-printify-blue focus:border-transparent sm:text-sm rounded-md shadow-sm resize-none"
                rows={3}
                disabled={isReimagining || !mainMockup}
            />
            <button
                onClick={handleReimagine}
                disabled={isReimagining || !mainMockup || !reimaginePrompt.trim()}
                className="bg-printify-blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
                {isReimagining ? 'Reimagining...' : 'Reimagine Scene'}
            </button>
          </div>
           {reimagineError && <p className="mt-2 text-sm text-red-600">{reimagineError}</p>}
        </div>
      </div>
      
      {reimaginedImages.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">Your Gallery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {reimaginedImages.map((imgSrc, index) => {
                    const videoState = videoGenerationState[index] || { status: 'idle' };
                    const isVideoReady = videoState.status === 'success' && videoState.url;

                    return (
                        <div key={index} className="group relative aspect-w-3 aspect-h-4 bg-gray-900 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
                            {isVideoReady ? (
                                <video src={videoState.url} className="w-full h-full object-cover" controls autoPlay loop muted playsInline />
                            ) : (
                                <img src={imgSrc} alt={`Reimagined scene ${index + 1}`} className="w-full h-full object-cover" />
                            )}
                            
                            {videoState.status === 'loading' && <Spinner message="Creating video... This may take a few minutes." />}
                            {videoState.status === 'error' && (
                                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center p-4">
                                    <p className="text-white text-center text-sm mb-2">{videoState.error}</p>
                                    <button onClick={() => handleGenerateVideo(index)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                                        Retry
                                    </button>
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <a
                                    href={isVideoReady ? videoState.url : imgSrc}
                                    download={isVideoReady ? `reimagined-video-${index + 1}.mp4` : `reimagined-mockup-${index + 1}.jpeg`}
                                    className="bg-white text-gray-800 font-bold py-2 px-3 rounded-lg shadow-md flex items-center space-x-2 text-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Download</span>
                                </a>
                                {!isVideoReady && videoState.status !== 'loading' && (
                                     <button
                                        onClick={() => handleGenerateVideo(index)}
                                        className="bg-printify-green hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg shadow-md flex items-center space-x-2 text-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
                                        </svg>
                                        <span>Generate Video</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
      )}

      <div className="mt-12 text-center">
        <button
          onClick={onGoBack}
          className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300"
        >
          Start Over
        </button>
      </div>
    </div>
  );
};

export default MockupStudio;