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

// Función para convertir audio a WAV usando Convertio
const convertAudioToWav = async (audioBlob) => {
    const formData = new FormData();
    const apiKey = '794a14b25dce327ca6b01298a66a8cec'; // Reemplaza con tu API Key de Convertio
    formData.append('apikey', apiKey);
    formData.append('input', 'raw'); // Cambiado a 'raw' para enviar el archivo
    formData.append('file', audioBlob, 'audio.wav'); // Usa el Blob como archivo
    formData.append('outputformat', 'wav');

    const convertioUrl = 'https://api.convertio.co/convert';
    try {
        const response = await fetch(convertioUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Error en Convertio: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.data && data.data.output) {
            // Obtiene la URL del archivo convertido
            const fileUrl = data.data.output[0].url;
            const fileResponse = await fetch(fileUrl);
            const fileBlob = await fileResponse.blob(); // Obtiene el archivo en formato Blob

            return fileBlob; // Devuelve el Blob del archivo WAV corregido
        } else {
            throw new Error('No se pudo obtener el archivo convertido.');
        }
    } catch (error) {
        console.error('Error al convertir el audio:', error);
    }
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
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // Crea un Blob de audio WAV

        if (audioBlob.size > 0) {
            // Reproducir el audio grabado
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayback.src = audioUrl;
            audioPlayback.controls = true;
            console.log('Audio listo para reproducirse.');

            // Convertir el audio a WAV usando Convertio
            const convertedAudioBlob = await convertAudioToWav(audioBlob);
            if (convertedAudioBlob) {
                // Enviar el audio corregido al servidor
                const response = await sendAudioToDigitalOcean(convertedAudioBlob);
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
