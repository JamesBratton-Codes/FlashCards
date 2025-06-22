# AI Flashcard Generator

This is a modern, responsive flashcard application built with React. It uses AI to automatically convert your raw notes into a structured, study-ready deck of flashcards.

## Features

-   **AI-Powered Formatting:** Paste in your notes or upload a text/markdown file, and the app uses a GPT model to format them into a Q&A format.
-   **Interactive Study Sessions:** Flip cards to reveal answers, and rate your confidence with "I knew it" or "Didn't know."
-   **Adaptive Learning:** Questions you don't know are recycled back into the deck for you to try again.
-   **Performance Tracking:** At the end of each session, view your accuracy and a running history of your performance over multiple attempts.
-   **Modern UI:** A clean, beautiful interface with smooth 3D animations.

## Prerequisites

-   [Node.js](https://nodejs.org/) (which includes npm) installed on your system.
-   An API key from a GPT provider. **Note:** Currently, the application is configured to use the OpenAI API (`gpt-3.5-turbo`). Support for other models can be added in the future.

## How to Run

1.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd flashcard-app
    ```

2.  **Install Dependencies:**
    This will install all the necessary packages for the application.
    ```bash
    npm install
    ```

3.  **Run the Application:**
    You can run the app in two ways:

    **A) For Development:**
    This command starts the app in development mode with live reloading. Ideal for making code changes.
    ```bash
    npm start
    ```

    **B) As a Packaged App (Recommended for normal use):**
    This command builds the app into a highly optimized, static set of files and serves it. This is the best way to run it for studying.
    ```bash
    npm run serve
    ```

4.  **Open in Browser:**
    Once running, the app will be available at `http://localhost:3000` (for `serve`) or another port specified in the terminal.

## How to Use

1.  Enter your GPT API key. The app will save it in your browser's local storage so you don't have to enter it every time.
2.  Paste your notes into the text area or upload a `.md` or `.txt` file.
3.  Click "Run".
4.  The AI will format your notes into flashcards, and your study session will begin! 