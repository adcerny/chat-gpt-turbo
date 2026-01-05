# ChatGPT DOM Trimmer Chrome Extension

This extension collapses older ChatGPT messages into lightweight text-only blocks so that the page keeps a small DOM and uses less memory during long conversations.

## Features
- Automatically collapses older conversation turns while keeping the latest ones expanded.
- Shows a small indicator with how many messages were collapsed.
- Replaces older, heavy DOM trees with lightweight placeholders to keep memory and rendering costs down.
- Works on chatgpt.com and chat.openai.com.

## How to load locally
1. Open **chrome://extensions** in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder from this repository.
4. Open ChatGPT and the trimmer will start collapsing older messages automatically.

## Configuration
The extension currently keeps the latest 12 messages expanded. If you want to keep more (or fewer) messages expanded, adjust the `RENDER_LIMIT` constant near the top of `content.js`.
