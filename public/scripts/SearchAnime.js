class SearchAnime extends AnimeDisplay {
    constructor(containerSelector, templateSelector, searchInputSelector, searchButtonSelector) {
        super(containerSelector, templateSelector);
        this.searchInput = document.querySelector(searchInputSelector);
        this.searchButton = document.querySelector(searchButtonSelector);
        this.debounceTimer = null;
        this.initializeEvents();
    }

    initializeEvents() {
        this.searchInput.addEventListener('input', () => {
            clearTimeout(this.debounceTimer);
            const query = this.searchInput.value.trim();
            if (query.length >= 3) {
                this.debounceTimer = setTimeout(() => {
                    this.searchAnime(query);
                }, 300);
            }
        });

        this.searchButton.addEventListener('click', () => {
            const query = this.searchInput.value.trim();
            if (query) {
                this.searchAnime(query);
            }
        });

        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = this.searchInput.value.trim();
                if (query) {
                    this.searchAnime(query);
                }
            }
        });
    }

    async searchAnime(query) {
        try {
            this.showLoader();
            this.clearContainer();

            const response = await fetch(`/api/anime/search?query=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received search data:', data);

            if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
                this.container.innerHTML = `
                    <div class="col-12">
                        <p class="text-center">Nie znaleziono wyników dla "${query}"</p>
                    </div>`;
                return;
            }

            this.displayAnimeList(data.data, data.shindenData);
        } catch (error) {
            console.error('Error during search:', error);
            this.showError(error.message);
        } finally {
            this.hideLoader();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const searchAnime = new SearchAnime(
        '#searchResults',
        '#animeCardTemplate',
        '#searchInput',
        '#searchButton'
    );
});