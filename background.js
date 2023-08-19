const tabs = {};

// change extension icon if light mode preferred
if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
    chrome.runtime.sendMessage({ prefersLight: 1 });
}

// On runtime message received.
chrome.runtime.onMessage.addListener(function(request, sender, response) {
    console.debug("Background received request: ", request)
    
    const tab = tabs[request.id] ??= {};

    // Enable getting volume for slider from tabs-array so we can eliminate the local storage variable from popup
    if (request.getVolume) {
        response({ volume: tab.volume });
        return true;
    }
    
    // If volume is default disable everything.
    if (request.volume == 100) {
        console.debug("Background got volume = 100, shutting down audiocontext and closing stream.");
        if (tab.audioContext !== undefined) {
            tab.audioContext.close();
        }
        if (tab.streamNode !== undefined) {
            tab.streamNode.mediaStream.getAudioTracks()[0].stop();
        }
        
        delete tabs[request.id];
        /// Object.getOwnPropertyNames(tab).forEach(k => delete tab[k]);
        
        return true;
    }
    
    if (tab.audioContext === undefined && request.streamId) {
        console.debug("Background got streamId and no audiocontext exists for tab. Capturing tab audio.");
        captureTab(request);
    } else if (request.volume !== undefined && tab.gainNode !== undefined) {
        setVolume(request);
    }

    // Store "percent" volume value for slider control map it from 0-100 to 0-1 and scale it exponentially.
    function setVolume() {
        console.debug("Background got volume, adjusting gainnode gain")
        tab.volume = request.volume;
        tab.gainNode.gain.value = Math.pow((request.volume / 100), 2);
    }

    function captureTab() {
        navigator.mediaDevices.getUserMedia({
            video: false,
            // audio: { deviceId: { exact: stream } }
            // audio: { deviceId: { exact: stream }, mediaStreamSource: { exact: "tab" } }
            // below gets translated to following according to chrome://webrtc-internals/, randomize id ofcox
            // audio: {deviceId: {exact: [streamId]}, mediaStreamSource: {exact: ["tab"]}, disableLocalEcho: {exact: false}}
            // audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: request.streamId, googDisableLocalEcho: false, disableLocalEcho: false, suppressLocalAudioPlayback: false, autoGainControl: false, echoCancellation: false } }
            audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: request.streamId } }
        }).then((stream) => {
            tab.audioContext = new AudioContext();
            tab.streamNode = tab.audioContext.createMediaStreamSource(stream);
            tab.gainNode = tab.audioContext.createGain();
            tab.streamNode.connect(tab.gainNode);
            tab.gainNode.connect(tab.audioContext.destination);
            setVolume(request);
        }).catch((e) => {
            console.error(e);
        });   
    }
})

