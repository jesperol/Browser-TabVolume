const tabs = [];

// change extension icon if dark mode preferred
if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
    chrome.runtime.sendMessage({ prefersLight: 1 });
}

// On runtime message received.
chrome.runtime.onMessage.addListener(function(request, sender, response) {
    console.debug("Background received request: ", request)
    
    // Setup empty object if not called previously.
    if (tabs[request.id] === undefined) {
        tabs[request.id] = {};
    }

    // Enable getting volume for slider from tabs-array so we can eliminate the local storage variable from popup
    if (request.getVolume) {
        response({ volume: tabs[request.id].volume });
        return true;
    }
    
    // If volume is default disable everything.
    if (request.volume == 100) {
        console.debug("Background got volume = 100, shutting down audiocontext and closing stream.");
        if (tabs[request.id].audioContext !== undefined) {
            tabs[request.id].audioContext.close();
        }
        if (tabs[request.id].streamNode !== undefined) {
            tabs[request.id].streamNode.mediaStream.getAudioTracks()[0].stop();
        }
        tabs[request.id] = {};
        
        return true;
    }
    
    if (tabs[request.id].audioContext === undefined && request.streamId) {
        console.debug("Background got streamId and no audiocontext exists for tab. Capturing tab audio.");
        captureTab(request);
    } else if (request.volume !== undefined && tabs[request.id].gainNode !== undefined) {
        setVolume(request);
    }
})

// Store "percent" volume value for slider control map it from 0-100 to 0-1 and scale it exponentially.
function setVolume(request) {
    console.debug("Background got volume, adjusting gainnode gain")
    tabs[request.id].volume = request.volume;
    tabs[request.id].gainNode.gain.value = Math.pow((request.volume / 100), 2);
}

function captureTab(request) {
    navigator.mediaDevices.getUserMedia({
        video: false,
        // audio: { deviceId: { exact: stream } }
        // audio: { deviceId: { exact: stream }, mediaStreamSource: { exact: "tab" } }
        // below gets translated to following according to chrome://webrtc-internals/, randomize id ofcox
        // audio: {deviceId: {exact: [stream]}, mediaStreamSource: {exact: ["tab"]}, disableLocalEcho: {exact: false}}
        // audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: request.streamId, googDisableLocalEcho: false, disableLocalEcho: false, suppressLocalAudioPlayback: false, autoGainControl: false, echoCancellation: false } }
        audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: request.streamId } }
    }).then((stream) => {
        window.tabStream = stream; // store reference to the stream
        tabs[request.id].audioContext = new AudioContext();
        tabs[request.id].streamNode = tabs[request.id].audioContext.createMediaStreamSource(window.tabStream);
        tabs[request.id].gainNode = tabs[request.id].audioContext.createGain();
        tabs[request.id].streamNode.connect(tabs[request.id].gainNode);
        tabs[request.id].gainNode.connect(tabs[request.id].audioContext.destination);
        setVolume(request);
    }).catch((e) => {
        console.error(e);
    });   
}