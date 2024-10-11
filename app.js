let state = false;
let mediaRecorder;
let audioChunks = [];
const button = document.getElementById('toggle-record');
const audioPlayback = document.getElementById('audio-playback');

const requestAudioStream = async () => {
  try {
    console.log('Solicitando acceso al micrófono...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Acceso al micrófono concedido.');
    return stream;
  } catch (error) {
    console.error('Error al acceder al micrófono:', error);
    throw error;
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
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
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

const sendAudio = async (file) => {
  console.log('Preparando envío de audio...');
  const formData = new FormData();
  formData.append('audio', file);

  try {
    const response = await fetch('https://goldfish-app-kfo84.ondigitalocean.app/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Audio enviado exitosamente:', data);
      return data;
    } else {
      console.error('Error al enviar el audio:', response.status);
    }
  } catch (error) {
    console.error('Error en la solicitud de envío de audio:', error);
  }
};

const createTagQuestion = (text) => {
  console.log('Creando un nuevo tag de pregunta.');
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
  console.log('Creando tags de preguntas con los datos recibidos...');
  const questions = data.transcribed_text; // Asegúrate de que este sea el formato correcto
  Object.values(questions).forEach(question => {
      let tag = createTagQuestion(question);
      container.appendChild(tag);
  });
  console.log('Tags creadas y añadidas al DOM.');
}

button.addEventListener('click', toggleRecording);
