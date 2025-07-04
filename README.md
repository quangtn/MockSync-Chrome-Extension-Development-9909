# MockSync Chrome Extension

A powerful Chrome extension for real-time content manipulation and wireframing capabilities.

## Features

- **Live Wireframe Mode**: Toggle wireframe view on any webpage
- **Text Manipulation**: Replace text with AI-generated alternatives or placeholders
- **Image/Media Handling**: Replace images with placeholder content
- **AI Integration**: Generate content using AI with different tones and styles
- **Undo/Redo**: Full history tracking for all modifications
- **Export Capabilities**: Export modified pages as HTML/CSS
- **Version Management**: Save and manage different versions

## Installation

### For Development

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project directory
5. The extension will be installed and ready to use

### For Production

1. Run `npm run build` to build the React components
2. Pack the extension files for distribution
3. Upload to Chrome Web Store

## Usage

### Basic Operation

1. Click the MockSync icon in your browser toolbar
2. Toggle "Wireframe Mode" to activate the extension
3. Select your desired mode:
   - **Text Mode**: Click on text elements to replace with placeholders
   - **Image Mode**: Click on images to replace with placeholder images
   - **AI Mode**: Select elements and generate AI content

### AI Content Generation

1. Activate AI Mode
2. Click on text elements to mark them as AI targets
3. In the popup, configure:
   - Content Type (headline, body, CTA, description)
   - Tone/Style (professional, casual, friendly, technical, creative)
   - Language preference
4. Click "Generate Content" to apply AI-generated text

### History Management

- Use Undo/Redo buttons to navigate through changes
- Reset button restores all elements to original state
- All changes are tracked automatically

### Export Options

- **Export HTML**: Download the modified page as HTML
- **Export CSS**: Download the stylesheets
- **Save Version**: Save current state with timestamp

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome extension API
- **Content Script**: Handles page manipulation and UI overlay
- **Background Script**: Manages extension state and API calls
- **Popup Interface**: Provides control panel for extension features

### Security

- Follows Chrome extension security best practices
- Minimal permissions required
- Secure content script injection
- No external API calls without user consent

### Performance

- Efficient DOM manipulation
- Minimal memory footprint
- Optimized for large pages
- Responsive design for all screen sizes

## Development

### Project Structure

```
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script
├── content.css           # Content script styles
├── popup.html            # Extension popup
├── popup.js              # Popup functionality
├── popup.css             # Popup styles
├── icons/                # Extension icons
└── src/                  # React application (optional)
```

### Building

```bash
# Install dependencies
npm install

# Build React components (if using)
npm run build

# Lint code
npm run lint
```

### Testing

1. Load the extension in Chrome
2. Navigate to any webpage
3. Test all functionality modes
4. Verify export capabilities
5. Check responsive design

## API Integration

### AI Content Generation

The extension includes a mock AI integration. To connect to a real AI service:

1. Update the `generateAIContent` function in `background.js`
2. Add your API credentials to the manifest permissions
3. Implement proper error handling and rate limiting

### Example Integration

```javascript
async function generateAIContent(params) {
  const response = await fetch('https://api.your-ai-service.com/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  
  return await response.json();
}
```

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Opera 74+
- Brave (Chromium-based)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Changelog

### Version 1.0.0
- Initial release
- Core wireframing functionality
- AI content generation
- Export capabilities
- History management