import React, { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { ModelCharacteristics, Option } from '../types';
import { generateModelImage, isPublicFigure, changeModelPose } from '../services/geminiService';
import Spinner from './common/Spinner';
import { GENDER_OPTIONS, HEIGHT_OPTIONS, BODY_TYPE_OPTIONS, ETHNICITY_OPTIONS, HAIR_COLOR_OPTIONS, AGE_OPTIONS, POSE_OPTIONS, SHOOT_TYPE_OPTIONS } from '../constants';

interface ModelGeneratorProps {
    onModelGenerated: (imageBase64: string) => void;
}

const characteristicOptionsMap = {
    gender: GENDER_OPTIONS,
    height: HEIGHT_OPTIONS,
    bodyType: BODY_TYPE_OPTIONS,
    ethnicity: ETHNICITY_OPTIONS,
    hairColor: HAIR_COLOR_OPTIONS,
    age: AGE_OPTIONS,
    pose: POSE_OPTIONS,
    shootType: SHOOT_TYPE_OPTIONS,
};

const modelOptions: Option[] = [
    { label: 'Imagen 4.0 (Highest Quality)', value: 'imagen-4.0-generate-001' },
    { label: 'Gemini 2.5 Flash (Fast)', value: 'gemini-2.5-flash-image' },
];

const ModelGenerator: React.FC<ModelGeneratorProps> = ({ onModelGenerated }) => {
  const [characteristics, setCharacteristics] = useState<ModelCharacteristics>({
    gender: 'woman',
    height: 'average height',
    bodyType: 'average body',
    ethnicity: 'Caucasian',
    hairColor: 'brown hair',
    age: 'in their 20s',
    pose: 'standing pose',
    shootType: 'full-body shot',
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<keyof ModelCharacteristics | null>(null);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New state for generate/upload mode
  const [mode, setMode] = useState<'generate' | 'upload'>('generate');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [generationModel, setGenerationModel] = useState<string>('imagen-4.0-generate-001');
  
  const buildPrompt = (chars: ModelCharacteristics): string => {
    return `Create a photorealistic, hyperrealistic, professional photoshoot image of a ${chars.height} ${chars.ethnicity} ${chars.gender} ${chars.age} with an ${chars.bodyType} and ${chars.hairColor}, in a ${chars.pose}. The person should be looking directly at the camera with a neutral, pleasant expression. The background must be a completely plain, seamless studio white. The lighting should be soft and even, like a professional fashion shoot. The final image should be a ${chars.shootType}.`;
  };

  useEffect(() => {
    if (!useCustomPrompt) {
        setCustomPrompt(buildPrompt(characteristics));
    }
  }, [characteristics, useCustomPrompt]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setActiveDropdown(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async (promptOverride?: string) => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    const promptToUse = promptOverride || (useCustomPrompt ? customPrompt : buildPrompt(characteristics));
    try {
      const imageBase64 = await generateModelImage(promptToUse, generationModel);
      const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
      setGeneratedImage(imageUrl);
      onModelGenerated(imageBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNewPose = async () => {
    if (!generatedImage) {
        setError("No model generated yet to change pose.");
        return;
    }

    const currentPose = characteristics.pose;
    const otherPoses = POSE_OPTIONS.filter(p => p.value !== currentPose);
    if (otherPoses.length === 0) {
        setError("No other poses available.");
        return;
    }
    const randomPose = otherPoses[Math.floor(Math.random() * otherPoses.length)];

    setIsLoading(true);
    setError(null);
    try {
      const imageBase64 = generatedImage.split(',')[1];
      const newImageBase64 = await changeModelPose(imageBase64, randomPose.value);
      const newImageUrl = `data:image/jpeg;base64,${newImageBase64}`;
      setGeneratedImage(newImageUrl);
      onModelGenerated(newImageBase64);
      setCharacteristics(prev => ({...prev, pose: randomPose.value}));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while changing pose.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- Uploader Logic ---
  const validateAndSetModel = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setError(null);
    try {
      const isPublic = await isPublicFigure(file);
      if (isPublic) {
        setUploadError("Uploading images of public figures is not permitted. Please choose another image.");
        setGeneratedImage(null);
        onModelGenerated(""); // Clear any previous valid model
      } else {
        // It's a valid model, set it
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setGeneratedImage(reader.result as string);
          onModelGenerated(base64String);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown validation error occurred.';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setUploadError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
        validateAndSetModel(file);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadError("Please select a valid image file (PNG, JPG, etc.).");
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
    e.preventDefault(); e.stopPropagation(); setIsDragOver(true);
  };
  
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
  };

  const renderInteractivePrompt = () => {
    const characteristicValues = Object.values(characteristics) as string[];
    const promptParts = buildPrompt(characteristics).split(new RegExp(characteristicValues.join('|'), 'g'));
    let partIndex = 0;
    
    const characteristicMap = (Object.keys(characteristics) as Array<keyof ModelCharacteristics>).reduce((acc, key) => {
      const value = characteristics[key];
      acc[value] = key;
      return acc;
    }, {} as Record<string, keyof ModelCharacteristics>);
    
    const findKeyForValue = (val: string) => characteristicMap[val];

    return (
        <p className="text-gray-700 leading-relaxed bg-gray-100 p-4 rounded-md">
            {promptParts.map((part, index) => {
                 const value = characteristicValues[partIndex];
                 const key = value ? findKeyForValue(value) : undefined;
                 partIndex++;
                 return (
                    <React.Fragment key={index}>
                        {part}
                        {key && value && (
                            <span className="relative inline-block">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === key ? null : key)}
                                    className="text-printify-blue bg-blue-100 hover:bg-blue-200 font-semibold rounded px-2 py-1 transition-colors duration-200 cursor-pointer"
                                >
                                    {value}
                                </button>
                                {activeDropdown === key && (
                                    <div ref={dropdownRef} className="absolute z-20 mt-1 w-48 bg-white rounded-md shadow-lg border max-h-60 overflow-y-auto">
                                        {characteristicOptionsMap[key].map((option: Option) => (
                                            <a
                                                key={option.value}
                                                onClick={() => {
                                                    setCharacteristics(prev => ({...prev, [key]: option.value}));
                                                    setActiveDropdown(null);
                                                }}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {option.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </p>
    );
  };


  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <div className="bg-printify-green text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold">1</div>
            <h2 className="ml-4 text-2xl font-bold text-gray-800">
                {mode === 'generate' ? 'Define Your Model' : 'Upload Your Model'}
            </h2>
        </div>
        <button 
            onClick={() => setMode(mode === 'generate' ? 'upload' : 'generate')}
            className="text-sm font-medium text-printify-blue hover:underline"
        >
            {mode === 'generate' ? 'Or Upload Your Own' : 'Or Generate with AI'}
        </button>
      </div>
      
      {mode === 'generate' ? (
        <>
            <div className="space-y-4 mb-6">
                {renderInteractivePrompt()}

                <div>
                    <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">Generation Model</label>
                    <select
                        id="model-select"
                        value={generationModel}
                        onChange={(e) => setGenerationModel(e.target.value)}
                        className="bg-white block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-printify-blue focus:border-printify-blue sm:text-sm rounded-md shadow-sm"
                    >
                        {modelOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                        <input id="custom-prompt-toggle" type="checkbox" checked={useCustomPrompt} onChange={(e) => setUseCustomPrompt(e.target.checked)} className="focus:ring-printify-blue h-4 w-4 text-printify-blue border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="custom-prompt-toggle" className="font-medium text-gray-700">Custom Prompt Override</label>
                    </div>
                </div>
                {useCustomPrompt && (
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Enter your full custom prompt here..."
                        className="w-full p-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-printify-blue focus:border-transparent sm:text-sm rounded-md shadow-sm resize-y"
                        rows={5}
                    />
                )}
            </div>
            <button
                onClick={() => handleGenerate()}
                disabled={isLoading}
                className="w-full bg-printify-blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-blue-300"
            >
                {isLoading ? 'Generating...' : 'Generate Model'}
            </button>
        </>
      ) : (
        <div className="space-y-4 mb-6">
            <div
                onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                className={`relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 transition-colors min-h-[150px] ${isDragOver ? 'border-printify-blue bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
            >
                <input type="file" id="model-upload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={onFileInputChange} accept="image/png, image/jpeg" />
                {isUploading && <Spinner message="Analyzing image..." />}
                {uploadPreview && !isUploading && (
                    <img src={uploadPreview} alt="Model Preview" className="max-h-48 object-contain rounded-md" />
                )}
                {!uploadPreview && !isUploading && (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <label htmlFor="model-upload" className="font-medium text-printify-blue hover:text-blue-700 cursor-pointer">Upload a model</label>
                    <p className="text-xs text-gray-500">or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">Image must not contain public figures.</p>
                  </>
                )}
            </div>
            {uploadError && <p className="text-sm text-red-600 text-center">{uploadError}</p>}
        </div>
      )}

      <div className="mt-6 aspect-w-3 aspect-h-4 bg-gray-100 rounded-lg relative overflow-hidden min-h-[300px] flex items-center justify-center">
        {isLoading && <Spinner message="Creating model..." />}
        {error && <div className="p-4 text-red-600 text-center">{error}</div>}
        {generatedImage && !isLoading && (
          <img src={generatedImage} alt="Generated Model" className="w-full h-full object-cover" />
        )}
        {!generatedImage && !isLoading && !error && (
            <div className="text-center text-gray-500 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2">Your generated or uploaded model will appear here.</p>
            </div>
        )}
      </div>
       {generatedImage && !isLoading && (
         <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mode === 'generate' && (
                <button
                    onClick={handleGenerateNewPose}
                    className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300"
                >
                    Try Another Pose
                </button>
            )}
            <a
                href={generatedImage}
                download="printify-ai-model.jpeg"
                className={`w-full block text-center bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ${mode === 'upload' || !generatedImage ? 'sm:col-span-2' : ''}`}
            >
                Download Model
            </a>
        </div>
      )}
    </div>
  );
};

export default ModelGenerator;