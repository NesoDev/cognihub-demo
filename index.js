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

// Función para convertir los datos de audio a formato WAV
const bufferToWave = (buffer, numberOfChannels) => {
    const sampleRate = 44100; // Tasa de muestreo
    const format = 1; // Formato PCM
    const bitDepth = 16; // Profundidad de bits
    const byteRate = sampleRate * numberOfChannels * bitDepth / 8;
    const blockAlign = numberOfChannels * bitDepth / 8;
    const bufferLength = buffer.length * numberOfChannels * 2 + 44;

    const wavBuffer = new Uint8Array(bufferLength);
    const view = new DataView(wavBuffer.buffer);

    // Escribir encabezado WAV
    let offset = 0;
    const writeString = (str) => {
        for (let i = 0; i < str.length; i++) {
            wavBuffer[offset++] = str.charCodeAt(i);
        }
    };
    writeString('RIFF'); // Chunk ID
    view.setUint32(4, bufferLength - 8, true); // Chunk size
    writeString('WAVE'); // Format
    writeString('fmt '); // Subchunk1 ID
    view.setUint32(16, 16, true); // Subchunk1 size
    view.setUint16(20, format, true); // Audio format
    view.setUint16(22, numberOfChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bitDepth, true); // Bits per sample
    writeString('data'); // Subchunk2 ID
    view.setUint32(40, buffer.length * numberOfChannels * 2, true); // Subchunk2 size

    // Copiar datos de audio a WAV
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer[i][channel])); // Clipping
            const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF; // Convertir a int16
            view.setInt16(44 + i * 2 * numberOfChannels + channel * 2, intSample, true);
        }
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
};

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
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Crea un Blob de audio en formato WebM
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());

        const wavBlob = bufferToWave(audioBuffer.getChannelData(0), audioBuffer.numberOfChannels); // Convierte a WAV

        if (wavBlob.size > 0) {
            // Reproducir el audio grabado
            const audioUrl = URL.createObjectURL(wavBlob);
            audioPlayback.src = audioUrl;
            audioPlayback.controls = true;
            console.log('Audio listo para reproducirse.');

            // Enviar el audio corregido al servidor
            const response = await sendAudioToDigitalOcean(wavBlob);
            console.log("Respuesta del servidor:", response);
        } else {
            console.error('El Blob de audio WAV está vacío.');
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
