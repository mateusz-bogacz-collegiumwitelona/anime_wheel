class RandomAnime extends AnimeDisplay {
    constructor(containerSelector, templateSelector, buttonSelector) {
        super(containerSelector, templateSelector);
        this.randomButton = document.querySelector(buttonSelector);
        this.initializeEvents();
    }

    initializeEvents() {
        this.randomButton.addEventListener('click', () => this.getRandomAnime());
    }

    async getRandomAnime() {
        try {
            this.showLoader();
            this.clearContainer();

            const response = await fetch('http://localhost:3000/api/anime/random');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received random anime data:', data);

            this.displayAnimeList(data.data, data.shindenData);
        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message);
        } finally {
            this.hideLoader();
        }
    }
}