class TopAnime extends AnimeDisplay {
    constructor(containerSelector, templateSelector) {
        super(containerSelector, templateSelector);
        this.initializeTopList();
    }

    async initializeTopList() {
        try {
            this.showLoader();
            this.clearContainer();

            const response = await fetch('http://localhost:3000/api/anime/top?limit=50');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Nieprawidłowy format danych');
            }
            
            const processedAnime = data.data.map(item => {
                const anime = item.node;
                const shindenMatch = this.findShindenMatch(data.shindenData, anime.title);
                const averageRating = this.calculateAverageRating(anime.mean, shindenMatch);
                
                return {
                    anime: anime,
                    shindenMatch: shindenMatch,
                    averageRating: averageRating ? parseFloat(averageRating) : 0
                };
            }).filter(item => item.averageRating > 0);

            const top10Anime = processedAnime
                .sort((a, b) => b.averageRating - a.averageRating)
                .slice(0, 10);

            if (top10Anime.length === 0) {
                throw new Error('Brak danych do wyświetlenia');
            }

            this.displayTopAnimeList(top10Anime);
        } catch (error) {
            console.error('Błąd:', error);
            this.showError(error.message);
        } finally {
            this.hideLoader();
        }
    }

    displayTopAnimeList(topAnimeList) {
        this.clearContainer();
        
        if (!topAnimeList || topAnimeList.length === 0) {
            this.container.innerHTML = `
                <div class="col-12">
                    <div class="error-alert">
                        Nie udało się załadować listy top anime.
                    </div>
                </div>`;
            return;
        }

        const header = document.createElement('div');
        header.className = 'col-12 mb-4';
        header.innerHTML = `
            <h3 class="top-list-header">
                Top 10 Anime według średniej ocen MAL i Shinden
            </h3>
        `;
        this.container.appendChild(header);

        topAnimeList.forEach((item, index) => {
            const rankBadge = document.createElement('div');
            rankBadge.className = 'rank-badge';
            rankBadge.textContent = `#${index + 1}`;

            const animeCard = this.createAnimeCard(item.anime, item.shindenMatch);
            const cardContainer = animeCard.querySelector('.card');
            cardContainer.classList.add('anime-card');
            cardContainer.insertBefore(rankBadge, cardContainer.firstChild);

            const ratingInfo = document.createElement('div');
            ratingInfo.className = 'rating-badge';
            ratingInfo.textContent = `Średnia ocena: ${item.averageRating.toFixed(2)}`;
            cardContainer.querySelector('.card-body').appendChild(ratingInfo);
            
            this.container.appendChild(animeCard);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new TopAnime('#topResults', '#animeCardTemplate');
});