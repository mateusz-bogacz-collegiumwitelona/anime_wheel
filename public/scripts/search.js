document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    const loader = document.getElementById('loader');
    const template = document.getElementById('animeCardTemplate');

    // Funkcja do znalezienia odpowiadającego tytułu w danych Shinden
    function findShindenMatch(shindenData, malTitle) {
        if (!shindenData || !Array.isArray(shindenData)) return null;
        
        const normalizedMalTitle = malTitle.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        return shindenData.find(item => {
            if (!item || !item.title) return false;
            
            const normalizedShindenTitle = item.title.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            return normalizedShindenTitle.includes(normalizedMalTitle) || 
                   normalizedMalTitle.includes(normalizedShindenTitle) ||
                   normalizedShindenTitle === normalizedMalTitle;
        });
    }

    // Funkcja do obliczania średniej oceny
    function calculateAverageRating(malRating, shindenMatch) {
        let ratings = [];
        
        if (malRating) {
            ratings.push(malRating);
        }
        
        if (shindenMatch && shindenMatch.rating && !isNaN(shindenMatch.rating)) {
            ratings.push(shindenMatch.rating);
        }
        
        if (ratings.length === 0) {
            return null;
        }
        
        const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        return average.toFixed(2);
    }

    async function searchAnime(query) {
        try {
            loader.classList.remove('d-none');
            searchResults.innerHTML = '';

            const response = await fetch(`/api/anime/search?query=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received data:', data);

            if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
                data.data.forEach(item => {
                    if (!item?.node) return;
                    const anime = item.node;
                    const shindenMatch = findShindenMatch(data.shindenData, anime.title);
                    
                    const clone = template.content.cloneNode(true);
                    
                    // Dodanie obrazka
                    if (anime.main_picture?.medium) {
                        const img = document.createElement('img');
                        img.src = anime.main_picture.medium;
                        img.classList.add('card-img-top');
                        img.alt = anime.title;
                        const cardBody = clone.querySelector('.card-body');
                        cardBody.parentNode.insertBefore(img, cardBody);
                    }

                    // Podstawowe informacje
                    clone.querySelector('.card-title').textContent = anime.title;
                    clone.querySelector('.card-text').textContent = anime.synopsis 
                        ? (anime.synopsis.length > 200 ? anime.synopsis.substring(0, 200) + '...' : anime.synopsis)
                        : 'Brak opisu';

                    // Przygotowanie tekstu ocen
                    const malRating = anime.mean;
                    const shindenRating = shindenMatch?.rating;
                    const averageRating = calculateAverageRating(malRating, shindenMatch);

                    // Wyświetlanie ocen
                    const ratingElement = clone.querySelector('.rating');
                    ratingElement.innerHTML = `
                        ${averageRating ? `Średnia: ${averageRating}` : 'Brak ocen'}
                    `;

                    // Dodatkowe informacje
                    const details = document.createElement('div');
                    details.classList.add('mt-2', 'text-muted');
                    details.innerHTML = `
                        <small>
                            ${anime.media_type ? `Typ: ${anime.media_type.toUpperCase()}<br>` : ''}
                            ${anime.num_episodes ? `Odcinki: ${anime.num_episodes}<br>` : ''}
                            <div class="anime-links">
                                <a href="https://myanimelist.net/anime/${anime.id}" target="_blank" class="mal-link">
                                    <i class="fas fa-external-link-alt"></i> MyAnimeList
                                </a>
                                ${shindenMatch ? `
                                    <a href="${shindenMatch.url}" target="_blank" class="shinden-link">
                                        <i class="fas fa-external-link-alt"></i> Shinden
                                    </a>
                                ` : ''}
                            </div>
                        </small>
                    `;
                    clone.querySelector('.card-body').appendChild(details);

                    searchResults.appendChild(clone);
                });
            } else {
                searchResults.innerHTML = `
                    <div class="col-12">
                        <p class="text-center">Nie znaleziono wyników dla "${query}"</p>
                    </div>`;
            }
        } catch (error) {
            console.error('Błąd podczas wyszukiwania:', error);
            searchResults.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Wystąpił błąd!</h4>
                        <p>Nie udało się wykonać wyszukiwania. Spróbuj ponownie później.</p>
                        <hr>
                        <p class="mb-0">Szczegóły błędu: ${error.message}</p>
                    </div>
                </div>`;
        } finally {
            loader.classList.add('d-none');
        }
    }

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();
        if (query.length >= 3) {
            debounceTimer = setTimeout(() => {
                searchAnime(query);
            }, 300);
        }
    });

    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchAnime(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchAnime(query);
            }
        }
    });
});