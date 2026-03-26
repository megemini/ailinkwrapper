# AI Link Wrapper

A Chrome extension that allows you to open links through configured proxy/wrapper URLs via context menu.

## Background

Modern AI search tools often provide special debugging URLs that allow you to inspect and analyze search results in detail. This extension was built to streamline the debugging workflow in your browser. Instead of manually copying and pasting URLs together, simply configure your debugging service URLs once, then right-click any link to instantly open it through your preferred debugging proxy—making the iteration process faster and more efficient.

## Demo

![Demo](docs/demo.gif)

## Features

- Right-click on any link to see "Open Link Via" menu options
- Configure custom proxy URLs and labels
- Automatically concatenate proxy URLs with the clicked link
- Address bar (Omnibox) quick access: type `al` + Tab to open links via configured proxies
- Persistent configuration stored in Chrome sync storage

## Usage

1. **Add Proxy URLs**: Click the extension icon, enter a label and proxy URL, then click "Add Proxy"
2. **Open Links**: Right-click any link → "Open Link Via" → Select your configured proxy
3. **Delete Proxies**: Click the "Delete" button next to a proxy configuration

### Address Bar (Omnibox)

1. Type `al` in the address bar, then press **Tab** to activate the extension
2. Type `<proxy-name> <URL>`, e.g. `myproxy https://target.com/page`
3. Suggestions will auto-complete matching proxy/domain rule names as you type
4. Press **Enter** to open in the current tab, or **Alt+Enter** to open in a new tab

## Example

- Configured URL: `https://example.com/api/`
- Clicked link: `https://target.com/page`
- Result: Opens `https://example.com/api/https://target.com/page` in new tab

## Installation

1. Download or clone this repository
2. Open `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select this folder

## Files

- `manifest.json` - Extension configuration
- `popup.html/js` - Settings UI
- `background.js` - Context menu and link handling

## License

MIT License - See [LICENSE](LICENSE) file for details
