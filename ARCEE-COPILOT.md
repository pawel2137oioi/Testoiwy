# Arcee i copilot.com — r24, rozszerzenie 1.24.32

## R24 — wysłana wiadomość i zwinięta historia Copilot

Zrzut r23 pokazuje, że wiadomość dotarła, lecz jej odczyt nie potwierdził dostarczenia. W kodzie znaleziono pomijanie całego button/role=button, także jeśli sam element był jawnie oznaczoną wiadomością. Poprawiono odczyt takich wiadomości i bloków kodu asystenta; Copy/menu, cytaty i reasoning pozostają poza źródłem komend. Treść użytkownika odczytywana jest z jawnych znaczników, z pominięciem metadanych. Nie wyznacza się roli na podstawie samego JSON lub położenia.

Pełna treść zwinięta przez CSS nie wymaga kliknięcia. Faktycznie skrócony nowy wpis można rozwinąć najwyżej raz, gdy ma zgodny prefiks co najmniej 80 znaków. Stare natywne ID oraz niejednoznaczne anonimowe remounty nie uprawniają do rozwinięcia; kontrolka potomna musi wskazywać treść wewnątrz tego samego wpisu. Rozwinięcie samo w sobie nie dowodzi wysyłki: nadal wymagane jest pełne echo. Stop i zmiana rozmowy przerywają tę ścieżkę. Nie klika się Send ponownie ani nie potwierdza dostarczenia na podstawie samej odpowiedzi asystenta.

Komunikat niepotwierdzonej wysyłki zawiera teraz liczbę odczytanych wpisów użytkownika i długość najbliższego zgodnego prefiksu. Raport diagnostyczny nie zapisuje źródła czatu. Testy Node i pełnego interfejsu odtwarzają błąd na r23 oraz poprawny przepływ na r24; model i most są kontrolowane. Nie przeprowadzono próby na zalogowanym Copilot, więc dokładna struktura DOM ze zrzutu nie jest potwierdzona. Wyniki: TESTY-TRZY-SERWISY.md.


## R23 — drugi znak końcówki: U+200C

R22 dopuszczało krótkie końcówki od U+200B, ale nie U+200B U+200C. Nowy zrzut pokazuje pełną parę, a porównanie na r22 odtwarza dokładnie 552/554/end/U+200B U+200C. Dodano U+200C wyłącznie jako drugi znak końcówki za całym niezmienionym własnym zapisem. Te same reguły obowiązują w echu. Dosłowne U+200C wewnątrz źródła lub w podanej końcówce pozostają zachowane; inny szkic i nieznana końcówka nadal blokują Send.

Testy dotychczasowego zestawu r22 rozszerzono o dokładną parę, literalne U+200C wewnątrz kodu i na końcu oraz różnicę wewnątrz szkicu. Pełny interfejs Chromium otrzymuje tę parę zarówno w polu, jak i w echu każdej wiadomości: klika Start Agent, odbiera kontekst, wysyła natywne pytanie i wykonuje jeden kontrolowany odczyt Studio. Fixture prawdziwych edytorów i zaufanego input również obejmują U+200C. Wyniki: TESTY-TRZY-SERWISY.md.

## R22 — U+200B po tekście i katalog Arcee bez powtarzania Start

Zrzut 1.24.29 wykazuje 552 oczekiwane i 554 odczytane jednostki UTF-16; pierwsza dodatkowa to U+200B. R22 nie wykonuje ogólnego usuwania znaków niewidocznych. Zapamiętuje dokładny własny zapis w WeakMap edytora i tylko wtedy porównuje prezentację z tym pełnym prefiksem oraz krótką dozwoloną końcówką od U+200B. Nie modyfikuje treści DOM. Literalne U+200B/FEFF w oczekiwanym źródle pozostają zachowane, również na końcu. Inny szkic, różnica wewnątrz źródła i nieznana końcówka nadal blokują Send. Zaufany input użytkownika usuwa własność zapisu. Transfer do nowego edytora następuje dopiero po sprawdzeniu granicy kompozytora i rozmowy. Echo użytkownika może mieć to samo opakowanie; nie wystarcza samo przerysowanie starej identycznej wiadomości.

Arcee ma teraz lokalną ścieżkę katalogu po jednej nieudanej korekcie odpowiedzi opisowej. Wykonywane jest wyłącznie rzeczywiste list_commands przez rozszerzenie. Odmowa modelu oraz sklasyfikowane uszkodzone lub inne polecenie nie są zastępowane katalogiem. Brak komend, błąd odpowiedzi (w tym ERROR wewnątrz Output), niepotwierdzony live-status wybranego silnika i zmiana rozmowy/silnika/Stop zatrzymują przekazanie kontekstu. Nie przypisuje się wykonania do zwykłej odpowiedzi modelu. Kontekst jawnie wyjaśnia, że katalog pobrało rozszerzenie; wszystkie części i gotowość muszą zostać potwierdzone. Ta ścieżka dowodzi dostarczenia katalogu, a nie poprawności przyszłej składni modelu.

Czytnik Arcee obsługuje też kompletny JSON będący jedyną zawartością pojedynczego inline code. Nie wykonuje inline przykładu otoczonego opisem, cytatu, odmowy ani kilku sąsiadujących przykładów. Naprawiono dodatkowo granicę wyrażenia regularnego rozpoznającego błąd `ERROR:` wewnątrz wyniku narzędzia.

Test controlled-editors.cjs na r21 odtwarza w kontrolowanym contenteditable Chromium dokładnie komunikat 552/554/end/U+200B; r22 przechodzi. Rzeczywiste React/Lexical/CodeMirror pozostają osobnymi próbami modeli edytora. Nowy webchats-startup.cjs ładuje cały zestaw content scripts i overlay.css, klika natywny Start Agent i po gotowości wysyła pytanie przez czat. Sprawdza jedną komendę get_studio_state, jej wynik i brak duplikacji. Dla Copilot obejmuje niewidoczną końcówkę; dla Arcee dwie odpowiedzi opisowe i lokalny katalog. Zegar stabilizacji odpowiedzi jest skrócony w fixture, odpowiedzi modelu i mostu są kontrolowane. Wyniki: TESTY-TRZY-SERWISY.md.

Nie przeprowadzono testu na zalogowanych kontach ani w prawdziwym Studio. Ustalono znak z komunikatu Copilot; zrzut Arcee nie dostarcza pełnego źródła ostatniej odpowiedzi. Obsługa inline code i lokalnego katalogu obejmuje warianty znalezione w kodzie, bez przypisywania ich jako pewnej przyczyny konkretnego DOM konta.

## R21 — stabilne źródło i faktyczna inspekcja

Copilot dotychczas sprawdzał tekst 100 ms po wpisaniu. Fixture z prawdziwym Lexical i opóźnionym handlerem paste odtwarza na r20 dokładny błąd „prepared text changed before sending”. R21 czeka najwyżej 2 sekundy na dokładne źródło stabilne przez 200 ms; nie ponawia wklejenia ani Send. Zmiana szkicu, rozmowy lub Stop nadal blokują wysłanie. Odczyt contenteditable bez oznaczenia Lexical omija CSS text-transform, nieedytowalne kontrolki i oznaczony techniczny BR; testy zachowują literalny BR, Unicode, NBSP, podwójne spacje i końcowy newline. Nie stosuje się trimowania ani normalizacji treści wysyłanego kodu. Komunikat odrzucenia podaje długości, indeks i kod pierwszego różniącego się znaku; diagnostyka zapisuje wyłącznie długości/indeks/etap.

Nie ustalono, czy na koncie użytkownika wystąpiło opóźnienie, inna struktura DOM czy inna różnica źródła. W środowisku nie ma dostępu do zalogowanego edytora Copilot. Zestawy React/Lexical i kontrolowany edytor akapitowy w Chromium weryfikują odtworzone warianty, bez twierdzenia, że są to prywatne komponenty Microsoft.

Tekst Arcee ze zrzutu nie zawiera komendy. Samo połączenie nie wysyła zawartości Studio do AI. Dodano instrukcję odczytu przy pytaniu o zawartość oraz jedną ograniczoną prośbę o odczyt, gdy AI go odkłada. Jest wysyłana tylko w aktywnej sesji Roblox, po sprawdzeniu live-status i niezmienionej rozmowie/generacji. Dozwolone są list_commands/list_tools, plazcode_status, get_studio_state, search_game_tree, inspect_instance, script_read i script_grep z rzeczywistych schematów. Inna komenda zatrzymuje tę ścieżkę przed dispatch; nie próbuje się zgadywać schematu. Kolejna zapowiedź bez inspekcji oznacza pauzę, bez fałszywego ukończenia. Teoria, zakaz narzędzi, doprecyzowanie celu, odmowa, zmiana czatu i Stop pozostają respektowane.

Po aktualizacji użyj nowego pustego czatu i Start Agent. To usuwa wpływ starego kontekstu startowego; nie usuwa się automatycznie istniejącego szkicu. Weryfikacja całego przepływu i wyniki: TESTY-TRZY-SERWISY.md.

## R20 — pierwsza sesja i potwierdzenie odbioru

Zapis pierwszej rozmowy Arcee z `/` lub `/playground` pod `/playground/<id>` nie unieważnia już sesji startowej. Nowy zapisany identyfikator po poprzednim zapisanym czacie nadal oznacza zmianę rozmowy. Przebudowanie pierwszej wiadomości lub późne nadanie jej ID nie przerywa startu. Copilot pomija wyłącznie metadane fromcode/hasLW i prompt=login przy identyfikacji rozmowy; inne wartości prompt nadal mają znaczenie.

Potwierdzenie wysyłki wymaga nowego pasującego wpisu użytkownika albo nowego natywnego ID przy braku wcześniejszego identycznego wpisu bez ID. Obsługuje wypełnienie pustego wiersza zamontowanego przed Send. Sam remount starego identycznego tekstu, nadanie mu późnego ID lub odpowiedź asystenta nie wystarczają. Dodano jawne znaczniki ról Copilot; nie zgaduje się roli na podstawie treści JSON.

Jeśli po potwierdzonym odbiorze Copilot pozostawił dokładnie wysłany tekst w polu, adapter usuwa go przez model edytora przed kolejnym krokiem. Inny szkic pozostaje nietknięty. Nie ma ponownego kliknięcia Send. Testy pełnego startu obu serwisów używają rzeczywistego startSession, watchera, adaptera i parsera; odpowiedzi modelu i mostu są kontrolowane. Dodatkowe próby React i Lexical sprawdzają też pozostawiony szkic i jego usunięcie z modelu.

Bieżący odczyt Copilot z tego środowiska blokował CONNECT 403. Nie wykonano próby na zalogowanych kontach ani w rzeczywistym Studio; zgodność z ich aktualnym DOM pozostaje do potwierdzenia. Wyniki: TESTY-TRZY-SERWISY.md.

## R19 — przygotowanie wiadomości Copilot i rzeczywiste bloki Arcee

Copilot: stary komunikat łączył zmianę edytora, tekstu i rozmowy. Teraz błędy je rozróżniają, a diagnostyka zapisuje długości bez treści wiadomości. Fokus jest rozstrzygany przed wpisaniem; zastąpienie pola jest dopuszczone wyłącznie wewnątrz przechwyconego lokalnego kontenera. Zmiana rozmowy, inny kontener lub inny szkic zatrzymują próbę bez kliknięcia. Zamiast zmieniać contenteditable/readOnly, blokada przechwytuje ręczne zdarzenia edycji. Programowa operacja może zaktualizować model strony przez handler wklejania tekstu. Nie czyta ani nie zmienia schowka systemowego.

W testach na prawdziwym Lexical zwykłe insertHTML nie aktualizowało dokumentu, a natywna selekcja i techniczny końcowy BR powodowały dodatkowe różnice. Obsługa wklejania, powiadomienie o selekcji i odczyt struktury akapitów zachowują pełny tekst, również puste linie i końcowe newline. Udokumentowano to jako test biblioteki, bez twierdzenia, że obejrzano prywatny kod Copilot.

Arcee: publiczny TracePreviewHost-CPZPiGAC.js renderuje pre jako komponent CodeInput, a funkcja Zt rozdziela json na js + linię on. Wspólny MAIN-world odczyt CodeMirror obsługuje standardowe cmView.rootView.view, a manifesty ładują go również na platform.arcee.ai. Czytnik używa pełnego dokumentu z długością, nie tekstu widocznego viewportu. Bez pełnego źródła nie wykonuje częściowego bloku. Usunięcie dokładnej linii on jest dopuszczone wyłącznie wokół jednego kompletnego obiektu JSON z command w rzeczywistym bloku; nie zmienia parametrów ani surowego Luau. Pierwsza prośba i korekta żądają zwykłego JSON bez znaczników markdown.

Łącznie przechodzi 651 testów Node i 32 próby Chromium. Nowy zestaw controlled-editors.cjs używa React 19.2.0, Lexical 0.38.2 i CodeMirror 6. Sprawdza wymianę pola po fokusie i input, zgodność z wewnętrznym modelem, pojedynczy Send, tekst wielowierszowy/Unicode/newline, blokadę ręcznego pisania, czyszczenie szkicu i pełne źródło wirtualizowanego CodeMirror. Testy rzeczywistej funkcji startSession odtwarzają blok on/list_commands ze zrzutu i pomyślny protokół z kontekstem, również po korekcie. Nie są próbą na zalogowanych kontach z rzeczywistym modelem lub Studio.

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
3. Sprawdź wersję **1.24.32**. Raport transportu nowych adapterów: **core:r24/parser:r13/provider:r24**. Na pustym polu Start Agent musi potwierdzić połączenie przez list_commands i odbiór kontekstu.
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
PLAZCODE_CHROMIUM=/usr/bin/chromium node tests/browser/webchats-startup.cjs
```

Sumy bieżącej paczki: `WEBCHATS-R24-SHA256SUMS.txt`.


### Dodatkowe testy kontrolowanych bibliotek

To zależności wyłącznie testów przeglądarki; rozszerzenie ich nie potrzebuje. Przykład instalacji w osobnym katalogu:

```sh
npm install --prefix /tmp/plazcode-ui-r19 --cache /tmp/plazcode-npm-cache --no-audit --no-fund --package-lock=false react@19.2.0 react-dom@19.2.0 lexical@0.38.2 @lexical/plain-text@0.38.2 @codemirror/view@6.38.8 @codemirror/state@6.5.2 esbuild@0.25.11
PLAZCODE_BROWSER_DEPS=/tmp/plazcode-ui-r19 PLAZCODE_CHROMIUM=/usr/bin/chromium node tests/browser/controlled-editors.cjs
```

Pakiet playwright musi być dostępny dla Node jak w pozostałych próbach przeglądarki. Zestaw buduje fixture w pamięci przez esbuild; nie zmienia plików runtime ani zależności tests/package-lock.json.
