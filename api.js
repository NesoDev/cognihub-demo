import { FFmpeg } from window.ffmpeg

const ffmpeg = FFmpeg.createFFmpeg({ log: true });

const loadFFmpeg = async () => {
    if (!ffmpeg.isLoaded()) {
        console.log('Cargando FFmpeg...');
        await ffmpeg.load();
        console.log('FFmpeg cargado.');
    }
};

const processAudioWithFFmpeg = async (audioBlob) => {
    console.log('Procesando audio con FFmpeg...');

    // Cargar el archivo de audio en ffmpeg.wasm
    const audioFile = new File([audioBlob], 'input.wav', { type: 'audio/wav' });
    await ffmpeg.FS('writeFile', 'input.wav', await fetch(audioFile));

    // Convertir el archivo de audio a WAV usando FFmpeg
    await ffmpeg.run('-i', 'input.wav', 'output.wav');

    // Obtener el archivo de salida
    const data = ffmpeg.FS('readFile', 'output.wav');

    // Crear un Blob con el archivo WAV convertido
    const outputBlob = new Blob([data.buffer], { type: 'audio/wav' });
    const outputUrl = URL.createObjectURL(outputBlob);

    return outputUrl; // Devolver la URL para reproducir el archivo convertido
};

export {loadFFmpeg, processAudioWithFFmpeg};