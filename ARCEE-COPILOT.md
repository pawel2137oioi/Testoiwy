# Arcee i copilot.com — r17, rozszerzenie 1.24.25

## Co poprawiono po zrzutach

W r16 adapter wymagał formularza lub wymyślonego znacznika kontenera, a contenteditable musiał mieć rolę textbox. Arcee używa textarea `#chat-input-textarea` poza formularzem. Gdy pole nie zostało rozpoznane, wspólny interfejs dokował pasek na dole ekranu, zakrywając natywny czat.

R17 rozpoznaje rzeczywisty kompozytor Arcee, w tym przycisk Send początkowo zablokowany dla pustego pola. Obsługuje też lokalne kompozytory bez formularza, test ID i roli textbox oraz edytory contenteditable true/plaintext-only. Szuka najbliższego lokalnego wiersza z przyciskiem wysyłania/zatrzymania; nie przeszukuje przycisków całej strony ani innych formularzy. Niejednoznaczny wybór kilku edytorów nadal blokuje agenta.

Pasek obu nowych adapterów znajduje się nad wykrytym kompozytorem, bez dopisywania odstępów i szerokości do elementów strony. Wysokość paska jest mierzona po ustawieniu szerokości. Gdy edytor nie jest rozpoznany, pasek trafia na górę okna. Naprawiono minimalną szerokość 520 px, która wypychała taki pasek poza wąskie okno. Zwykłe pisanie i natywne wysyłanie nie wymagają uruchomienia agenta.

## Instalacja

1. Podmień cały folder rozszerzenia i przeładuj go. Zachowaj jedną aktywną instalację. Chrome/Edge: `PlazCode-Extension`; Firefox: `PlazCode-Extension-Firefox`.
2. Odśwież kartę Arcee lub dokładnie `https://copilot.com/`. Nie dodano domeny copilot.microsoft.com. EXE pozostaje bez zmian.
3. Sprawdź wersję **1.24.25**. Raport transportu nowych adapterów: **core:r17/parser:r13/provider:r17**. Na pustym polu Start Agent musi potwierdzić połączenie przez list_commands i odbiór kontekstu.
4. Jeżeli aktualny interfejs serwisu nadal nie zostanie rozpoznany, zwykły czat pozostaje dostępny, a agent nie powinien klikać przypadkowych przycisków. Dla innej domeny po przekierowaniu ta rejestracja nie obowiązuje.

Nie potrzeba nowego klucza API. Integracja korzysta z otwartej rozmowy w przeglądarce. Wysyłanie obrazów pozostaje niezweryfikowane. Brak potwierdzenia wiadomości przez nowy wpis użytkownika zatrzymuje wysyłkę bez ponownego kliknięcia; przed ręczną próbą sprawdź historię, ponieważ wiadomość mogła dotrzeć.

## Co rzeczywiście sprawdzono

23 października 2026 według Europe/Warsaw publiczne adresy były już dostępne. Odczytano Arcee index-Cy3oA8To.js, ChatComponentsMobile-DL3KqdOn.js, StickyButton-CL_LSdQg.js i TracePreviewHost-CPZPiGAC.js. Na tej podstawie odtworzono fixture kompozytora i transkryptu. Obsługa Arcee wyklucza datę i kontrolki z potwierdzenia użytkownika oraz czyta końcowe .markdown-content poza rozumowaniem. Publiczny bundle ustala MAX_MESSAGE_LENGTH na 50000; taki limit jest sprawdzany przed wpisaniem tekstu.

Publiczny GET copilot.com zwraca stronę Microsoft Copilot Sign in, bez edytora rozmowy. Dostosowanie kompozytora Copilot nadal opiera się na kontrolowanych strukturach DOM. **Nie przeprowadzono testu zalogowanej rozmowy Arcee ani Copilot z rzeczywistym modelem, mostem lub Studio. Integracje pozostają eksperymentalne.**

Przeszło 625 testów Node, 6 prób natywnego edytowania/wysyłki w Chromium i 12 prób pełnego interfejsu PlazCode. Te ostatnie ładują wszystkie skrypty grupy manifestu i overlay.css przy kontrolowanej stronie i odłączonym moście. Dla obu domen sprawdzają geometrię paska, odblokowane pole, kliknięcie Send i Enter bez Start Agent, z wykrytym i niewykrytym edytorem. Widoki: 980×596, 953×240 i 390×596. To sprawdzenie interfejsu na fixture, nie rozszerzenia zainstalowanego w prawdziwym koncie serwisu ani przeglądarki Firefox.

## Powtórzenie testów

```sh
cd tests
npm ci --no-audit --no-fund
npm test
```

Testy przeglądarki wymagają pakietu playwright dostępnego dla Node i Chromium. Z katalogu głównego:

```sh
PLAZCODE_CHROMIUM=/usr/bin/chromium node tests/browser/webchats-smoke.cjs
PLAZCODE_CHROMIUM=/usr/bin/chromium node tests/browser/webchats-layout.cjs
```

Sumy bieżącej paczki: `COMPOSER-R17-SHA256SUMS.txt`.
