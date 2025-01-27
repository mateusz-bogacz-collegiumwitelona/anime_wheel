class AnimeDisplay {
    constructor(containerSelector, templateSelector) {
        this.container = document.querySelector(containerSelector);
        this.template = document.querySelector(templateSelector);
        this.loader = document.getElementById('loader');
    }

    showLoader() {
        this.loader?.classList.remove('d-none');
    }

    hideLoader() {
        this.loader?.classList.add('d-none');
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Wystąpił błąd!</h4>
                    <p>Nie udało się pobrać danych. Spróbuj ponownie później.</p>
                    <hr>
                    <p class="mb-0">Szczegóły błędu: ${message}</p>
                </div>
            </div>`;
    }

    findShindenMatch(shindenData, malTitle) {
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

    calculateAverageRating(malRating, shindenMatch) {
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

    createAnimeCard(anime, shindenMatch) {
        const clone = this.template.content.cloneNode(true);
        
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
        const averageRating = this.calculateAverageRating(malRating, shindenMatch);

        // Wyświetlanie ocen
        const ratingElement = clone.querySelector('.rating');
        ratingElement.innerHTML = `
            ${malRating ? `MAL: ${malRating.toFixed(2)}` : 'MAL: brak'}<br>
            ${shindenRating && !isNaN(shindenRating) ? `Shinden: ${shindenRating.toFixed(2)}` : 'Shinden: brak'}<br>
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

        return clone;
    }

    clearContainer() {
        this.container.innerHTML = '';
    }

    displayAnimeList(animeList, shindenData) {
        this.clearContainer();
        
        if (!animeList || animeList.length === 0) {
            this.container.innerHTML = '<div class="col-12"><p class="text-center">Nie znaleziono żadnych anime.</p></div>';
            return;
        }

        animeList.forEach(item => {
            if (!item?.node) return;
            const anime = item.node;
            const shindenMatch = this.findShindenMatch(shindenData, anime.title);
            const card = this.createAnimeCard(anime, shindenMatch);
            this.container.appendChild(card);
        });
    }
}