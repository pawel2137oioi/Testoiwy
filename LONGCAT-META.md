# LongCat i Meta AI — rozszerzenie 1.24.41 / r33

## Zakres i dostęp do stron

Zarejestrowane adresy: https://longcat.ai/chat/ i https://www.meta.ai/. Użytkownik potwierdził, że LongCat pozostaje na longcat.ai. Obsługiwane są też www.longcat.ai i meta.ai jako warianty tych samych domen. Nie rejestruje się innego serwisu pod longcat.chat.

Bezpośrednie GET obu stron w tym środowisku są blokowane przez proxy na CONNECT (403), również po przyznaniu uprawnienia sieciowego. Nie odczytano obecnego HTML ani modelu zalogowanego konta. Integracje mają etykietę experimental. **Szczególnie dla longcat.ai nie potwierdzono, że bieżący interfejs udostępnia skonfigurowane znaczniki ról i przycisków.** Testy semantycznego DOM nie dowodzą tego. Nie można na tej podstawie zagwarantować bezbłędnego działania na rzeczywistej stronie.

Meta opiera się na konkretnych publicznych kontraktach oraz istniejącym w repozytorium adapterze opisanym wcześniej jako zweryfikowany w lipcu 2026. Nie traktuje się tego komentarza jako własnej bieżącej obserwacji. Źródła:

- [Finetune Exporter](https://github.com/Lombard-Web-Services/Finetune-Exporter/blob/e71603bc187b905414e4599fe5f305e5ceb89ad9/Finetune_Exporter.js): data-message-type, data-message-item oraz oznaczenia _user/_assistant w natywnych ID. Wykorzystano wyłącznie jawne role; fallback eksportera uznający nieznany wpis za użytkownika nie został przeniesiony.
- [metaai-cookie-client](https://github.com/Bl0ck154/metaai-cookie-client/blob/af2454f0038a069b973f7fa5579a409bc5bf5530/src/browser-flow.js): widoczne textboxy oraz dostępne etykiety Send/Отправить. Nie uruchamiano tego klienta, nie importowano cookies i nie korzystano z jego funkcji generowania.
- Istniejący providers/meta.js: kontrakt composer-input, composer-send-button, composer-stop-button, assistant-message, ukrytego textarea, linii span.block i widoku ur-code-block. **Stary plik nie jest ładowany przez żaden nowy wpis manifestu.** Aktywny adapter to providers/webchats.js; stare wielokrotne kliknięcia Send i usuwanie symboli z podglądu JSON nie są używane.

Publiczne skrypty układu LongCat znalezione w analizie dotyczyły longcat.chat, więc nie przedstawia się ich jako dowodu struktury longcat.ai. W adapterze LongCat zastosowano konserwatywne, jawne znaczniki semantyczne; nie zgaduje się roli po kolorze, wyrównaniu lub dowolnym elemencie z markdownem. Nierozpoznany interfejs pozostawia zwykłe pisanie dostępne, a agent nie powinien klikać przypadkowych kontrolek.

## Działanie

Adaptery korzystają ze wspólnego potwierdzonego wysyłania: jeden lokalny kompozytor, dokładny własny zapis, jeden Send i pełne nowe echo użytkownika. Nie przechodzą na Enter po niepewnym kliknięciu i nie ponawiają wysyłki. Oczekują na opóźniony zapis kontrolowanego modelu, dopuszczają bezpieczny remount w tym samym kompozytorze i zachowują obcy szkic. Dwa widoczne edytory lub niejednoznaczne przyciski wysyłania zatrzymują operację. Staged image/file pozostaje na stronie i blokuje dopisanie tekstu startowego. Obrazy przez agenta są wyłączone, dopóki ich dostarczanie nie zostanie osobno potwierdzone.

Meta obsługuje widoczny edytor sterowany ukrytym composer-input textarea, bez blokowania atrybutów należących do frameworka. Pole jest wykrywane przed pojawieniem się Send. Pasek znajduje się nad kompozytorem, a przy niejednoznacznym edytorze dokuje u góry i mieści się w szerokości okna. Natywne kliknięcie Send i Enter bez uruchomionego agenta pozostają działające.

Start wymaga rzeczywistego katalogu i świeżego potwierdzenia wybranego silnika. Model musi zwrócić list_commands i potwierdzić każdą część całego kontekstu; nie pomija się instrukcji Ultra, preferencji ani pamięci. Odmowa zatrzymuje start. R32 zachowuje limity pojedynczego kroku oraz ciągłość rozmowy podczas wirtualizacji. Nowe odpowiedzi bez ID można przypisać do potwierdzonego wysłania na podstawie pełnego echa i natywnej kolejności; stara odpowiedź nie jest dowodem nowej.

Kod czytany jest dosłownie, z pominięciem rozumowania, cytatów, Copy i kart PlazCode. Meta rekonstruuje logiczne linie span.block. Interaktywne drzewo JSON może skracać wartości; adapter raz wybiera Raw w rozpoznanym bloku asystenta i oczekuje pełnego pre. Nie usuwa trójkątów ani innych znaków z kodu i ciągów tekstowych. Brak źródła blokuje całą odpowiedź. Nieczytelny pusty viewer otrzymuje ograniczony czas na wyrenderowanie Raw, po czym pojawia się Full code source unavailable zamiast długiego oczekiwania na pustą odpowiedź.

## Instalacja i powtórzenie testów

Podmień cały folder PlazCode-Extension albo PlazCode-Extension-Firefox, przeładuj rozszerzenie i odśwież karty. Wersja 1.24.41; raport core:r33/parser:r13/provider:r33. Uruchom istniejący PlazCode.exe i wybrany silnik, otwórz pustą rozmowę i Start Agent. Nowy klucz API nie jest potrzebny. EXE i kanał aktualizacji aplikacji desktopowej nie zostały zmienione.

```sh
npm ci --prefix tests --no-audit --no-fund
npm test --prefix tests
PLAZCODE_NEW_SITES=1 node tests/browser/webchats-startup.cjs
PLAZCODE_NEW_SITES=1 node tests/browser/webchats-layout.cjs
PLAZCODE_EDITOR_HOST=longcat.ai PLAZCODE_BROWSER_DEPS=/tmp/plazcode-ui-r19 node tests/browser/controlled-editors.cjs
PLAZCODE_EDITOR_HOST=www.meta.ai PLAZCODE_BROWSER_DEPS=/tmp/plazcode-ui-r19 node tests/browser/controlled-editors.cjs
```

Chromium i playwright muszą być dostępne dla Node. Zależności wyłącznie testów React/Lexical/CodeMirror oraz sposób instalacji są w ARCEE-COPILOT.md. Fixture są kontrolowane; nie łączą się z rzeczywistym modelem, kontem ani Studio. Szczegółowe wyniki: TESTY-TRZY-SERWISY.md. Sumy: WEBCHATS-R33-SHA256SUMS.txt.
