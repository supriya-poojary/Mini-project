# Speech to Text Studio

A lightweight browser-based speech transcription project with OpenAI-powered summarization.

## Features

- Speech-to-text transcription using the browser Speech Recognition API
- Editable transcript area
- Copy, clear, and save transcript actions
- AI-generated summary, key points, and action items
- Responsive UI for desktop and mobile
- Secure backend API so the OpenAI key stays out of the frontend

## How to Run

1. Copy `.env.example` to `.env`.
2. Add your OpenAI API key to `OPENAI_API_KEY` in `.env`.
3. Install dependencies with `npm install`.
4. Start the app with `npm start`.
5. Open `http://localhost:3000` in a recent Chrome or Edge browser.
6. Allow microphone access when prompted.
7. Choose the recognition language.
8. Start recording and review the transcript.
9. Save the transcript or open the summary page.

## Project Improvements Made

- Added a secure backend OpenAI summary endpoint
- Kept the API key on the server instead of the frontend
- Replaced brittle click handling with explicit button logic
- Fixed transcript state management by consistently using textarea `value`
- Added a working save flow that downloads the transcript as a `.txt` file
- Added clearer user feedback for empty, success, warning, and error states
- Rebuilt the layout and styling for better responsiveness and maintainability
- Added AI summary output with key points and action items

## Browser Support

- Best experience: Google Chrome, Microsoft Edge
- Limited support: browsers without `SpeechRecognition` can still type, save, and summarize manually
