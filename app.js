import createTagsQuestions from "./question.js";
import sendAudio from "./api.js";

let state = false;
let mediaRecorder;
let audioChunks = [];
const button = document.getElementById('toggle-record');
const audioPlayback = document.getElementById('audio-playback');

const requestAudioStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (error) {
    console.error('Error al acceder al micrófono:', error);
    throw error;
  }
};

const startRecording = async () => {
  button.classList.add('recording');
  const stream = await requestAudioStream();
  
  mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    // Crear el blob de audio una vez que se detiene la grabación
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayback.src = audioUrl;
    audioPlayback.controls = true;

    // Enviar el audio una vez que se detuvo la grabación
    console.log('Enviando audio...');
    const response = await sendAudio(audioBlob);
    console.log('Respuesta recibida:', response);
    createTagsQuestions(document.body, response);

    audioChunks = []; // Limpiar fragmentos de audio
  };

  mediaRecorder.start();
  console.log('Grabación iniciada');
};

const stopRecording = () => {
  button.classList.remove('recording');
  mediaRecorder.stop(); // Esto disparará el evento onstop
  console.log('Grabación detenida');
};

const toggleRecording = () => { 
  state = !state;
  if (state) { 
    startRecording();
  } else { 
    stopRecording();
  }
};

const sendAudio = async (file) => {
  const formData = new FormData();
  formData.append('audio', file);

  const response = await fetch('https://goldfish-app-kfo84.ondigitalocean.app/upload', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Audio enviado:', data);
    return data;
  } else {
    console.error('Error al enviar el audio:', response.status);
  }
};

const createTagQuestion = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.display = 'flex';
  div.style.justifyContent = 'center';
  div.style.alignItems = 'center';
  div.style.height = '100px';
  div.style.border = '1px solid gray';
  div.style.backgroundColor = '#ffff';
  div.style.margin = '10px 0';
  return div;
};

const createTagsQuestions = (container, data) => {
  console.log('Creando tags...');
  const questions = data.transcribed_text; // Asegúrate de que este sea el formato correcto
  Object.values(questions).forEach(question => {
      let tag = createTagQuestion(question);
      container.appendChild(tag);
  });
  console.log('Tags creadas');
}

button.addEventListener('click', toggleRecording);