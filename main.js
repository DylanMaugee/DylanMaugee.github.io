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


/*********************** START Medias Settings ***********************/

// DOM Elements
var videoElement = document.querySelector('video');
var audioInputSelect = document.querySelector('select#audioSource');
var audioOutputSelect = document.querySelector('select#audioOutput');
var ouputLabel = document.querySelector('label#audioOutput');
var videoSelect = document.querySelector('select#videoSource');
var filterSelect = document.querySelector('select#selectEffect');
var btnTestAudio = document.querySelector('#testAudio');
var btnTestVideo = document.querySelector('#testVideoAudio');
var btnTestOutput = document.querySelector("#testOutput");

// Vars used for the Volume Meter 
var instantMeter = document.querySelector('meter');
var instantValueDisplay = instantMeter.value;
try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new AudioContext();
} catch (e) {
    alert('Web Audio API not supported.');
}

// Other Vars
var selectors = [audioInputSelect, audioOutputSelect, videoSelect];
var isTestingAudio = false;
var isTestingVideo = false;

if (isChrome) {
    audioOutputSelect.removeAttribute("hidden");
    ouputLabel.removeAttribute("hidden");
}

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

// Call to get devices 
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
    if (isTestingAudio) {
        var soundMeter = window.soundMeter = new SoundMeter(window.audioContext);
        soundMeter.connectToSource(stream, function (e) {
            if (e) {
                alert(e);
                return;
            }
            setInterval(function () {
                instantMeter.value = instantValueDisplay.innerText =
                    soundMeter.instant.toFixed(2);
            }, 200);
        });
    }

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

// OnChange Events 
audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;
videoSelect.onchange = start;

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
        instantMeter.removeAttribute("hidden");
    } else {
        if (window.stream) {
            window.stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        isTestingAudio = false;
        btnTestAudio.innerHTML = "Test audio";
        instantMeter.setAttribute("hidden", "true");
    }
}
/*********************** END Medias Settings ***********************/


/*********************** START Setup Sound Meter ***********************/
function SoundMeter(context) {
    this.context = context;
    this.instant = 0.0;
    this.script = context.createScriptProcessor(2048, 1, 1);
    var that = this;
    this.script.onaudioprocess = function (event) {
        var input = event.inputBuffer.getChannelData(0);
        var i;
        var sum = 0.0;
        var clipcount = 0;
        for (i = 0; i < input.length; ++i) {
            sum += input[i] * input[i];
            if (Math.abs(input[i]) > 0.99) {
                clipcount += 1;
            }
        }
        that.instant = Math.sqrt(sum / input.length);
        // Tweak used because the bar wasn't big enough
        that.instant += 0.1;
    };
}

SoundMeter.prototype.connectToSource = function (stream, callback) {
    console.log('SoundMeter connecting');
    try {
        this.mic = this.context.createMediaStreamSource(stream);
        this.mic.connect(this.script);
        this.script.connect(this.context.destination);
        if (typeof callback !== 'undefined') {
            callback(null);
        }
    } catch (e) {
        console.error(e);
        if (typeof callback !== 'undefined') {
            callback(e);
        }
    }
};
SoundMeter.prototype.stop = function () {
    console.log('SoundMeter disconnecting');
    this.mic.disconnect();
    this.script.disconnect();
};

/*********************** END Setup Sound Meter ***********************/
