# Printify AI Mockup Generator

This is a sophisticated web application designed for Printify users to generate hyperrealistic mockups of models wearing custom-designed apparel. Built with React, TypeScript, and powered by the Google Gemini API, it provides a seamless two-step workflow for creating stunning product visuals for e-commerce stores.

![Application Screenshot](https://i.imgur.com/example.png) <!-- Replace with an actual screenshot -->

## ✨ Core Features

*   **AI Model Generation**: Create unique, photorealistic models from scratch by defining characteristics like gender, ethnicity, body type, and more.
*   **Model Upload & Safety**: Upload your own model images with an integrated safety check to prevent the use of recognizable public figures.
*   **AI Garment Validation**: The application intelligently verifies that uploaded designs are actual articles of clothing (t-shirts, hoodies, etc.).
*   **Hyperrealistic Mockups**: Automatically merge the model and garment into a single, seamless, and professional-looking mockup.
*   **Scene Reimagination**: Take your mockup to the next level by placing your model in any environment you can describe, from a bustling city street to a serene beach.
*   **High-Fashion Video Generation**: Animate any static mockup or reimagined scene into a short, dynamic fashion video using the powerful Veo model.
*   **Download Assets**: Easily download any generated image or video to use in your marketing materials.

---

## 🚀 Application Flow

The user experience is divided into two main stages:

1.  **Creation Screen**: This is the starting point where users prepare their assets.
    *   **Define/Upload Model**: Users can either generate a new AI model using a set of intuitive controls or upload their own image.
    *   **Upload Garment**: Users upload their T-shirt or hoodie design. The design is validated by AI in the background.
    *   **Generate Mockup**: A central "Generate Mockup" button remains disabled until both a valid model and a valid garment are ready. Clicking it transitions the user to the Mockup Studio.

2.  **Mockup Studio**: This is the creative workspace.
    *   The initial, high-quality mockup is automatically generated and displayed.
    *   Users can then use the "Reimagine Scene" tool to generate new images of the model in different backgrounds.
    *   Each generated image in the gallery can be transformed into a short video, with a built-in flow to handle API key selection required for the Veo model.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend**: React, TypeScript
*   **Styling**: Tailwind CSS
*   **AI/ML**: Google Gemini API (`@google/genai`)
    *   **Image Generation**: `imagen-4.0-generate-001` (High Quality), `gemini-2.5-flash-image` (Fast Generation & Editing)
    *   **Image Understanding**: `gemini-2.5-flash-image` (Garment & Public Figure Validation)
    *   **Video Generation**: `veo-3.1-fast-generate-preview`

---

## 🧩 Component Breakdown

The application is structured into a set of logical, reusable components.

### Core Components

*   **`App.tsx`**: The main application component. It acts as a controller, managing the state for the current step (`CREATE` or `STUDIO`) and passing down the necessary data (model and garment images) to the appropriate screen.

*   **`ModelGenerator.tsx`**: A feature-rich component responsible for providing a model image. It has two modes:
    *   **Generate Mode**: Features an innovative "interactive prompt" where users can click on parts of a sentence to change model characteristics. It allows switching between high-quality and fast-generation models. It also includes a "Try Another Pose" button for quick variations.
    *   **Upload Mode**: Provides a drag-and-drop interface for users to upload their own model images. It triggers an AI-powered safety check to ensure the image does not contain a public figure.

*   **`GarmentUploader.tsx`**: A dedicated component for uploading the garment design. It features a drag-and-drop UI and uses the Gemini API to validate that the uploaded image is a piece of clothing, providing clear feedback to the user.

*   **`MockupStudio.tsx`**: The creative hub of the application.
    *   On mount, it calls the Gemini service to create the initial photorealistic mockup.
    *   It contains the UI for the "Reimagine Scene" feature, allowing users to generate a gallery of new images.
    *   It manages the complex state for video generation for each gallery item, including loading, success, and error states. It also handles the `window.aistudio.openSelectKey()` flow required for video generation.

### Common/Utility Components

*   **`common/Header.tsx`**: A simple, reusable header displaying the application's logo and title.
*   **`common/Spinner.tsx`**: A reusable loading spinner with a message, used to indicate that an AI operation is in progress.

### Services and Configuration

*   **`services/geminiService.ts`**: This is the heart of the AI integration. It abstracts all API calls to the Google Gemini API.
    *   `generateModelImage()`: Generates a model using Imagen or Gemini Flash.
    *   `validateGarment()` / `isPublicFigure()`: Perform AI-based validation checks on uploaded images.
    *   `createMockup()`: Merges the model and garment images.
    *   `reimagineMockup()`: Generates a new scene for an existing mockup.
    *   `generateFashionVideo()`: Handles the asynchronous, long-running video generation task, including polling for completion and fetching the final video data.

*   **`constants.ts`**: A centralized file for storing application-wide constants, such as the dropdown options for model characteristics.

*   **`types.ts`**: Contains all TypeScript type definitions and interfaces, ensuring type safety across the application.

---

## ⚙️ Getting Started

### Prerequisites

*   An API key for the Google Gemini API.
*   Node.js and a package manager (npm/yarn).

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/printify-ai-mockup-generator.git
    cd printify-ai-mockup-generator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    This application requires an API key to function. This key should be provided through an environment variable. If running in an environment like AI Studio, this is typically handled for you.

4.  **Start the development server:**
    ```bash
    npm run start
    ```

The application should now be running in your browser.
