import createTagsQuestions from "./question.js";
import sendAudio from "./api.js";

let state = false;
let mediaRecorder;
let audioChunks = [];
const button = document.getElementById('toggle-record');
const audioPlayback = document.getElementById('audio-playback');
let response;

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

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayback.src = audioUrl;
    audioPlayback.controls = true;
    audioChunks = [];
  };

  mediaRecorder.start();
  console.log('Grabación iniciada');
};

const stopRecording = async () => {
  button.classList.remove('recording');
  mediaRecorder.stop();
  console.log('Grabación detenida');

  console.log('enviando audio')
  response = await sendAudio(audioBlob);
  console.log('respuesta recibida')
  console.log(`res: ${response}`)
  createTagsQuestions(document.body, response);
};

const toggleRecording = () => { 
  state = !state;
  if (state) { 
    startRecording();
  } else { 
    stopRecording();
  }
};

button.addEventListener('click', toggleRecording);