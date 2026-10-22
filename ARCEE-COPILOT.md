# Arcee i copilot.com — r18, rozszerzenie 1.24.26

## R18 — puste pole Copilot bez przycisku Send

Po aktualizacji r17 użytkownik potwierdził, że wpisanie dowolnego tekstu uruchamia wykrywanie. Rozpoznanie kompozytora było zależne od przycisku pojawiającego się dopiero po wpisaniu. Teraz Copilot może zostać rozpoznany przed montażem Send: po etykiecie pola wiadomości/Copilot albo jako jedyny widoczny edytor w głównej części adresu /chat. Dotyczy również parametrów prompt=login i hasLW=false ze zrzutu, które same nie oznaczają strony logowania.

Najpierw sprawdzane jest pole i przygotowywana wiadomość, a dopiero potem agent czeka na aktywny przycisk w lokalnym kontenerze. Wspierane są polskie etykiety Wyślij/Prześlij oraz Zatrzymaj/Przerwij. Gdy przycisk się nie pojawi, nie ma kliknięcia innej kontrolki ani zastępczego Enter. Kilka kandydatów nadal oznacza brak automatycznego wyboru. Pisanie przed Start Agent nie jest już wymagane.

Dodano 6 testów Node i 3 widoki pełnego interfejsu z pustym edytorem, brakiem Send, jego pojawieniem się po zdarzeniu input i usunięciem po wysłaniu. Sprawdzono pierwszą wiadomość bez ręcznego znaku oraz zwykłe kliknięcie/Enter. Na r17 5 z 21 testów kompozytora nie przechodziło; r18 zalicza wszystkie. Łącznie: 631 testów Node, 6 prób wysyłki i 15 prób pełnego interfejsu Chromium. To fixture i kontrolowany most; nie test prawdziwego modelu na koncie użytkownika. Odczyt /chat w tej sesji blokował CONNECT 403.

## Co poprawiono po zrzutach w r17

W r16 adapter wymagał formularza lub wymyślonego znacznika kontenera, a contenteditable musiał mieć rolę textbox. Arcee używa textarea `#chat-input-textarea` poza formularzem. Gdy pole nie zostało rozpoznane, wspólny interfejs dokował pasek na dole ekranu, zakrywając natywny czat.

R17 rozpoznaje rzeczywisty kompozytor Arcee, w tym przycisk Send początkowo zablokowany dla pustego pola. Obsługuje też lokalne kompozytory bez formularza, test ID i roli textbox oraz edytory contenteditable true/plaintext-only. Szuka najbliższego lokalnego wiersza z przyciskiem wysyłania/zatrzymania; nie przeszukuje przycisków całej strony ani innych formularzy. Niejednoznaczny wybór kilku edytorów nadal blokuje agenta.

Pasek obu nowych adapterów znajduje się nad wykrytym kompozytorem, bez dopisywania odstępów i szerokości do elementów strony. Wysokość paska jest mierzona po ustawieniu szerokości. Gdy edytor nie jest rozpoznany, pasek trafia na górę okna. Naprawiono minimalną szerokość 520 px, która wypychała taki pasek poza wąskie okno. Zwykłe pisanie i natywne wysyłanie nie wymagają uruchomienia agenta.

## Instalacja

1. Podmień cały folder rozszerzenia i przeładuj go. Zachowaj jedną aktywną instalację. Chrome/Edge: `PlazCode-Extension`; Firefox: `PlazCode-Extension-Firefox`.
2. Odśwież kartę Arcee lub dokładnie `https://copilot.com/`. Nie dodano domeny copilot.microsoft.com. EXE pozostaje bez zmian.
3. Sprawdź wersję **1.24.26**. Raport transportu nowych adapterów: **core:r18/parser:r13/provider:r18**. Na pustym polu Start Agent musi potwierdzić połączenie przez list_commands i odbiór kontekstu.
4. Jeżeli aktualny interfejs serwisu nadal nie zostanie rozpoznany, zwykły czat pozostaje dostępny, a agent nie powinien klikać przypadkowych przycisków. Dla innej domeny po przekierowaniu ta rejestracja nie obowiązuje.

Nie potrzeba nowego klucza API. Integracja korzysta z otwartej rozmowy w przeglądarce. Wysyłanie obrazów pozostaje niezweryfikowane. Brak potwierdzenia wiadomości przez nowy wpis użytkownika zatrzymuje wysyłkę bez ponownego kliknięcia; przed ręczną próbą sprawdź historię, ponieważ wiadomość mogła dotrzeć.

## Co rzeczywiście sprawdzono

23 października 2026 według Europe/Warsaw publiczne adresy były już dostępne. Odczytano Arcee index-Cy3oA8To.js, ChatComponentsMobile-DL3KqdOn.js, StickyButton-CL_LSdQg.js i TracePreviewHost-CPZPiGAC.js. Na tej podstawie odtworzono fixture kompozytora i transkryptu. Obsługa Arcee wyklucza datę i kontrolki z potwierdzenia użytkownika oraz czyta końcowe .markdown-content poza rozumowaniem. Publiczny bundle ustala MAX_MESSAGE_LENGTH na 50000; taki limit jest sprawdzany przed wpisaniem tekstu.

Publiczny GET copilot.com zwraca stronę Microsoft Copilot Sign in, bez edytora rozmowy. Dostosowanie kompozytora Copilot nadal opiera się na kontrolowanych strukturach DOM. **Nie przeprowadzono testu zalogowanej rozmowy Arcee ani Copilot z rzeczywistym modelem, mostem lub Studio. Integracje pozostają eksperymentalne.**

W r17 przeszło 625 testów Node, 6 prób natywnego edytowania/wysyłki w Chromium i 12 prób pełnego interfejsu PlazCode. Te ostatnie ładują wszystkie skrypty grupy manifestu i overlay.css przy kontrolowanej stronie i odłączonym moście. Dla obu domen sprawdzają geometrię paska, odblokowane pole, kliknięcie Send i Enter bez Start Agent, z wykrytym i niewykrytym edytorem. Widoki: 980×596, 953×240 i 390×596. To sprawdzenie interfejsu na fixture, nie rozszerzenia zainstalowanego w prawdziwym koncie serwisu ani przeglądarki Firefox.

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

Sumy bieżącej paczki: `COPILOT-R18-SHA256SUMS.txt`.
