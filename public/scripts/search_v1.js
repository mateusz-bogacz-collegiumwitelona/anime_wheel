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

            // Log the received data for debugging
            console.log('Received data:', data);

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(anime => {
                    if (!anime) return; // Skip if anime object is null or undefined
                    
                    const clone = template.content.cloneNode(true);
                    
                    // Add data validation and fallbacks
                    const title = anime.title || 'Tytuł nieznany';
                    const synopsis = anime.synopsis 
                        ? (anime.synopsis.length > 200 
                            ? anime.synopsis.substring(0, 200) + '...' 
                            : anime.synopsis)
                        : 'Brak opisu';
                    const rating = typeof anime.rating === 'number' 
                        ? anime.rating.toFixed(2) 
                        : 'Brak oceny';

                    // Update DOM elements with validated data
                    clone.querySelector('.card-title').textContent = title;
                    clone.querySelector('.card-text').textContent = synopsis;
                    clone.querySelector('.rating').textContent = rating;

                    searchResults.appendChild(clone);
                });
            } else {
                searchResults.innerHTML = '<div class="col-12"><p class="text-center">Nie znaleziono wyników dla podanego zapytania.</p></div>';
            }
        } catch (error) {
            console.error('Błąd podczas wyszukiwania:', error);
            searchResults.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        Wystąpił błąd podczas wyszukiwania. Szczegóły: ${error.message}
                    </div>
                </div>`;
        } finally {
            loader.classList.add('d-none');
        }
    }

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