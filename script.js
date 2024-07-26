document.addEventListener("DOMContentLoaded", function() {
    let currentTrack = 0;
    let isPlaying = false;
    let trackOffset = 0;
    const tracksPerPage = 100;
    let tracksOriginal = [];
    let filteredTracks = [];
    let selectedArtists = new Set();
    let loading = false;

    const trackList = document.getElementById('trackList');
    const welcomeText = document.getElementById('welcomeText');
    const currentTrackInfo = document.getElementById('currentTrackInfo');
    const currentCoverArt = document.getElementById('currentCoverArt');
    const currentTitle = document.getElementById('currentTitle');
    const currentDetails = document.getElementById('currentDetails');
    const audio = new Audio();
    const playPauseButton = document.getElementById('playPause');
    const seekBar = document.getElementById('seekBar');
    const audioList = document.getElementById('audioList');
    const searchBar = document.getElementById('searchBar');
    const filterButton = document.getElementById('filterButton');
    const filterMenu = document.getElementById('filterMenu');
    const artistFilters = document.getElementById('artistFilters');
    const artistSearch = document.getElementById('artistSearch');

    // Funzione per recuperare i brani
    function fetchTracks(offset = 0, limit = tracksPerPage) {
        loading = true;
        console.log(`Fetching tracks with offset ${offset} and limit ${limit}`);
        fetch(`files.php?offset=${offset}&limit=${limit}`)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched data:', data);
                if (Array.isArray(data)) {
                    tracksOriginal = tracksOriginal.concat(data);
                    filteredTracks = filterTracks(searchBar.value);
                    renderTracks();
                    if (offset === 0) {
                        populateArtistFilters(tracksOriginal);
                    }
                    loading = false;
                } else {
                    console.error('Expected an array of tracks, but received:', data);
                }
            })
            .catch(error => {
                console.error('Error fetching files:', error);
                loading = false;
            });
    }

    // Funzione per rendere i brani visibili nella pagina
    function renderTracks() {
        audioList.innerHTML = '';
        const tracksToDisplay = filteredTracks.slice(trackOffset, trackOffset + tracksPerPage);
        
        tracksToDisplay.forEach((track, index) => {
            const container = document.createElement('div');
            container.className = 'audio-container';
            container.style.opacity = 0;
    
            const img = document.createElement('img');
            if (track.coverArt) {
                img.src = track.coverArt;
            } else {
                const imgSrc = `img/${track.file.replace(/\.[^/.]+$/, "")}`;
                img.src = `${imgSrc}.jpg`;
                img.onerror = function() {
                    img.src = `${imgSrc}.JPG`;
                    img.onerror = function() {
                        img.src = 'img/default.jpg';
                    };
                };
            }
    
            const textContainer = document.createElement('div');
            textContainer.className = 'audio-text';
    
            const titleParagraph = document.createElement('p');
            titleParagraph.className = 'track-title';
            titleParagraph.textContent = track.title;
    
            const detailsParagraph = document.createElement('p');
            detailsParagraph.className = 'track-details';
            detailsParagraph.textContent = (track.artist.length > 0 ? track.artist.join(', ') : '') 
                                           + (track.album ? ' | ' + track.album : '');
    
            textContainer.appendChild(titleParagraph);
            textContainer.appendChild(detailsParagraph);
    
            container.appendChild(img);
            container.appendChild(textContainer);
    
            container.addEventListener('click', () => {
                currentTrack = index + trackOffset;
                loadTrack(currentTrack);
                playTrack();
            });
    
            audioList.appendChild(container);
    
            setTimeout(() => {
                container.style.transition = 'opacity 0.5s';
                container.style.opacity = 1;
            }, 100);
        });
    
        if (trackOffset + tracksPerPage >= filteredTracks.length) {
            window.removeEventListener('scroll', handleScroll);
        }
    }

    function updateCurrentTrackDisplay(track) {
        if (track) {
            welcomeText.classList.add('hide');
            currentTrackInfo.classList.remove('hide');
            if (track.coverArt) {
                currentCoverArt.src = track.coverArt;
            } else {
                const imgSrc = `img/${track.file.replace(/\.[^/.]+$/, "")}`;
                currentCoverArt.src = `${imgSrc}.jpg`;
                currentCoverArt.onerror = function() {
                    currentCoverArt.src = `${imgSrc}.JPG`;
                    currentCoverArt.onerror = function() {
                        currentCoverArt.src = 'img/default.jpg';
                    };
                };
            }
            currentTitle.textContent = track.title;
            currentDetails.textContent = (track.artist.length > 0 ? track.artist.join(', ') : '') + 
                                         (track.album ? ' | ' + track.album : '');
        } else {
            welcomeText.classList.remove('hide');
            currentTrackInfo.classList.add('hide');
        }
    }

    // Funzione tecnicamente non ultimata per gestire lo scroll della pagina
    function handleScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const bodyHeight = document.body.offsetHeight;

        console.log(`ScrollY: ${scrollY}, WindowHeight: ${windowHeight}, BodyHeight: ${bodyHeight}`);

        if (scrollY + windowHeight >= bodyHeight - 100 && !loading) {
            trackOffset += tracksPerPage;
            fetchTracks(trackOffset, tracksPerPage);
        }
    }

    // Funzione per filtrare i brani in base alla query di ricerca
    function filterTracks(query) {
        console.log('Filtering tracks with query:', query);
        return tracksOriginal.filter(track => {
            const text = track.title.toLowerCase()
                        + (track.artist.length > 0 ? ' - ' + track.artist.map(a => a.toLowerCase()).join(', ') : '')
                        + (track.album ? ' | ' + track.album.toLowerCase() : '');
            return text.includes(query.toLowerCase()) &&
                   (selectedArtists.size === 0 || track.artist.some(artist => selectedArtists.has(artist)));
        });
    }

    // Funzione per riempire i filtri degli artisti
    function populateArtistFilters(tracks) {
        const artists = new Set();
        tracks.forEach(track => {
            track.artist.forEach(artist => artists.add(artist.trim()));
        });
        artists.forEach(artist => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = artist;
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    selectedArtists.add(artist);
                } else {
                    selectedArtists.delete(artist);
                }
                updateFilteredTracks();
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(artist));
            artistFilters.appendChild(label);
        });
    }

    // Funzione per mostrare/nascondere il menu dei filtri
    function toggleFilterMenu() {
        if (filterMenu.classList.contains('show')) {
            filterMenu.classList.remove('show');
            filterMenu.classList.add('hide');
        } else {
            filterMenu.classList.remove('hide');
            filterMenu.classList.add('show');
        }
    }

    // Funzione per filtrare la lista degli artisti
    function filterArtistList() {
        const query = artistSearch.value.toLowerCase();
        const labels = artistFilters.querySelectorAll('label');
        labels.forEach(label => {
            const artistName = label.textContent.trim().toLowerCase();
            label.style.display = artistName.includes(query) ? 'block' : 'none';
        });
    }

    // Funzione per caricare il brano selezionato
    function loadTrack(index) {
        const track = filteredTracks[index];
        if (track) {
            audio.src = `mp3/${track.file}`;
            updateCurrentTrackDisplay(track);
            console.log('Loading track:', audio.src);
        }
    }

    // Funzione per riprodurre il brano
    function playTrack() {
        if (audio.src) {
            audio.play().then(() => {
                isPlaying = true;
                playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
            }).catch(error => {
                console.error('Error playing track:', error);
            });
        }
    }

    // Funzione per mettere in pausa il brano
    function pauseTrack() {
        audio.pause();
        isPlaying = false;
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    }

    // Funzione per aggiornare i brani filtrati
    function updateFilteredTracks() {
        filteredTracks = filterTracks(searchBar.value);
        trackOffset = 0;
        renderTracks();
    }

    // Funzione per riprodurre il brano successivo
    function playNextTrack() {
        if (currentTrack < filteredTracks.length - 1) {
            currentTrack++;
            loadTrack(currentTrack);
            playTrack();
        } else {
            console.log('No more tracks to play');
        }
    }

    // Event listeners per i pulsanti di controllo
    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    });

    document.getElementById('prev').addEventListener('click', () => {
        if (currentTrack > 0) {
            currentTrack--;
            loadTrack(currentTrack);
            playTrack();
        }
    });

    document.getElementById('next').addEventListener('click', () => {
        playNextTrack();
    });

    // Aggiornamento della barra di avanzamento
    audio.addEventListener('timeupdate', () => {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
    });

    seekBar.addEventListener('input', () => {
        audio.currentTime = (seekBar.value / 100) * audio.duration;
    });

    // Event listeners per la ricerca e i filtri
    searchBar.addEventListener('input', updateFilteredTracks);
    filterButton.addEventListener('click', toggleFilterMenu);
    artistSearch.addEventListener('input', filterArtistList);

    // Event listener per l'evento 'ended' dell'audio
    audio.addEventListener('ended', () => {
        console.log('Track ended');
        playNextTrack();
    });

    // Carica i brani iniziali
    fetchTracks();
});
