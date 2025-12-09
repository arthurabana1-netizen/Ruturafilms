// --- CONFIGURATION ---
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTnA2o76a9hq2EF_8oqupcxaaAYa6h4MpQgCIlLk8lmt3vGnLesviQ53UcjaYqTmgZ9ML5h7HQ92jY6/pub?output=csv';

let allMovies = [];
let moviesByCategory = {};
let featuredMovies = []; 
let heroInterval;

document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keyup', (e) => handleSearch(e.target.value));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('search-results-dropdown').style.display = 'none';
        }
    });
});

function scrollToMovies() {
    document.getElementById('category-movies-container').scrollIntoView({ behavior: 'smooth' });
}

function getRelativeTime(dateString) {
    if (!dateString) return 'Date N/A';
    const movieDate = new Date(dateString);
    const now = new Date();
    if (isNaN(movieDate.getTime())) return dateString; 
    const diffTime = Math.abs(now - movieDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

async function loadMovies() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        allMovies = parseCSV(data);
        if(allMovies.length > 0) {
            groupMoviesByCategory(allMovies);
            setupHeroStack(allMovies);
            renderCategoryCarousels();
        }
    } catch (error) {
        console.error("Error loading:", error);
    }
}

// --- HERO STACK & ANIMATION ---
function setupHeroStack(movies) {
    const stackContainer = document.getElementById('hero-stack');
    featuredMovies = movies.slice(0, 3); 
    stackContainer.innerHTML = '';
    
    featuredMovies.forEach((movie, index) => {
        const div = document.createElement('div');
        div.classList.add('hero-card');
        div.id = `hero-card-${index}`;
        
        if (index === 0) div.classList.add('center');
        if (index === 1) div.classList.add('right');
        if (index === 2) div.classList.add('left');
        
        const poster = movie.poster || 'https://via.placeholder.com/300x450';
        div.style.backgroundImage = `url('${poster}')`;
        div.onclick = () => openMoviePage(movie.name);
        
        div.innerHTML = `
            <div class="play-overlay">
                <div class="play-circle"><i class="fa-solid fa-play"></i></div>
            </div>
        `;
        stackContainer.appendChild(div);
    });

    startHeroAnimation();
}

function startHeroAnimation() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        const cards = [
            document.getElementById('hero-card-0'),
            document.getElementById('hero-card-1'),
            document.getElementById('hero-card-2')
        ];
        
        let centerIdx = cards.findIndex(c => c.classList.contains('center'));
        cards.forEach(c => {
            c.classList.remove('center', 'left', 'right');
        });

        let newCenter = (centerIdx + 1) % 3;
        let newRight = (newCenter + 1) % 3;
        let newLeft = (newCenter + 2) % 3; 

        cards[newCenter].classList.add('center');
        cards[newRight].classList.add('right');
        cards[newLeft].classList.add('left');

    }, 15000); 
}

// --- CATEGORIES & VIEW ALL ---
function renderCategoryCarousels() {
    const container = document.getElementById('category-movies-container');
    container.innerHTML = '';
    
    Object.keys(moviesByCategory).sort().forEach(cat => {
        const safeCat = cat.replace(/\s+/g, '-');
        const section = document.createElement('div');
        section.className = 'category-section';
        
        section.innerHTML = `
            <div class="category-header">
                <h2>${cat} <span class="text-primary">.</span></h2>
                <button class="view-all-btn" onclick="openCategoryPage('${cat}')">View All</button>
            </div>
        `;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'carousel-wrapper';

        const leftBtn = document.createElement('button');
        leftBtn.className = 'scroll-btn left';
        leftBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        leftBtn.onclick = () => scrollCarousel(safeCat, -300);

        const rightBtn = document.createElement('button');
        rightBtn.className = 'scroll-btn right';
        rightBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        rightBtn.onclick = () => scrollCarousel(safeCat, 300);

        const carousel = document.createElement('div');
        carousel.className = 'movie-carousel';
        carousel.id = `carousel-${safeCat}`;
        
        moviesByCategory[cat].forEach(m => carousel.appendChild(createMovieCard(m)));
        
        wrapper.appendChild(leftBtn);
        wrapper.appendChild(carousel);
        wrapper.appendChild(rightBtn);
        section.appendChild(wrapper);
        container.appendChild(section);
    });
}

function scrollCarousel(id, amount) {
    const carousel = document.getElementById(`carousel-${id}`);
    if (carousel) carousel.scrollBy({ left: amount, behavior: 'smooth' });
}

// --- VIEW ALL PAGE ---
function openCategoryPage(category) {
    const home = document.getElementById('home-view');
    const catPage = document.getElementById('category-page');
    const grid = document.getElementById('category-grid');
    
    document.getElementById('cat-page-title').innerText = category;
    grid.innerHTML = '';
    
    const movies = moviesByCategory[category] || [];
    // Using createMovieCard ensures every movie here is CLICKABLE
    movies.forEach(m => {
        grid.appendChild(createMovieCard(m));
    });

    home.style.display = 'none';
    catPage.style.display = 'block';
    window.scrollTo(0,0);
}

function closeCategoryPage() {
    document.getElementById('category-page').style.display = 'none';
    document.getElementById('home-view').style.display = 'block';
}

// --- UTILS ---
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    // This line ensures clicking works everywhere:
    card.onclick = () => openMoviePage(movie.name);
    
    const poster = movie.poster || 'https://via.placeholder.com/200x300';
    
    card.innerHTML = `
        <span class="card-badge-translator">${movie.translator || 'N/A'}</span>
        <img src="${poster}" class="poster-img" loading="lazy">
        <div class="play-overlay">
            <div class="play-circle"><i class="fa-solid fa-play"></i></div>
        </div>
        <div class="card-overlay" style="position:absolute; bottom:0; left:0; width:100%; padding:15px; background:linear-gradient(to top, black, transparent); pointer-events: none;">
            <div style="font-weight:bold; font-size:0.9rem; color:white;">${movie.name}</div>
        </div>
    `;
    return card;
}

// --- FULL PAGE MOVIE VIEW ---
function openMoviePage(movieName) {
    const movie = allMovies.find(m => m.name === movieName);
    if(!movie) return;

    const page = document.getElementById('movie-page');
    document.getElementById('page-title').innerText = movie.name;
    document.getElementById('page-type').innerText = movie.type || 'Film';
    
    const timeString = getRelativeTime(movie.date);
    document.getElementById('page-date').innerHTML = `<i class="fa-regular fa-clock"></i> ${timeString}`;
    document.getElementById('page-translator').innerHTML = `<i class="fa-solid fa-user-gear"></i> ${movie.translator || 'Unknown'}`;
    document.getElementById('page-desc').innerText = movie.description || 'No description provided.';
    
    const iframe = document.getElementById('trailer-frame');
    if(movie.trailer && movie.trailer.includes('embed')) {
        iframe.src = movie.trailer;
    } else {
        iframe.src = ''; 
    }
    
    const linkBtn = document.getElementById('watch-link');
    if(movie.link && movie.link.startsWith('http')) {
        linkBtn.href = movie.link;
        linkBtn.style.display = 'inline-flex';
    } else {
        linkBtn.style.display = 'none';
    }

    renderRelated(movie.type, movie.name);
    page.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeMoviePage() {
    document.getElementById('trailer-frame').src = '';
    document.getElementById('movie-page').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function renderRelated(category, currentName) {
    const container = document.getElementById('related-movies-grid');
    container.innerHTML = '';
    const related = moviesByCategory[category] || [];
    const filtered = related.filter(m => m.name !== currentName).slice(0, 8);
    if(filtered.length === 0) {
        container.innerHTML = '<p style="color:#666">No other movies found.</p>';
        return;
    }
    filtered.forEach(m => {
        container.appendChild(createMovieCard(m));
    });
}

function parseCSV(csvText) {
    const rows = csvText.split('\n').filter(row => row.trim() !== '');
    if(rows.length < 2) return [];
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const data = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].match(/(?:\"([^\"]*)\"|([^,]*))/g)?.filter(Boolean)?.map(item => item.replace(/^"|"$/g, '').trim()) || [];
        const obj = {};
        if(row.length < headers.length) continue;
        headers.forEach((h, index) => {
            let key = h;
            if (h.includes('title')) key = 'name';
            if (h.includes('category') || h.includes('type')) key = 'type';
            if (h.includes('translator')) key = 'translator';
            obj[key] = row[index] || '';
        });
        if(obj.name) {
             if (obj.trailer) {
                if (obj.trailer.includes('watch?v=')) obj.trailer = obj.trailer.replace('watch?v=', 'embed/').split('&')[0];
                else if (obj.trailer.includes('youtu.be/')) obj.trailer = obj.trailer.replace('youtu.be/', 'www.youtube.com/embed/').split('?')[0];
            }
            data.push(obj);
        }
    }
    return data;
}

function groupMoviesByCategory(movies) {
    moviesByCategory = {};
    movies.forEach(movie => {
        const cat = movie.type || 'Other';
        if(!moviesByCategory[cat]) moviesByCategory[cat] = [];
        moviesByCategory[cat].push(movie);
    });
}

function handleSearch(term) {
    const dropdown = document.getElementById('search-results-dropdown');
    dropdown.innerHTML = '';
    if (term.length < 2) { dropdown.style.display = 'none'; return; }
    const filtered = allMovies.filter(m => m.name.toLowerCase().includes(term.toLowerCase()));
    if (filtered.length > 0) {
        dropdown.style.display = 'flex';
        filtered.forEach(movie => {
            const item = document.createElement('div');
            item.className = 'search-item';
            item.onclick = () => { openMoviePage(movie.name); dropdown.style.display = 'none'; document.getElementById('search-input').value = ''; };
            const poster = movie.poster || 'https://via.placeholder.com/40x60';
            item.innerHTML = `<img src="${poster}" alt="poster"><div class="search-item-info"><h4>${movie.name}</h4><span>${movie.type}</span></div>`;
            dropdown.appendChild(item);
        });
    } else { dropdown.style.display = 'none'; }
}