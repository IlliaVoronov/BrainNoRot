// Configuration
const apiKey = '505e707e8d99dae9082dd33bd91c6371'; // Replace with your API.Bible key
const bibleId = 'de4e12af7f28f599-02'; // ESV Bible ID
const musicFiles = [
    'music/music1.mp3',
    'music/music2.mp3',
    'music/music3.mp3'

];
let books = []; // Will hold bibleStructure.json data
let slidesData = []; // Store slide data
let isMuted = localStorage.getItem('isMuted') === 'true';
const audio = document.getElementById('background-audio');
const muteButton = document.getElementById('mute-button');

// Initialize Swiper
const mySwiper = new Swiper('.swiper-container', {
    direction: 'vertical',
    slidesPerView: 1,
    spaceBetween: 0,
    touchRatio: 1,
    keyboard: true
});

// Load Bible structure
fetch('bibleStructure.json')
    .then(response => response.json())
    .then(data => {
        books = data.books;
        initSlides();
    });

// Generate random hex color
function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

// Generate random verse reference
function getRandomVerseReference() {
    const bookIndex = Math.floor(Math.random() * books.length);
    const book = books[bookIndex];
    const chapter = Math.floor(Math.random() * book.chapters) + 1;
    const verse = Math.floor(Math.random() * book.verses[chapter - 1]) + 1;
    const verseId = `${book.id}.${chapter}.${verse}`;
    return { reference: `${book.name} ${chapter}:${verse}`, verseId };
}

// Fetch verse text from API.Bible
async function fetchVerseText(verseId) {
    try {
        const response = await fetch(
            `https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${verseId}?content-type=text&include-verse-numbers=false`,
            { headers: { 'api-key': apiKey } }
        );
        const data = await response.json();
        return data.data.content.trim();
    } catch (error) {
        console.error('Error fetching verse:', error);
        return 'Failed to load verse';
    }
}

// Generate slide data
async function generateSlideData() {
    const { reference, verseId } = getRandomVerseReference();
    const verseText = await fetchVerseText(verseId);
    const bgColor = getRandomColor();
    const music = musicFiles[Math.floor(Math.random() * musicFiles.length)];
    return { verseText, reference, bgColor, music };
}

// Append slides
async function appendSlides(num) {
    const promises = Array(num).fill().map(() => generateSlideData());
    const newSlides = await Promise.all(promises);
    newSlides.forEach(slideData => {
        const slideHtml = `
            <div class="swiper-slide" style="background-color: ${slideData.bgColor}" data-music="${slideData.music}">
                <div class="verse-content">
                    <div class="verse-text">${slideData.verseText}</div>
                    <div class="verse-reference">${slideData.reference}</div>
                    <a href="https://www.biblegateway.com/passage/?search=${encodeURIComponent(slideData.reference.split(':')[0])}&version=ESV" target="_blank">Read full chapter</a>
                </div>
            </div>
        `;
        mySwiper.appendSlide(slideHtml);
        slidesData.push(slideData);
    });
}

// Initialize slides
function initSlides() {
    appendSlides(5).then(() => {
        // Play audio for the first slide
        const firstSlide = mySwiper.slides[0];
        audio.src = firstSlide.getAttribute('data-music');
        if (!isMuted) audio.play();
    });
}

// Handle slide change
mySwiper.on('slideChange', () => {
    const activeSlide = mySwiper.slides[mySwiper.activeIndex];
    audio.src = activeSlide.getAttribute('data-music');
    if (!isMuted) audio.play();
    // Append more slides when nearing the end
    if (mySwiper.activeIndex >= mySwiper.slides.length - 2) {
        appendSlides(5);
    }
});

// Mute button functionality
muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
    if (isMuted) {
        audio.pause();
    } else {
        audio.play();
    }
});