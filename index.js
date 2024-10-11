let state = false;
let mediaRecorder;
let audioChunks = [];
let audioStream = null;
const button = document.getElementById('toggle-record');
const audioPlayback = document.getElementById('audio-playback');

// Función para solicitar acceso al micrófono
const requestAudioStream = async () => {
    if (!audioStream) {
        try {
            console.log('Solicitando acceso al micrófono...');
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Acceso al micrófono concedido.');
        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            throw error;
        }
    } else {
        console.log('Acceso al micrófono ya concedido anteriormente.');
    }
    return audioStream;
};

// Función para enviar el audio a DigitalOcean
const sendAudioToDigitalOcean = async (audioBlob) => {
    const url = 'https://goldfish-app-kfo84.ondigitalocean.app/upload'; // Reemplaza con la URL de tu servidor

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav'); // Agrega el Blob como un archivo con un nombre

    try {
        console.log('Enviando audio al servidor de DigitalOcean...');
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Archivo subido con éxito a DigitalOcean:', data);
            return data; // Devuelve la respuesta del servidor
        } else {
            console.error('Error al subir el archivo a DigitalOcean:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error durante la subida del audio a DigitalOcean:', error);
    }
};

// Función para convertir audio a WAV y normalizarlo
const normalizeAudio = (audioBlob) => {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const reader = new FileReader();

        reader.onload = async (event) => {
            const audioData = await audioContext.decodeAudioData(event.target.result);
            const offlineContext = new OfflineAudioContext(1, audioData.length, audioContext.sampleRate);

            const source = offlineContext.createBufferSource();
            source.buffer = audioData;

            // Procesar audio si es necesario
            source.connect(offlineContext.destination);
            source.start(0);

            offlineContext.startRendering().then((renderedBuffer) => {
                const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
                resolve(wavBlob);
            }).catch(reject);
        };

        reader.readAsArrayBuffer(audioBlob);
    });
};

// Función para convertir un buffer a un Blob de formato WAV
const bufferToWave = (abuffer, len) => {
    const numOfChannels = abuffer.numberOfChannels;
    const length = len * 2 + 44; // 44 bytes de encabezado WAV
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];

    for (let i = 0; i < numOfChannels; i++) {
        channels.push(abuffer.getChannelData(i));
    }

    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeUTFBytes(view, 8, 'WAVE');
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, 44100, true); // Sample rate
    view.setUint32(28, 44100 * 2, true); // Byte rate
    view.setUint16(32, numOfChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, length - 44, true);

    let offset = 44;
    for (let i = 0; i < len; i++) {
        for (let channel = 0; channel < numOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, channels[channel][i])); // Normalize sample to [-1, 1]
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
};

// Iniciar la grabación
const startRecording = async () => {
    console.log('Iniciando grabación...');
    button.classList.add('recording');
    const stream = await requestAudioStream();

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        console.log('Fragmento de audio disponible.');
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        console.log('Grabación detenida, procesando audio...');
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Cambiado a webm para asegurar la compatibilidad

        if (audioBlob.size > 0) {
            // Reproducir el audio grabado
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayback.src = audioUrl;
            audioPlayback.controls = true;
            console.log('Audio listo para reproducirse.');

            // Normalizar y convertir el audio a WAV
            const normalizedAudioBlob = await normalizeAudio(audioBlob);
            if (normalizedAudioBlob) {
                // Enviar el audio normalizado al servidor
                const response = await sendAudioToDigitalOcean(normalizedAudioBlob);
                console.log("Respuesta del servidor:", response);
            }
        } else {
            console.error('El Blob de audio está vacío.');
        }

        audioChunks = []; // Limpiar fragmentos de audio
        console.log('Fragmentos de audio limpiados.');
    };

    mediaRecorder.start();
    console.log('Grabación iniciada.');
};

const stopRecording = () => {
    console.log('Deteniendo grabación...');
    button.classList.remove('recording');
    mediaRecorder.stop(); // Esto disparará el evento onstop
    console.log('Grabación detenida.');
};

const toggleRecording = () => {
    state = !state;
    console.log('Estado de grabación:', state);
    state ? startRecording() : stopRecording();
};

button.addEventListener('click', toggleRecording);
