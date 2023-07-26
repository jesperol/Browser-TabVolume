// Setup extension.
document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let tab = tabs[0]
        let tabIdStr = tab.id.toString();

        // Get input fields.
        let buttonStop = document.getElementById('stop');
        let rangeVolume = document.getElementById('range');
        let numberVolume = document.getElementById('number');
        
        buttonStop.addEventListener('click', () => {
            // Set volume to default 100 to disable the system.
            chrome.runtime.sendMessage({ id: tab.id, volume: 100 });
            chrome.storage.local.remove(tabIdStr);
            window.close();
        });

        async function setVolume(vol) {
            let msg = { id: tab.id, volume: vol };
            if (!(tab.id in (await chrome.tabCapture.getCapturedTabs()).map((tab) => tab.tabId))) {
                try {
                    msg.streamId = await chrome.tabCapture.getMediaStreamId({ });
                } catch (error) {
                    // getCapturedTabs seem to only return tabs captured by same extension, let errors pass (somewhat silently, and explicit)
                    console.debug(error);
                }
                console.debug("streamId: " + msg.streamId);
            }
            chrome.runtime.sendMessage(msg);
            chrome.storage.local.set({ [tabIdStr]: vol });
        }
        
        rangeVolume.addEventListener('change', function() {
            numberVolume.value = this.value;
            setVolume(this.value);
        });
        
        rangeVolume.addEventListener('input', function() {
            numberVolume.value = this.value;
        });
        
        numberVolume.addEventListener('change', function() {
            rangeVolume.value = this.value;
            setVolume(this.value);
        });
        
        // Create the offscreen document if not exists
        chrome.runtime.sendMessage({ createOffscreenDocument: 1 });
        
        // Get volume level from storage
        chrome.storage.local.get(tabIdStr, (items) => {
            let volume = items[tabIdStr] ?? 100;
            if (volume != 100) {
                chrome.runtime.sendMessage({ id: tab.id, volume: volume });
            }
            rangeVolume.value = numberVolume.value = volume;
        });
    });
});
