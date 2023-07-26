async function createOffscreenDocument() {
    chrome.action.setBadgeText({ text: '3' });
    if (!await chrome.offscreen.hasDocument()) {
        return await chrome.offscreen.createDocument({ 
            url: chrome.runtime.getURL("background.html"),
            reasons: [ chrome.offscreen.Reason.USER_MEDIA ],
            justification: "need persistence" 
        });
    }
}

chrome.runtime.onMessage.addListener(async (request, sender, response) => {
    if (request.createOffscreenDocument) {
        createOffscreenDocument()
    }
    if (request.prefersLight) {
        chrome.action.setIcon({
            path: {
                "16": "icons/16.png",
                "48": "icons/48.png",
                "128": "icons/128.png"
            }
        });
    }
});

createOffscreenDocument();