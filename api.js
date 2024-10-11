const ffmpeg = window.FFmpeg.createFFmpeg({
    log: true,
    corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
    wasmBinary: null, // Usa la versión predeterminada del WASM
    // Ajusta la memoria si es necesario
    memory: new WebAssembly.Memory({ initial: 256, maximum: 512 })
});

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
    await ffmpeg.FS('writeFile', 'input.wav', await fetch(audioFile).then(response => response.arrayBuffer()));

    // Convertir el archivo de audio a WAV usando FFmpeg
    await ffmpeg.run('-i', 'input.wav', 'output.wav');

    // Obtener el archivo de salida
    const data = ffmpeg.FS('readFile', 'output.wav');

    // Crear un Blob con el archivo WAV convertido
    const outputBlob = new Blob([data.buffer], { type: 'audio/wav' });
    const outputUrl = URL.createObjectURL(outputBlob);

    return outputUrl; // Devolver la URL para reproducir el archivo convertido
};

export { loadFFmpeg, processAudioWithFFmpeg };
