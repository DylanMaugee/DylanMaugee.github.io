/*********************** START Get User Browser ***********************/

var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0; // Opera 8.0+

var isFirefox = typeof InstallTrigger !== 'undefined'; // Firefox 1.0+

var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
    return p.toString() === "[object SafariRemoteNotification]";
})(!window['safari'] || safari.pushNotification); // Safari 3.0+

var isIE = /*@cc_on!@*/ false || !!document.documentMode; // Internet Explorer 6-11

var isEdge = !isIE && !!window.StyleMedia; // Edge 20+

var isChrome = !!window.chrome && !!window.chrome.webstore; // Chrome 1+
/*********************** END Get User Browser ***********************/

if (!window.AudioContext) {
    if (!window.webkitAudioContext) {
        alert('no audiocontext found');
    }
    window.AudioContext = window.webkitAudioContext;
}


/*********************** START Medias Settings ***********************/

// DOM Elements
var videoElement = document.querySelector('video');
var audioInputSelect = document.querySelector('select#audioSource');
var audioOutputSelect = document.querySelector('select#audioOutput');
var videoSelect = document.querySelector('select#videoSource');
var filterSelect = document.querySelector('select#selectEffect');
var btnTestAudio = document.querySelector('#testAudio');
var btnTestVideo = document.querySelector('#testVideoAudio');
var btnTestOutput = document.querySelector("#testOutput");
var context = new AudioContext();
var canvas = document.querySelector("#canvas");
var canvasContext = canvas.getContext("2");
var javascriptNode;

// Other Vars
var selectors = [audioInputSelect, audioOutputSelect, videoSelect];
var isTestingAudio = false;
var isTestingVideo = false;
var filters = ['none', 'grayscale', 'sepia', 'blur', 'brightness', 'contrast', 'hue-rotate', 'hue-rotate2', 'hue-rotate3', 'saturate', 'invert'];


// Get all devices (cam + audio + output) and store their infos in <select>
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

// Create the stream object
function gotStream(stream) {
    window.stream = stream; // make stream available to console
    videoElement.srcObject = stream;
    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

// Start the test cam + audio
function start() {
    if (!isTestingVideo) {
        if (window.stream) {
            window.stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
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
        btnTestVideo.innerHTML = "Stop camera test";
        isTestingVideo = true;
    } else {
        if (window.stream) {
            window.stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        videoElement.setAttribute('hidden', 'true');
        btnTestVideo.innerHTML = "Test camera";
        isTestingVideo = false;
    }
}

audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;
videoSelect.onchange = start;

// Fill filters <select> with array filter 
filters.forEach(function (index) {
    var optionFilter = document.createElement('option');
    optionFilter.value = index;
    optionFilter.text = index;
    filterSelect.appendChild(optionFilter);
});

function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

// Create constraints for audio testing
function testAudio() {
    if (!isTestingAudio) {
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
    } else {
        if (window.stream) {
            window.stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        isTestingAudio = false;
        btnTestAudio.innerHTML = "Test audio";
    }
}

// Apply a filter to the webcam
function applyFilter() {
    var selectedFilter = filterSelect.value;
    videoElement.className = '';
    videoElement.classList.add(selectedFilter);
}



function setupAudioNodes() {

    // setup a javascript node
    javascriptNode = context.createScriptProcessor(2048, 1, 1);
    // connect to destination, else it isn't called
    javascriptNode.connect(context.destination);

    // setup a analyzer
    analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    analyser2 = context.createAnalyser();
    analyser2.smoothingTimeConstant = 0.0;
    analyser2.fftSize = 1024;

    // create a buffer source node
    sourceNode = context.createBufferSource();
    splitter = context.createChannelSplitter();

    // connect the source to the analyser and the splitter
    sourceNode.connect(splitter);

    // connect one of the outputs from the splitter to
    // the analyser
    splitter.connect(analyser, 0, 0);
    splitter.connect(analyser2, 1, 0);

    // we use the javascript node to draw at a
    // specific interval.
    analyser.connect(javascriptNode);

    // and connect to destination
    sourceNode.connect(context.destination);
}

javascriptNode.onaudioprocess = function () {

    // get the average, bincount is fftsize / 2
    var array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    var average = getAverageVolume(array)

    // clear the current state
    ctx.clearRect(0, 0, 60, 130);

    // set the fill style
    ctx.fillStyle = gradient;

    // create the meters
    ctx.fillRect(0, 130 - average, 25, 130);
}

function getAverageVolume(array) {
    var values = 0;
    var average;

    var length = array.length;

    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
        values += array[i];
    }

    average = values / length;
    return average;
}

var gradient = ctx.createLinearGradient(0, 0, 0, 130);
gradient.addColorStop(1, '#000000');
gradient.addColorStop(0.75, '#ff0000');
gradient.addColorStop(0.25, '#ffff00');
gradient.addColorStop(0, '#ffffff');
// load the sound
setupAudioNodes();
/*********************** END Medias Settings ***********************/
