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

export default sendAudio;