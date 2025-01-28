# 🎬 Anime Wheel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.21-blue.svg)](https://expressjs.com/)

Anime Wheel to interaktywna platforma dla miłośników anime, która pomaga w odkrywaniu nowych serii poprzez integrację ocen i opinii z różnych źródeł. Projekt łączy dane z MyAnimeList i Shinden, oferując kompleksowe informacje o seriach anime.

## 📋 Spis treści
- [Funkcjonalności](#-funkcjonalności)
- [Technologie](#-technologie)
- [Instalacja](#-instalacja)
- [Konfiguracja](#-konfiguracja)
- [API](#-api)
- [Współpraca](#-współpraca)
- [Licencja](#-licencja)

## 🚀 Funkcjonalności

- Wyszukiwanie anime po tytule
- Przeglądanie top listy anime
- Losowanie anime do obejrzenia
- Integracja ocen z MyAnimeList i Shinden
- Responsywny interfejs użytkownika

## 💻 Technologie

### Frontend:
- HTML5
- CSS3 z zmiennymi CSS dla spójnego motywu
- JavaScript (ES6+)
- Bootstrap 4 dla responsywnego designu
- Font Awesome dla ikon

### Backend:
- Node.js
- Express.js
- API Integration:
  - MyAnimeList API
  - Shinden API

## 🔧 Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/mateusz-bogacz-collegiumwitelona/anime_wheel.git
```

2. Przejdź do katalogu projektu:
```bash
cd anime_wheel
```

3. Zainstaluj zależności:
```bash
npm install
```

4. Uruchom aplikację:
```bash
npm start
```

## ⚙️ Konfiguracja

1. Stwórz plik `.env` w głównym katalogu projektu
2. Dodaj wymagane zmienne środowiskowe:
```env
PORT=3000
MAL_CLIENT_ID=your_mal_client_id
```

## 🔌 API

### Endpointy

#### GET /api/anime/search
Wyszukiwanie anime po tytule.
```javascript
GET /api/anime/search?query=title
```

#### GET /api/anime/random
Pobieranie losowej listy anime.
```javascript
GET /api/anime/random
```

#### GET /api/anime/top
Pobieranie top listy anime.
```javascript
GET /api/anime/top?limit=50
```

## 👥 Współpraca

1. Zrób fork repozytorium
2. Stwórz branch dla swojej funkcjonalności (`git checkout -b feature/AmazingFeature`)
3. Zatwierdź zmiany (`git commit -m 'Add some AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 📄 Licencja

Projekt jest udostępniany na licencji MIT. Zobacz plik `LICENSE` po więcej szczegółów.

## 👨‍💻 Autorzy

Mateusz Bogacz-Drewniak 
- GitHub: [@mateusz-bogacz-collegiumwitelona](https://github.com/mateusz-bogacz-collegiumwitelona)

