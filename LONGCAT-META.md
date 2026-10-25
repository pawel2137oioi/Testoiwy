# Meta AI i LongCat — rozszerzenie 1.24.44 / r36

## Meta AI r36: zapis przez natywny model Lexical

Raport r35 potwierdził działające wykrywanie Send `composer-send-button` na poziomie 9. Wskazał też osobny błąd: po zapisie do ukrytego textarea widoczny dokument miał 0 z oczekiwanych 552 znaków. Dla widocznego `data-lexical-editor="true"` adapter używa teraz istniejących natywnych zdarzeń paste/delete, zamiast kończyć zapis po ustawieniu hidden textarea. Nie zmienia prywatnego modelu ani `textContent`; dokładny odczyt widocznego dokumentu nadal blokuje niekompletną wysyłkę. Zachowano starszy kontrakt mirror dla edytorów bez znacznika Lexical.

Nowa regresja używa prawdziwego Lexical i React z jednokierunkowym mirror. Wpis do ukrytego textarea może włączyć Send, ale nie aktualizuje dokumentu Lexical; dopiero edycja Lexical zasila właściwy model i mirror. Poprzednie dwukierunkowe fixture nie ujawniało tej luki. To test kontrolowany, nie obserwacja wewnętrznego modelu zalogowanego konta.

## Meta AI r35: głębsza struktura kompozytora

Wcześniejszy raport r34 wskazuje błąd przed wysłaniem wiadomości: wykryto widoczny edytor Lexical `composer-input` i jego ukryty textarea mirror, ale w sześciu sprawdzanych przodkach nie było kontrolek. Na zrzucie widać gotowy szkic i aktywną strzałkę. Resolver ograniczony do sześciu poziomów zwracał fallback do rodzica samego edytora, więc `frame_found:true` nie oznaczało znalezienia przycisku. Nie jest to błąd parsera ani odmowa modelu.

Dla Meta resolver przechodzi do 24 przodków i wybiera najbliższą lokalną granicę zawierającą rozpoznane Send/Stop oraz jedno widoczne pole. Nie przechodzi przez granice głównej treści, formularzy ani transkryptu i nie szuka dowolnej strzałki na stronie. Ukryty mirror pozostaje częścią jednego kompozytora; niejednoznaczne przyciski lub obce pola blokują wysyłkę. Rozszerzony ograniczony raport pokazuje głębszy kontekst i rozróżnia fallback pola od znalezienia kontrolek. Zasady jednej wysyłki i dokładnego potwierdzenia pozostają wymagane.

Raport r34 nie zawierał rzeczywistych atrybutów Send ani całego drzewa kompozytora; późniejszy raport r35 potwierdził `composer-send-button` na poziomie 9. Głębszy układ sprawdza kontrolowana regresja React/Lexical odtwarzająca pierwsze sześć przodków; nie jest to deklaracja bieżącego odczytu całej strony konta. Wcześniejsza odmowa modelu pozostaje osobnym wynikiem opisanym poniżej.

## Meta AI: odczyt odpowiedzi i odmowa modelu

Aktywny adapter `providers/webchats.js` rozpoznaje widoczne textarea z etykietą lub placeholderem Meta AI, także polskie „Zapytaj Meta AI…”. Lokalne Send/Stop mogą być natywnym button albo elementem `role="button"`; obsługiwane są ich dostępne etykiety, w tym polskie. Dwa niejednoznaczne przyciski lub edytory zatrzymują wysyłkę. Disabled i aria-disabled nie są wymuszane na aktywne.

Odpowiedzi `.ur-markdown` są odczytywane jako natywna treść asystenta. Dodano jawne role `data-message-role` i `data-author`; wykluczono je ze starszego rozpoznania użytkownika. Cytaty, rozumowanie i treść wiadomości użytkownika nie stają się odpowiedziami asystenta. Dokładny tekst kodu, w tym spacje i symbole, pozostaje źródłem poleceń. Istniejący czytnik logicznych linii i pełnego Raw JSON zachowano; skrócone drzewo JSON nie jest źródłem komendy.

Na wcześniejszym zrzucie użytkownika model Meta **wyraźnie odmawia udziału w protokole zewnętrznego agenta**. Po świeżej ustabilizowanej odmowie PlazCode wyświetla **AI declined the connection request**, także jeśli nowe echo użytkownika jest skrócone. Odmowa nie potwierdza dostarczenia i nie oznacza gotowej sesji. Nie ma drugiego Send, korekty protokołu ani poleceń projektu; pole zostaje odblokowane. Starej odmowy lub remountu starej odpowiedzi nie przypisuje się do nowej próby. Poprawka usuwa mylący komunikat transportu, ale nie wymusza zgody modelu i nie zmienia promptu w celu obejścia odmowy.

Jeśli po 12 s Meta nadal pokazuje natywny Stop, adapter czeka na potwierdzenie dodatkowo najwyżej 30 s. To obsługuje późne zamontowanie pierwszej odpowiedzi i starszego wrappera użytkownika. Nadal wymaga pełnego nowego echa lub świeżej odmowy; samo generowanie nie potwierdza wysyłki. Oczekiwanie można anulować i nigdy nie powoduje drugiego Send.

Przy rzeczywistym błędzie startu dostępny jest **Copy transport report** także dla Meta. Nowy opis kompozytora ma ograniczoną liczbę kandydatów, przodków i kontrolek oraz wyłącznie znaczniki techniczne i flagi. Nie zawiera szkicu, dowolnych aria-label/placeholder/ID/klas, URL ani źródła SVG. Sam helper nie klika ani nie modyfikuje strony. Nie jest to deklaracja, że cały starszy czytnik raportu nigdy nie wybiera Raw w rozpoznanym bloku Meta.

## LongCat: dane otrzymane ze strony użytkownika

Użytkownik potwierdził `https://longcat.ai/chat/` i podał pusty paragraf ProseMirror z `data-placeholder="Tell me what you need."`, marker Stop `#icon-stop` oraz SVG Send z `#icon-send`. R34 rozpoznaje taki kompozytor bez wymogu role lub test ID. Ikony są sprawdzane wyłącznie w lokalnym kompozytorze; nie wybiera się przycisku po kształcie, kolorze lub położeniu. Gdy wrapper nie ma metody click, zwykłe zdarzenie click na potwierdzonym SVG bąbelkuje do natywnej obsługi; nie symuluje zdarzenia zaufanego. Stop blokuje dalszą wysyłkę.

Domyślne wklejanie tekstu ProseMirror scalało kolejne końce linii. Dla LongCat ProseMirror adapter przekazuje też odpowiednio escapowane HTML jednego akapitu z twardymi końcami linii do natywnego parsera schowka. Zachowuje puste linie, wcięcia i końcowy nowy wiersz w rzeczywistym dokumencie ProseMirror oraz `Tiptap.getText()`. Nie wstawia kodu HTML z treści ani nie zmienia prywatnego modelu. Dokładnie określony pusty `img.ProseMirror-separator` kursora jest pomijany przy wykrywaniu załączników; prawdziwe obrazy nadal blokują automatyczne dopisywanie tekstu.

Natywne kontenery transkryptu `.message-list .user-text` i `.md-show-container .mt-markdown-body` oraz źródło `code.code-block-body` pochodzą z publicznych klientów **longcat.chat**. Są dodatkowym kontraktem czytnika, a nie potwierdzeniem obecnego transkryptu longcat.ai. Kompletne literalne źródło jest wymagane; jawna wirtualizacja lub nieczytelny blok zatrzymują całą odpowiedź.

## Źródła i granice potwierdzenia

Zarejestrowane adresy to `https://www.meta.ai/` oraz `https://longcat.ai/chat/`, wraz z wariantami tych samych domen `meta.ai` i `www.longcat.ai`. Domena longcat.chat nie została zarejestrowana jako nowy serwis.

Bezpośredni odczyt obu docelowych stron jest blokowany w środowisku przez proxy (CONNECT 403), także po przyznaniu uprawnienia sieciowego. Nie odczytano modelu zalogowanego konta ani całego obecnego DOM użytkownika. Integracje pozostają oznaczone experimental. Testy kontrolowanego modelu i mostu nie gwarantują, że Meta zgodzi się na ten protokół lub że przyszły wariant strony zachowa te kontrakty.

Publiczne źródła:

- [meta-ai-mcp, meta_chat.py](https://github.com/chang-pro/meta-ai-mcp/blob/1576376f32e6f0772eb9052020e30be4c5e72e14/meta_chat.py#L97-L113): `.ur-markdown` oraz jawne role wiadomości. Są to publiczne hooki, nie HTML pobrany z konta użytkownika.
- [Finetune Exporter](https://github.com/Lombard-Web-Services/Finetune-Exporter/blob/e71603bc187b905414e4599fe5f305e5ceb89ad9/Finetune_Exporter.js): Meta `data-message-type`, `data-message-item` oraz `_user`/`_assistant` w natywnych ID. Fallback uznający nieznany wpis za użytkownika nie został przeniesiony.
- [metaai-cookie-client](https://github.com/Bl0ck154/metaai-cookie-client/blob/af2454f0038a069b973f7fa5579a409bc5bf5530/src/browser-flow.js): widoczne textboxy i etykiety Send/Отправить. Nie uruchamiano klienta, nie importowano cookies ani nie używano generowania.
- Istniejący `providers/meta.js`: starszy kontrakt composer-input, send/stop, assistant-message, ukrytego textarea, `span.block` i `ur-code-block`. Stary adapter nie jest ładowany w nowych grupach manifestów; nie używa się jego wielokrotnych kliknięć Send ani usuwania znaków z JSON.
- [ai-rtl-resolver, src/sites/longcat.ts](https://github.com/miladniroee/ai-rtl-resolver/blob/41dc094bc94a918f04e82687e277092702b7f954/src/sites/longcat.ts) i [codedown, content.js](https://github.com/tyhallcsu/codedown-chrome-extension/blob/0318be15d91af6b4b14c57bb9a875e2c295e7bd4/content.js#L1739-L1810): kontenery i bloki kodu longcat.chat. Nie są dowodem aktualnego transkryptu longcat.ai.

## Instalacja i odtwarzanie testów

Podmień cały folder `PlazCode-Extension` albo `PlazCode-Extension-Firefox`, przeładuj rozszerzenie i odśwież kartę. Zachowaj jedną aktywną instalację. Sprawdź **1.24.44** i **core:r36/parser:r13/provider:r36**. Włącz istniejący PlazCode.exe oraz wybrany silnik. Start Agent wymaga pustego pola i potwierdzonego katalogu oraz odbioru wszystkich części kontekstu. Nowy klucz API nie jest potrzebny. EXE i kanał aktualizacji aplikacji desktopowej pozostają bez zmian.

W katalogu repozytorium, przy dostępnym Chromium i pakiecie playwright dla Node:

```sh
npm ci --prefix tests --no-audit --no-fund
npm test --prefix tests
node tests/browser/meta-r34.cjs
node tests/browser/meta-native-startup-r34.cjs
PLAZCODE_BROWSER_DEPS=/tmp/plazcode-ui-r19 node tests/browser/meta-deep-composer-r35.cjs
node tests/browser/meta-editor-r36.cjs
PLAZCODE_NEW_SITES=1 node tests/browser/webchats-startup.cjs
PLAZCODE_NEW_SITES=1 node tests/browser/webchats-layout.cjs
```

Do prób rzeczywistych bibliotek LongCat potrzebne są wyłącznie zależności testowe w oddzielnych katalogach; rozszerzenie ich nie używa. React/Lexical/CodeMirror i esbuild opisano w [ARCEE-COPILOT.md](ARCEE-COPILOT.md). ProseMirror/Tiptap:

```sh
npm install --prefix /tmp/plazcode-pm-r31 --cache /tmp/plazcode-npm-cache --no-audit --no-fund --package-lock=false prosemirror-model@1.25.0 prosemirror-state@1.4.3 prosemirror-view@1.40.0 prosemirror-schema-basic@1.2.4
npm install --prefix /tmp/plazcode-tiptap-r34 --cache /tmp/plazcode-npm-cache --no-audit --no-fund --package-lock=false @tiptap/core@2.11.5 @tiptap/extension-document@2.11.5 @tiptap/extension-paragraph@2.11.5 @tiptap/extension-text@2.11.5 @tiptap/extension-hard-break@2.11.5
node tests/browser/longcat-editor.cjs
node tests/browser/longcat-native-startup-r34.cjs
```

Fixture używa domyślnych parserów bibliotek, bez własnego parsera wklejania. Model strony, odpowiedzi AI i most pozostają kontrolowane; nie łączą się z prawdziwym kontem ani Studio. Wyniki i zakres powtórzonej regresji: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md). Sumy bieżących plików: `WEBCHATS-R36-SHA256SUMS.txt`.
