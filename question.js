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

export default createTagsQuestions;