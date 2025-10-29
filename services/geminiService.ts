import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd show a user-friendly error.
  // Here, we'll throw to make it clear during development.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const base64ToGenerativePart = (base64Data: string, mimeType: string) => {
    return {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
  };

export const generateModelImage = async (prompt: string, model: string): Promise<string> => {
    try {
        if (model === 'imagen-4.0-generate-001') {
            const response = await ai.models.generateImages({
                model: model,
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '3:4',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                return response.generatedImages[0].image.imageBytes;
            } else {
                throw new Error('Image generation failed, no images returned.');
            }
        } else if (model === 'gemini-2.5-flash-image') {
             const response = await ai.models.generateContent({
                model: model,
                contents: { parts: [{ text: `${prompt} The image must have a 3:4 aspect ratio.` }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                }
            });
            const parts = response.candidates?.[0]?.content?.parts;
            if (parts) {
                for (const part of parts) {
                    if (part.inlineData) {
                        return part.inlineData.data;
                    }
                }
            }
            const textResponse = response.text;
            if (textResponse) {
                console.error("Image generation failed. Model returned text:", textResponse);
                throw new Error(`Model Error: ${textResponse}`);
            }
            throw new Error('Image generation failed, no image data returned.');
        } else {
            throw new Error(`Unsupported model for image generation: ${model}`);
        }
    } catch (error) {
        console.error("Error generating model image:", error);
        if (error instanceof Error && error.message.startsWith('Model Error:')) {
            throw error;
        }
        throw new Error("Failed to generate model image. Please try again.");
    }
};


export const validateGarment = async (imageFile: File): Promise<boolean> => {
    const prompt = "Is the object in this image a piece of clothing like a t-shirt, hoodie, or sweater? Please answer with only 'yes' or 'no'.";
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, {text: prompt}] },
        });

        const text = response.text.trim().toLowerCase();
        return text.includes('yes');
    } catch (error) {
        console.error("Error validating garment:", error);
        throw new Error("Failed to validate the garment image.");
    }
};

export const isPublicFigure = async (imageFile: File): Promise<boolean> => {
    const prompt = "Is the person in this image a recognizable public figure, such as a celebrity, politician, or famous athlete? Please answer with only 'yes' or 'no'.";
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, { text: prompt }] },
        });

        const text = response.text.trim().toLowerCase();
        return text.startsWith('yes');
    } catch (error) {
        console.error("Error checking for public figure:", error);
        throw new Error("Failed to analyze the uploaded model image.");
    }
};


export const createMockup = async (modelImageBase64: string, garmentImageBase64: string): Promise<string> => {
    const prompt = `Place the garment design from the second image onto the person in the first image. The garment should look natural on the person's body. CRITICAL: The garment's design, including all colors, shapes, and details, must be transferred EXACTLY as it appears in the second image without any alterations, additions, or omissions. The person's face, body, hair, pose, and expression must also remain identical to the first image. The background must be a completely plain, seamless studio white. The final result should be a photorealistic mockup.`;
    
    try {
        const modelPart = base64ToGenerativePart(modelImageBase64, 'image/jpeg');
        const garmentPart = base64ToGenerativePart(garmentImageBase64, 'image/png'); // Assuming PNG for transparency

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }, modelPart, garmentPart ]},
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        
        const textResponse = response.text;
        if (textResponse) {
            console.error("Mockup generation failed. Model returned text:", textResponse);
            throw new Error(`Model Error: ${textResponse}`);
        }

        throw new Error('No image data returned from mockup generation.');
    } catch (error) {
        console.error("Error creating mockup:", error);
        if (error instanceof Error && error.message.startsWith('Model Error:')) {
            throw error;
        }
        throw new Error("Failed to create the mockup.");
    }
};

export const changeModelPose = async (modelImageBase64: string, newPose: string): Promise<string> => {
    const prompt = `Take the person in this image and change their pose to '${newPose}'. It is CRITICAL that the person's identity, face, body characteristics, and hair remain exactly the same. Only the pose should change. The background must remain a completely plain, seamless studio white. The lighting should remain soft and even, like a professional fashion shoot.`;

    try {
        const modelPart = base64ToGenerativePart(modelImageBase64, 'image/jpeg');
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }, modelPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });
        
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        
        const textResponse = response.text;
        if (textResponse) {
            console.error("Pose change failed. Model returned text:", textResponse);
            throw new Error(`Model Error: ${textResponse}`);
        }
        
        throw new Error('No image data returned from pose change.');

    } catch (error) {
        console.error("Error changing model pose:", error);
         if (error instanceof Error && error.message.startsWith('Model Error:')) {
            throw error;
        }
        throw new Error("Failed to change the model's pose.");
    }
};

export const reimagineMockup = async (mockupImageBase64: string, situation: string): Promise<string> => {
    const prompt = `Recreate this exact image of the person wearing the garment, but place them in a new environment: ${situation}. The person, their pose, and the garment must remain identical, only the background and lighting should change to match the new scene.`;

    try {
        const mockupPart = base64ToGenerativePart(mockupImageBase64, 'image/jpeg');
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }, mockupPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });
        
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        
        const textResponse = response.text;
        if (textResponse) {
            console.error("Re-imagination failed. Model returned text:", textResponse);
            throw new Error(`Model Error: ${textResponse}`);
        }
        
        throw new Error('No image data returned from re-imagination.');

    } catch (error) {
        console.error("Error re-imagining mockup:", error);
         if (error instanceof Error && error.message.startsWith('Model Error:')) {
            throw error;
        }
        throw new Error("Failed to re-imagine the mockup.");
    }
};

export const generateFashionVideo = async (imageBase64: string): Promise<string> => {
    // Re-create the AI instance right before the call to get the latest key
    const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const prompt = "Animate this image into a 4-second video. The model should move slowly and subtly, like in a high-fashion video shot. All characteristics of the model, their clothing, and the background environment must be perfectly preserved from the original image.";
    
    try {
        let operation: any = await videoAI.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: imageBase64,
                mimeType: 'image/jpeg',
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16', // Use portrait aspect ratio for model shots
            }
        });

        // Polling loop to check for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            operation = await videoAI.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('Video generation completed but no download link was found.');
        }

        const videoUrlWithKey = `${downloadLink}&key=${process.env.API_KEY}`;
        
        const response = await fetch(videoUrlWithKey);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to fetch video data. Status:', response.status, 'Body:', errorBody);
            throw new Error(`Failed to fetch video data: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error generating fashion video:", error);

        // Make error message detection more robust to handle raw JSON errors from the SDK
        let errorMessageText = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessageText = error.message;
        } else if (typeof error === 'object' && error !== null) {
            errorMessageText = JSON.stringify(error);
        } else if (typeof error === 'string') {
            errorMessageText = error;
        }

        if (errorMessageText.includes("Requested entity was not found.") || errorMessageText.includes("API key not valid")) {
             // Specific error for bad API key. Add more guidance for the user.
            throw new Error("API key is invalid or not found. Please select a valid key and ensure the 'Generative Language API' is enabled on your Cloud project.");
        }
        
        throw new Error("Failed to generate the video. Please try again.");
    }
};