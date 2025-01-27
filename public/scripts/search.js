document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    const loader = document.getElementById('loader');
    const template = document.getElementById('animeCardTemplate');

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
                    
                    const clone = template.content.cloneNode(true);
                    
                    if (anime.main_picture?.medium) {
                        const img = document.createElement('img');
                        img.src = anime.main_picture.medium;
                        img.classList.add('card-img-top');
                        img.alt = anime.title;
                        const cardBody = clone.querySelector('.card-body');
                        cardBody.parentNode.insertBefore(img, cardBody);
                    }

                    clone.querySelector('.card-title').textContent = anime.title;
                    clone.querySelector('.card-text').textContent = anime.synopsis 
                        ? (anime.synopsis.length > 200 ? anime.synopsis.substring(0, 200) + '...' : anime.synopsis)
                        : 'Brak opisu';
                    clone.querySelector('.rating').textContent = anime.mean 
                        ? anime.mean.toFixed(2) 
                        : 'Brak oceny';

                    const details = document.createElement('div');
                    details.classList.add('mt-2', 'text-muted');
                    details.innerHTML = `
                        <small>
                            ${anime.media_type ? `Typ: ${anime.media_type.toUpperCase()}<br>` : ''}
                            ${anime.num_episodes ? `Odcinki: ${anime.num_episodes}<br>` : ''}
                            <a href="https://myanimelist.net/anime/${anime.id}" target="_blank" class="mal-link">
                                Zobacz na MyAnimeList <i class="fas fa-external-link-alt"></i>
                            </a>
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