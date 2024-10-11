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

// Función para enviar el audio a Convertio para convertir a WAV
const convertToWav = async (audioBlob) => {
    const apiKey = '794a14b25dce327ca6b01298a66a8cec'; // Reemplaza con tu API Key de Convertio
    const url = 'https://api.convertio.co/convert';

    // Convertir el Blob a un formato base64
    const reader = new FileReader();
    const base64Audio = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // Obtener solo la parte base64
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
    });

    const requestBody = {
        apikey: apiKey,
        input: 'raw', // Usamos 'raw' porque vamos a enviar el contenido
        file: base64Audio,
        filename: 'audio.wav', // Nombre del archivo
        outputformat: 'wav' // Formato de salida deseado
    };

    try {
        console.log('Enviando audio a Convertio...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Error en Convertio: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Conversión a WAV completada:', responseData);
        return responseData; // Devuelve los datos de respuesta de Convertio
    } catch (error) {
        console.error('Error al convertir el archivo:', error);
    }
};

// Función para enviar el audio convertido a DigitalOcean
const sendAudioToDigitalOcean = async (url) => {
    const uploadUrl = 'https://goldfish-app-kfo84.ondigitalocean.app/upload'; // Reemplaza con la URL de tu servidor

    try {
        console.log('Enviando archivo convertido al servidor DigitalOcean...');
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }), // Aquí asumo que el servidor espera un JSON con la URL del archivo
        });

        if (!response.ok) {
            throw new Error(`Error al subir el archivo a DigitalOcean: ${response.status}`);
        }

        const data = await response.json();
        console.log('Archivo subido a DigitalOcean con éxito:', data);
        return data; // Devuelve la respuesta del servidor
    } catch (error) {
        console.error('Error durante la subida al servidor:', error);
    }
};

// Definición de la función createTagsQuestions
const createTagsQuestions = (element, response) => {
    console.log("Procesando la respuesta del servidor:", response);
    const p = document.createElement('p');
    p.textContent = JSON.stringify(response);
    element.appendChild(p);
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
        const audioBlob = new Blob(audioChunks, { type: 'audio/x-wav' });

        if (audioBlob.size > 0) {
            // Reproducir el audio grabado
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayback.src = audioUrl;
            audioPlayback.controls = true;
            console.log('Audio listo para reproducirse.');

            // Convertir el audio a WAV usando Convertio
            const convertioResponse = await convertToWav(audioBlob);
            if (convertioResponse && convertioResponse.data && convertioResponse.data.url) {
                // Enviar el audio convertido a DigitalOcean
                await sendAudioToDigitalOcean(convertioResponse.data.url);
            }

            createTagsQuestions(document.body, convertioResponse);
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
    console.log('Estado de grabación:', state ? 'Iniciando grabación' : 'Deteniendo grabación');
    if (state) {
        startRecording();
    } else {
        stopRecording();
    }
};

button.addEventListener('click', toggleRecording);
