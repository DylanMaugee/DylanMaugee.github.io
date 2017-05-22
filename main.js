window.onload = function () {
    var audioInputSelect = document.querySelector('select#audioSource');
    var videoSelect = document.querySelector('select#videoSource');
    var audioOutputSelect = document.querySelector('select#audioOutput');
    var myCam = document.querySelector('#webcam')
    var test;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

    // Get the devices infos to display on page
    function getMedias() {
        navigator.mediaDevices.enumerateDevices().then(function(devices) {
            devices.forEach(function(device) {
                var option = document.createElement('option');
                option.value = device.deviceId;
                if (device.kind === 'audioinput') {
                    option.text = device.label ||
                        'microphone ' + (audioInputSelect.length + 1);
                    audioInputSelect.appendChild(option);
                } else if (device.kind === 'videoinput') {
                    option.text = device.label || 'camera ' + (videoSelect.length + 1);
                    videoSelect.appendChild(option);
                } else {
                    console.log('Error getting media of user ', device);
                }
            });
        })
            .catch(function(err) {
            console.log(err.name + ": " + err.message);
        });
    }

    function startCam() {
        //Get user medias info
        if (navigator.getUserMedia) {
            navigator.getUserMedia({
                video: true,
                audio: true
            }, handleVideo, videoError);
        }
    }

    function changeSources() {
        var audioSrc = audioInputSelect.value;
        var videoSrc = videoSelect.value;
        var constraints = {
            audio: {
                deviceId: audioSrc ? {
                    exact: audioSrc
                } : undefined
            },
            video: {
                deviceId: videoSrc ? {
                    exact: videoSrc
                } : undefined
            }
        };
        navigator.mediaDevices.getUserMedia(constraints, handleVideo, videoError);
    }

    // Create the video/audio stream
    function handleVideo(stream) {
        getMedias();
        console.log(stream);
        window.stream = stream;
        myCam.srcObject = stream;
    }

    function changeAudioDestination() {
        var audioDestination = audioOutputSelect.value;
    }

    function videoError(e) {
        console.log('Error with video')
    }

    audioInputSelect.onchange = changeSources;
    audioOutputSelect.onchange = changeAudioDestination;
    videoSelect.onchange = changeSources;

    startCam();
}
