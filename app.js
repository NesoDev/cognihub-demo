let state = false;
let mediaRecorder;
let audioChunks = [];
const button = document.getElementById('toggle-record');
const audioPlayback = document.getElementById('audio-playback');
let response;
let audioBlob;

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
    audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
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

const sendAudio = async (file) => {
  const response = await fetch('https://goldfish-app-kfo84.ondigitalocean.app/upload', {
      method: 'POST',
      body: new FormData().append('audio', file),
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
  console.log('creando tags')
  questions = data.transcribed_text
  Object.values(questions).forEach(question => {
      let tag = createTagQuestion(question);
      container.appendChild(tag)
  });
  console.log('tags creadas')
}

button.addEventListener('click', toggleRecording);