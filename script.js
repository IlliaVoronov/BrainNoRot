import { Analytics } from "@vercel/analytics/react";
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function getLuminance({ r, g, b }) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

let books = []; // Will hold bibleStructure.json data
let ntStart = -1;
let slidesData = []; // Store slide data
const oldTestamentToggle = document.getElementById('old-testament-toggle');
let includeOldTestament = oldTestamentToggle.checked;

oldTestamentToggle.addEventListener('change', () => {
    includeOldTestament = oldTestamentToggle.checked;
});// Configuration

const apiKey = '505e707e8d99dae9082dd33bd91c6371'; // Replace with your API.Bible key
const bibleId = 'de4e12af7f28f599-02'; // ESV Bible ID
const musicFiles = [
    'music/music1.mp3',
    'music/music2.mp3',
    'music/music3.mp3',
    'music/music4.mp3',
    'music/music5.mp3',
    'music/music6.mp3',
    'music/music7.mp3',
    'music/music8.mp3',
    'music/music9.mp3',
    'music/music10.mp3',
    'music/music11.mp3',
    'music/music12.mp3',
    'music/music13.mp3'
];

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
// Load Bible structure
fetch('bibleStructure.json')
    .then(response => response.json())
    .then(data => {
        books = data.books;
        ntStart = books.findIndex(book => book.name === 'Matthew');
        if (ntStart === -1) {
            console.error('Matthew not found in books');
            return;
        }
        initSlides(); // Initialize slides after loading data
    })
    .catch(error => console.error('Error loading bibleStructure.json:', error));

// Generate random hex color
function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

// Generate random verse reference
function getRandomVerseReference() {
    let bookIndex;
    if (includeOldTestament) {
        bookIndex = Math.floor(Math.random() * books.length);
    } else {
        bookIndex = ntStart + Math.floor(Math.random() * (books.length - ntStart));
    }
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
        const { r, g, b } = hexToRgb(slideData.bgColor);
        const luminance = getLuminance({ r, g, b });
        const textColor = luminance > 128 ? 'black' : 'white';
        const textShadow = textColor === 'black' ? 'none' : '2px 2px 4px rgba(0, 0, 0, 0.5)';
        const slideHtml = `
            <div class="swiper-slide" style="background-color: ${slideData.bgColor}" data-music="${slideData.music}">
                <div class="verse-content" style="color: ${textColor}; text-shadow: ${textShadow}">
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

// Initial state
muteButton.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';

// Event listener
muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    muteButton.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    if (isMuted) {
        audio.pause();
    } else {
        audio.play();
    }
});