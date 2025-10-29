import React, { useState } from 'react';
import ModelGenerator from './components/ModelGenerator';
import GarmentUploader from './components/GarmentUploader';
import MockupStudio from './components/MockupStudio';
import Header from './components/common/Header';

type AppStep = 'CREATE' | 'STUDIO';

// A placeholder App to handle the flow logic as described in the prompt
// The user asked for a flow where the generation happens on one screen and then moves to another.
// The provided components ModelGenerator and GarmentUploader have their own internal state and buttons.
// This App component structure is simplified to reflect that.
// A real-world implementation would lift state up from children to parent to enable the central "Generate Mock-up" button.
const AppWrapper: React.FC = () => {
    const [step, setStep] = useState<AppStep>('CREATE');
    const [modelImage, setModelImage] = useState<string | null>(null);
    const [garmentImage, setGarmentImage] = useState<string | null>(null);

    const handleMockupReady = (modelImg: string, garmentImg: string) => {
        setModelImage(modelImg);
        setGarmentImage(garmentImg);
        setStep('STUDIO');
    };
    
    const handleGoBack = () => {
      setModelImage(null);
      setGarmentImage(null);
      setStep('CREATE');
    };

    return (
        <div className="min-h-screen text-gray-800 font-sans">
            <Header />
            <main className="p-4 sm:p-6 md:p-8">
                {step === 'CREATE' && <GeneratorScreen onMockupReady={handleMockupReady} />}
                {step === 'STUDIO' && modelImage && garmentImage && (
                    <MockupStudio
                        modelImage={modelImage}
                        garmentImage={garmentImage}
                        onGoBack={handleGoBack}
                    />
                )}
            </main>
        </div>
    );
};

const GeneratorScreen: React.FC<{ onMockupReady: (model: string, garment: string) => void }> = ({ onMockupReady }) => {
    const [modelImage, setModelImage] = useState<string | null>(null);
    const [garmentImage, setGarmentImage] = useState<string | null>(null);

    return (
        <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">AI Mockup Generator</h1>
                <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">Create stunning, realistic apparel mockups in seconds. Define your model, upload your design, and let AI do the rest.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <ModelGenerator onModelGenerated={setModelImage} />
                <GarmentUploader onGarmentReady={setGarmentImage} />
            </div>

            <div className="mt-12 text-center">
                <button
                    onClick={() => {
                        if (modelImage && garmentImage) {
                            onMockupReady(modelImage, garmentImage);
                        }
                    }}
                    disabled={!modelImage || !garmentImage}
                    className="bg-printify-green hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-12 text-xl rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                    Generate Mockup
                </button>
                {(!modelImage || !garmentImage) && (
                  <p className="text-gray-500 mt-2 text-sm">Please generate a model and upload a valid garment to continue.</p>
                )}
            </div>
        </div>
    );
};

export default AppWrapper;