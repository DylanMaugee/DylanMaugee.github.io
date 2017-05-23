window.onload = function () {
    var audioInputSelect = document.querySelector('select#audioSource');
    var videoSelect = document.querySelector('select#videoSource');
    var audioOutputSelect = document.querySelector('select#audioOutput');
    var myCam = document.querySelector('#webcam');

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

    // Get the devices infos to display on page
    function getMedias() {
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
                console.log(devices);
                devices.forEach(function (device) {
                    var option = document.createElement('option');
                    option.value = device.deviceId;
                    if (device.kind === 'audioinput') {
                        option.text = device.label ||
                            'microphone ' + (audioInputSelect.length + 1);
                        audioInputSelect.appendChild(option);
                    } else if (deviceInfo.kind === 'audiooutput') {
                        option.text = deviceInfo.label || 'speaker ' +
                            (audioOutputSelect.length + 1);
                        audioOutputSelect.appendChild(option);
                    } else if (device.kind === 'videoinput') {
                        option.text = device.label || 'camera ' + (videoSelect.length + 1);
                        videoSelect.appendChild(option);
                    } else {
                        console.log('Error getting media of user ', device);
                    }
                });
            })
            .catch(function (err) {
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

        if (window.stream) {
            window.stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }

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
    
    function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== 'undefined') {
    element.setSinkId(sinkId)
    .then(function() {
      console.log('Success, audio output device attached: ' + sinkId);
    })
    .catch(function(error) {
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

    function videoError(e) {
        console.log('Error with video')
    }

    audioInputSelect.onchange = changeSources;
    audioOutputSelect.onchange = changeAudioDestination;
    videoSelect.onchange = changeSources;

    startCam();
}
