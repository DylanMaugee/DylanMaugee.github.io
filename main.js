var videoElement = document.querySelector('video');
var audioInputSelect = document.querySelector('select#audioSource');
var audioOutputSelect = document.querySelector('select#audioOutput');
var videoSelect = document.querySelector('select#videoSource');
var filterSelect = document.querySelector('select#selectEffect');
var btnTestAudio = document.querySelector('#testAudio');
var btnTestVideo = document.querySelector('#testAudioVideo');
var selectors = [audioInputSelect, audioOutputSelect, videoSelect];
var isTestingAudio = false;
var filters = [
    'none',
    'grayscale',
    'sepia',
    'blur',
    'brightness',
    'contrast',
    'hue-rotate',
    'hue-rotate2',
    'hue-rotate3',
    'saturate',
    'invert'
];

function gotDevices(deviceInfos) {
    var values = selectors.map(function (select) {
        return select.value;
    });
    selectors.forEach(function (select) {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label ||
                'microphone ' + (audioInputSelect.length + 1);
            audioInputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'audiooutput') {
            option.text = deviceInfo.label || 'speaker ' +
                (audioOutputSelect.length + 1);
            audioOutputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1);
            videoSelect.appendChild(option);
        } else {
            console.log('Some other kind of source/device: ', deviceInfo);
        }
        selectors.forEach(function (select, selectorIndex) {
            if (Array.prototype.slice.call(select.childNodes).some(function (n) {
                return n.value === values[selectorIndex];
            })) {
                select.value = values[selectorIndex];
            }
        });
    }
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
    if (typeof element.sinkId !== 'undefined') {
        element.setSinkId(sinkId)
            .then(function () {
            console.log('Success, audio output device attached: ' + sinkId);
        })
            .catch(function (error) {
            var errorMessage = error;
            if (error.name === 'SecurityError') {
                errorMessage = 'You need to use HTTPS for selecting audio output ' +
                    'device: ' + error;
            }
            console.error(errorMessage);
            // Jump back to first output device in the list as it's the default.
            audioOutputSelect.selectedIndex = 0;
        });
    } else {
        console.warn('Browser does not support output device selection.');
    }
}

function changeAudioDestination() {
    var audioDestination = audioOutputSelect.value;
    attachSinkId(videoElement, audioDestination);
}

function gotStream(stream) {
    window.stream = stream; // make stream available to console
    videoElement.srcObject = stream;
    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

function start() {
    if (window.stream) {
        window.stream.getTracks().forEach(function (track) {
            track.stop();
        });
    }
    stopCamBtn.removeAttribute('hidden');
    videoElement.removeAttribute('hidden');
    var audioSource = audioInputSelect.value;
    var videoSource = videoSelect.value;
    var constraints = {
        audio: {
            deviceId: audioSource ? {
                exact: audioSource
            } : undefined
        },
        video: {
            deviceId: videoSource ? {
                exact: videoSource
            } : undefined
        }
    };
    navigator.mediaDevices.getUserMedia(constraints).
    then(gotStream).then(gotDevices).catch(handleError);
}

function testAudio() {
    window.AudioContext = window.AudioContext ||
        window.webkitAudioContext;

    var context = new AudioContext();

    navigator.getUserMedia({
        audio: true
    }, function (stream) {
        var microphone = context.createMediaStreamSource(stream);
        var filter = context.createBiquadFilter();

        // microphone -> filter -> destination.
        microphone.connect(filter);
        filter.connect(context.destination);
    }, errorCallback);
}

audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;
videoSelect.onchange = start;

filters.forEach(function(index){
    var optionFilter = document.createElement('option');
    optionFilter.value = index;
    optionFilter.text = index;
    filterSelect.appendChild(optionFilter);
});

function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

function testAudio() {
    if(!isTestingAudio){
        var audioSource = audioInputSelect.value;

        navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: audioSource ? {
                    exact: audioSource
                } : undefined
            }
        }).then(gotStream).then(gotDevices).catch(handleError);
        isTestingAudio = true;
        btnTestAudio.innerHTML = "Stop Test";
    }else{
        if (window.stream) {
            window.stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        isTestingAudio = false;
        btnTestAudio.innerHTML = "Test audio";
    }
}

function stopTest() {
    if (window.stream) {
        window.stream.getTracks().forEach(function (track) {
            track.stop();
        });
    }
    videoElement.setAttribute('hidden', 'true');
    stopCamBtn.setAttribute('hidden', 'true');
}

function applyFilter(){
    var selectedFilter = filterSelect.value;
    videoElement.className = '';
    videoElement.classList.add(selectedFilter);
}