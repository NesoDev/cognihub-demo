import { loadFFmpeg, processAudioWithFFmpeg } from "./api.js";

let state = false;
let mediaRecorder;
let audioChunks = [];
let audioStream = null;
const button = document.getElementById('toggle-record');
const audioPlayback = document.getElementById('audio-playback');

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
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

        // Cargar y procesar el audio con FFmpeg
        await loadFFmpeg();
        const audioUrl = await processAudioWithFFmpeg(audioBlob);

        // Reproducir el audio convertido
        audioPlayback.src = audioUrl;
        audioPlayback.controls = true;

        console.log('Enviando audio al servidor...');
        const response = await sendAudio(audioBlob);
        console.log('Respuesta del servidor recibida:', response);
        createTagsQuestions(document.body, response);

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