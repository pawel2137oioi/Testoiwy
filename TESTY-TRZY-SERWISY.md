# Raport weryfikacji — 2026-10-23

## r17 — dostępny czat i rozpoznawanie kompozytora

**625/625 testów Node**, bez błędów i pominięć. Dodano 15 testów: kompozytor Arcee z publicznego bundle, odczyt końcowej odpowiedzi i echa użytkownika bez metadanych, limit 50000, lokalne pola bez formularza/roli textbox, plaintext-only, odtworzenie pola po SPA, inne formularze/transkrypt/PlazCode oraz niejednoznaczne edytory. Wcześniejsze testy r16 zachowano, zmieniając przypadek odrzucenia na faktyczny brak lokalnych kontrolek zamiast samego braku formularza.

**6/6 prób Chromium wysyłki** (`tests/browser/webchats-smoke.cjs`) i **12/12 prób pełnego interfejsu** (`tests/browser/webchats-layout.cjs`). Zestaw interfejsu ładuje całą grupę content scripts manifestu i overlay.css, z kontrolowaną stroną i odłączonym mostem. Sprawdza natywne wpisywanie, kliknięcie Send i Enter przy nieuruchomionym agencie, brak przecięcia paska z polem, widoczność w oknie oraz niewykryty edytor. Widoki: 980×596, 953×240, 390×596. Wykrył także minimalną szerokość 520 px wychodzącą poza ekran; po poprawce przechodzą wszystkie widoki.

Publiczne źródła Arcee odczytano 23 października według Europe/Warsaw. Fixture jest odtworzone z bundle, bez konta i danych użytkownika. Copilot bez logowania zwraca stronę Sign in. Nie potwierdzono zalogowanego przepływu model–most–Studio ani rzeczywistej instalacji w Firefox. Obie integracje nadal są eksperymentalne. Wersja 1.24.25, core/provider r17, parser r13. Sumy: `COMPOSER-R17-SHA256SUMS.txt`.

---

# Raport weryfikacji — 2026-10-22
## r16 — eksperymentalne Arcee i dokładnie copilot.com

**610 testów, 610 zaliczonych, 0 nieudanych i 0 pominiętych.** Polecenie: `cd tests && npm test`. Dodano 58 przypadków dla nowych adapterów: wspólny kontrakt wysyłki, rzeczywiste funkcje startu i parsera, kontekst Ultra dla Roblox/AgentScript, potwierdzanie części, odmowy, nieznane role, brak granicy kompozytora i niejednoznaczne edytory, contenteditable, natywny limit i kompletny długi kod Luau. Poprzednie 552 testy pozostają zaliczone.

**6/6 prób Chromium**: każda domena z textarea oraz contenteditable w trybach białych znaków pre-wrap i normal. Test `node tests/browser/webchats-smoke.cjs` korzysta z natywnego edytora Chromium. Sprawdza dokładny tekst wraz z pustymi liniami, końcowym newline, Unicode i znakami HTML, jedno kliknięcie, potwierdzenie, przywrócenie blokady i szkic. Wykrył różnicę w insertText, które tworzyło dodatkowe puste linie; poprawka używa natywnego wstawiania escapowanego tekstu w pre-wrap i sprawdza treść przed wysłaniem.

**Ograniczenie:** fixture obu nowych serwisów są syntetyczne. Proxy zwraca CONNECT 403; nie obejrzano zalogowanego DOM i nie potwierdzono rzeczywistego działania platform.arcee.ai ani copilot.com. Wersja 1.24.24 jest eksperymentalna dla tych adresów. Nie zarejestrowano copilot.microsoft.com. Instrukcja: `ARCEE-COPILOT.md`. Raport: `core:r16/parser:r13/provider:r16`; sumy: `WEBCHATS-R16-SHA256SUMS.txt`.

## r15 — oczekiwanie Motif na zwrócony wynik odczytu

**552 testy, 552 zaliczone, 0 nieudanych i 0 pominiętych.** Polecenie: `cd tests && npm test`, Node.js 24.19.0 na Linux x86_64. Zestaw Motif rozszerzono z 25 do 42 przypadków. Na zachowanym kodzie r14 przechodziły 34, a 8 nie przechodziło; po poprawce przechodzą wszystkie 42.

Dodano 17 przypadków: czekanie na wynik po polsku i angielsku (3); sekwencja ze zrzutu z przypomnieniem wcześniejszego `script_read` po `inspect_instance` i `get_studio_state` (1); odnawianie limitu po rzeczywistej komendzie (1); pauza po dwóch kolejnych odpowiedziach bez komendy (1); oczekiwanie na użytkownika i końcowe odpowiedzi (5); brak wcześniejszego wyniku (1); niepewny błąd narzędzia (1); Stop (1); ograniczenie przypomnienia do trzech wyników (1); oddzielenie nowego zadania w kolejce (1); nazwa narzędzia w inline `<code>` (1).

Test sekwencji ze zrzutu wymaga jednego wykonania każdego zaplanowanego odczytu. Przypomnienie zawiera dokładny tekst wcześniejszego wyniku `script_read`, a nie nową odpowiedź mostu lub deklarację sukcesu. Wyniki są zapamiętywane po potwierdzonym wysłaniu. Test dłuższej kontynuacji przechodzi przez trzy momenty oczekiwania rozdzielone poprawnymi komendami; test braku postępu wymaga pauzy po dwóch próbach i nieukończonego checkpointu. Przy zmianie zadania stare wyniki i licznik wykonanych narzędzi nie uprawniają do automatycznej kontynuacji nowego zadania.

Mechanizm pozostaje ograniczoną heurystyką polskich i angielskich wypowiedzi. Zrzut nie dowodzi, że odczyt `BuildSolarisHud` rzeczywiście został wywołany. Poprawka nie dopisuje jego wyniku: przypomina wyniki posiadane przez PlazCode i pozwala modelowi zlecić brakujący odczyt. Nie przeprowadzono testu zalogowanego Motif ani rzeczywistego Studio. Nowe wersje: rozszerzenie 1.24.23, `core:r15/parser:r13/provider:r15` dla Motif. Wcześniejsze poprawki Luau pozostają zachowane.

## r14 — przerwana kontynuacja Motif po `search_game_tree`

**535 testów, 535 zaliczonych, 0 nieudanych i 0 pominiętych.** Uruchomiono `npm test` w `tests/`, Node.js 24.19.0 na Linux x86_64. Składnia sześciu zmienionych plików runtime przechodzi kontrolę; kopie są zgodne w katalogu głównym, `PlazCode-Extension` i `PlazCode-Extension-Firefox`. Manifesty mają wersję 1.24.22. Parser i pozostałe poprawki Luau z r13 pozostają zachowane.

Nowy zestaw `tests/motif-continuation.test.cjs` ma **25 przypadków**. Na zachowanym kodzie r13: **14 zaliczonych, 11 nieudanych**. Po poprawce: **25 zaliczonych**. Liczba przypadków nie oznacza liczby niezależnych usterek. Zestaw wykorzystuje rzeczywisty adapter, parser, watcher, walidator i `agentLoop`; podstawione są odpowiedzi modelu, wynik mostu, zegar i niezwiązane z transportem elementy interfejsu/checkpointów.

| Zakres | Przypadki |
| --- | ---: |
| Sprostowanie wcześniejszego braku dostępu, w tym tekst ze zrzutu, po polsku i angielsku | 3 |
| Rzeczywista odmowa, również po sprostowaniu | 4 |
| Komenda i odmowa w kolejnych sekcjach `.prose` | 2 |
| Wynik `search_game_tree` → zapowiedź bez komendy → kontynuacja → `get_studio_state` → końcowa odpowiedź | 2 |
| Końcowa odpowiedź, pytanie, oczekiwanie na potwierdzenie i odmowa po wyniku | 5 |
| Limit dwóch kontynuacji, szybkie pytanie, zapowiedź przed pierwszym narzędziem, niepewne wysłanie i Stop | 5 |
| Przebudowanie starej odpowiedzi przy opóźnieniu nowej: z ID, bez ID i z późno nadanym ID; brak nowej odpowiedzi | 4 |

Test niepewnego wysłania wymaga jednego kliknięcia Send i jednego wykonania narzędzia. Test braku odpowiedzi dopuszcza jedną tekstową prośbę o wznowienie, ale nie ponowne wywołanie narzędzia. Testy przebudowy DOM sprawdzają, że stara komenda nie jest powtarzana, a nowa odpowiedź może zakończyć zadanie. Powtarzane zapowiedzi kończą się pauzą i nieukończonym checkpointem. Odmowy i pytania nie powodują automatycznych próśb o kolejne polecenie.

**Ograniczenia:** tekst sprostowania i zapowiedzi odtworzono ze zrzutu, ale sam obraz nie dostarcza DOM ani dziennika wysyłki. Pozostałe warianty to odtworzenia błędów znalezionych w kodzie, bez potwierdzenia ich wystąpienia w tej konkretnej rozmowie. Nie testowano zalogowanego Motif, jego rzeczywistego modelu, limitów konta ani aktywnego Studio. Kontynuacja jest ograniczoną heurystyką dla polskich i angielskich zapowiedzi; nie wymusza odpowiedzi niedostępnego serwisu i nie odtwarza brakującego wyniku. Bieżący transport Motif: `core:r14/parser:r13/provider:r14`. Instrukcja aktualizacji: `START-TUTAJ-PL.md`.

## r13 — źródło Luau, granice fragmentów i aktualność odpowiedzi

**510 testów, 510 zaliczonych, 0 nieudanych i 0 pominiętych.** Polecenie: `cd tests && npm test`, Node.js 24.19.0 na Linux x86_64. Osobno sprawdzono składnię 18 zmienionych plików runtime, zgodność ich trzech kopii oraz poprawność trzech manifestów rozszerzenia 1.24.21. Nie zmieniano natywnego EXE ani oficjalnych metadanych wydań i historycznych sum kontrolnych.

Nowy zestaw `tests/luau-source-integrity.test.cjs` zawiera 26 przypadków. Uruchomiony na plikach odczytanych z HEAD sprzed poprawki: **1 zaliczony, 25 nieudanych**; po poprawce: **26 zaliczonych**. Poszczególne warianty badają te same mechanizmy, więc liczba testów nie oznacza liczby niezależnych usterek.

| Zakres | Przypadki |
| --- | ---: |
| Fragmenty jednego bloku `<pre>` w kilku elementach `<code>`, dwa formaty × sześć serwisów, następnie odtworzenie jednego elementu | 12 |
| Znaczniki MCP jako dane Luau, blok kompletny i niekompletny, prawdziwe kolejne ramki MCP | 4 |
| Przerwa 22 sekund podczas komendy DeepSeek, format surowy i JSON | 2 |
| Starsza komenda w pamięci wobec aktualnego kompletnego lub niekompletnego źródła | 2 |
| Stop podczas oczekiwania i odrzucenie rzeczywiście uciętego JSON po limicie | 2 |
| Trzy warianty nakładającego się znacznika napisu oraz pełny transfer przez dispatcher przy granicy 18 000 znaków | 4 |

Test transferu długiego kodu używa rzeczywistych funkcji dzielenia i opakowania, walidatora oraz `runTool`. Na starym kodzie otrzymuje `arguments.code: Mismatched code delimiter; the command may be truncated`. Po poprawce oba fragmenty dochodzą do kontrolowanego mostu, a odczyt ich napisów Luau odtwarza źródło znak w znak. Nie wykonuje to programu w Roblox.

Dotychczasowe testy `get_studio_state`, `multi_edit`, niedomkniętych napisów, znaczników w danych, strumieniowania białych znaków, limitów DeepSeek i odmów nadal przechodzą. Dwa wcześniejsze testy czasu oczekiwania uwzględniają nowy limit 60 sekund dla otwartej komendy DeepSeek; nadal wymagają błędu i braku wykonania niepełnego kodu. Testy raportu odzwierciedlają nowe wersje transportu.

**Ograniczenia:** są to odtworzenia usterek znalezionych podczas analizy kodu, bez źródła odrzuconej komendy użytkownika. Nie ustalają, która z nich wystąpiła w jego rozmowie. Nie przeprowadzono testu na zalogowanym DeepSeek, w rzeczywistej przeglądarce z zainstalowanym dodatkiem ani w Roblox Studio. Nowy limit zmniejsza ryzyko przedwczesnego błędu przy przerwie w generowaniu, ale nie usuwa limitów odpowiedzi modelu ani zmian strony. Prawdziwie niepełne źródło nie jest wykonywane. Instrukcja aktualizacji i oczekiwane wersje: `START-TUTAJ-PL.md`.

## r12 — fakty z przesłanej informacji zwrotnej i dostęp do źródła

**484 testy, 484 zaliczone, 0 nieudanych i 0 pominiętych.** Zapis: `tests/regression-results-r12.txt`. Nowy zestaw `tests/transport-report.test.cjs` zawiera 17 przypadków. Pozostałe 467 testów nadal przechodzi; wcześniejszy test lokalnego statusu korzysta teraz z rzeczywistej wspólnej funkcji diagnostycznej i oczekuje rdzenia r12.

Nowy zestaw na plikach z ZIP r11 miał **2 zaliczone i 15 nieudanych przypadków**. Dwa przechodzące przypadki potwierdzają już istniejącą lokalną obsługę statusu i bezpieczne wyświetlanie kodu przez `textContent`. Nowe testy są regresjami konkretnych funkcji i testami dodanego interfejsu; ich liczba nie oznacza liczby niezależnych błędów.

### Ustalenia na podstawie zapisu

`Output of 'execute_luau': PlayerGui=true Interface=true` potwierdza wykonanie tej jednej komendy odczytującej GUI. Nie jest źródłem odrzuconego polecenia. W skopiowanym zapisie źródło zostało zastąpione etykietą karty, a później pojawił się osobny błąd parsera. Pełny kod i znaczniki tego błędu nadal nie są znane. Komunikat „Do not wrap the code in JSON” odpowiada konfiguracji sprzed r11, ale może pochodzić z historii; nie dowodzi samodzielnie aktywnej wersji.

Przesłany dopisek `VISIBLE APPROACH SUMMARY` ujawnił rzeczywistą sprzeczność w r11: `approachSummaryPolicy(true)` nadal żądał znaczników zamiast JSON. Poprawiono to źródło instrukcji, tak aby zachowywało już wybrany poprawny format. Nie zmieniano poleceń ani wyników Roblox z historii.

`plazcode_status` istniał jako handler w rozszerzeniu, a pełny tekst listy opisywał go wśród narzędzi wirtualnych. Brakowało jednak właściwego wpisu z pustym schematem argumentów w `toolList`, z którego korzystały listy skrócone i część kontekstu AI. R12 umieszcza ten wpis na początku pobranego lub zapamiętanego katalogu oraz usuwa duplikat tej samej nazwy. Lokalny handler nadal odpowiada przed weryfikacją nazw narzędzi mostu. Test rzeczywistego `runTool`, walidatora i statusu potwierdza brak wywołań mostu przy odłączonym Studio i katalogu bez statusu.

### Zmiany i sprawdzenie

| Obszar | Sprawdzone zachowanie |
| --- | --- |
| Katalog | Pobranie i pamięć; wpis statusu ze schematem `{}`; brak duplikatów; skrócona lista zawiera `plazcode_status()` |
| Show approach | Włączona opcja zachowuje literalne znaczniki lub poprawny JSON, bez przymusu zmiany formatu |
| Karta błędu | Parser przekazuje rzeczywiste `res.raw` jako treść karty, także przy ostatniej nieudanej próbie; Luau ma etykietę „incomplete/unreadable Luau” |
| Copy text | Źródło kopiowane znak w znak po kliknięciu, bez wysyłki komendy; odmowa schowka otwiera tekst do ręcznego skopiowania |
| Zmiana źródła | Równa długość dwóch różnych kodów nie pozostawia starej treści ani starego działania przycisku |
| Odbudowa karty | Źródło przetrwa ponowne utworzenie karty przez istniejący `ensureOwnedChip` |
| Lokalny raport | Ustawienia pokazują załadowane wersje i metadane błędu; raport działa niezależnie od AI i dostępu do schowka |
| SYSTEM_STATE | Nowe tagi zawierają rzeczywiste wersje oraz informację o lokalnym statusie niewymagającym obsługi Studio |

Stan wersji w tej paczce dla siedmiu badanych wariantów interfejsu: **core r12, parser r11, provider r11**. Raport z ustawień nie zawiera kodu projektu, treści rozmowy ani danych uwierzytelniających. Źródło błędu jest zachowane w karcie i kopiowane wyłącznie po działaniu użytkownika. Używa się `textContent`, więc kod zawierający ciągi podobne do HTML pozostaje tekstem. Nie dodano automatycznego eksportu źródła do logów, schowka ani sieci.

Zmieniono 9 plików runtime/stylów: `core/main.js`, `core/config.js`, `overlay.css` w trzech folderach. Parser, adaptery i EXE pozostają bez zmian. Wykonano kontrolę składni JS, zgodności kopii i integralności paczki. Nowe testy są lokalnymi testami DOM, katalogu i dispatchera; nie potwierdzają działania w aktywnym Studio ani odtworzenia nieznanego źródła odrzuconej komendy użytkownika.

Dokładna instrukcja aktualizacji i kopiowania raportu: `START-TUTAJ-PL.md`.

## r11 — literalny postęp źródła i granice protokołu

**467 testów, 467 zaliczonych, 0 nieudanych i 0 pominiętych.** Pełny zapis: `tests/regression-results-r11.txt`. Zestaw `tests/luau-boundaries.test.cjs` dodaje 57 przypadków. Pozostałe 410 testów nadal przechodzi; zmieniono oczekiwane numery wersji i tekst instrukcji w dwóch wcześniejszych testach.

Nowy zestaw uruchomiony na parserze, rdzeniu, konfiguracji i adapterach wyjętych z ZIP r10: **8/57 zaliczonych, 49 nieudanych**. Dwa przypadki dotyczą dodanej diagnostyki i ujednoliconych komunikatów; pozostałe odtwarzają zachowanie transportu. To celowo dobrane regresje, nie pomiar częstości problemów w serwisach.

| Zakres nowych testów | Liczba |
| --- | ---: |
| Granice fenced bloku, napisy i komentarze Luau, bezpieczeństwo niepełnego JSON | 11 |
| Strumień dopisujący białe znaki przez 22 sekundy: 7 adapterów × 2 formaty × 2 stany kontrolek końca | 28 |
| Faktycznie niedokończony JSON po ustaniu postępu nadal kończy się błędem | 1 |
| Motif/ChatWave/Tencent: Edit, odstępy i niedokończony surowy blok | 9 |
| Parser → rzeczywisty walidator → runTool → kontrolowany most, krótki/długi kod w obu formatach | 4 |
| Kontrola działających get_studio_state i multi_edit | 2 |
| Metadane błędu bez treści kodu oraz spójne instrukcje obu formatów | 2 |
| Razem | 57 |

### Co zmieniono

Śledzenie postępu komendy korzysta teraz z literalnego tekstu źródłowego, również gdy dopisywane są wyłącznie białe znaki. Dotyczy rdzenia oraz adapterów DeepSeek, ChatGPT (także Work), Claude i wspólnego adaptera Motif/ChatWave/Tencent. Pole `source` w odczycie adaptera zachowuje końcowe spacje i nowe linie na potrzeby licznika, a dotychczasowe pole `reply` zachowuje swój format. Kontrolki Copy, myślenie i elementy PlazCode nadal są wykluczane. Wstrzymanie karty i zmiana tożsamości odpowiedzi uwzględniają nowy licznik. Nie dodano odtwarzania komendy z treści innej tury.

Parser nie przenosi stanu niedomkniętego przykładu obiektu JSON z prozy do nowego fenced bloku. Reset nie zachodzi wewnątrz wartości tekstowej JSON: niepełna koperta zawierająca pozorne znaczniki nie staje się wykonaniem kodu. Zakończenie surowego Luau wykrywane jest poza napisami i komentarzami, w tym `[[...]]`, `[=[...]=]` i `[==[...]==]`. Niedomknięty napis ze znacznikiem wewnątrz nadal pozostaje niepełną komendą.

Motif, ChatWave i Tencent rozpoznają otwarcie według reguł parsera, w tym jawny Edit i dozwolone odstępy. Rozpoczęty, niedomknięty blok jest przekazywany do watchera, aby mógł poczekać na koniec lub zwrócić błąd; nie kończy się już bez wyniku jako zwykły tekst. Wcześniejsze testy odmów, cytatów, rozumowania i niewykonywania komend z kontrolek nadal przechodzą.

Komunikaty nie wymagają przełączania z poprawnego JSON na znaczniki. Surowy format pozostaje preferowany dla kodu, ale oba są stale akceptowane. Krótkie błędne polecenie nie dostaje automatycznie sugestii podzielenia kodu: dodatkowa sugestia dotyczy tylko niedomkniętego JSON powyżej 12 000 znaków po powtórzeniu problemu. Nie wprowadzono limitu długości komendy do parsera.

`tool.parseFailure` i `plazcode_status.last_parse_failure` raportują format, długość, domknięcie, liczbę odczytanych komend i wersje. Ten nowy zapis zawiera wyłącznie metadane, bez źródła, fragmentów rozmowy ani sekretów z kodu. Trzy części `transport_build` wynoszą `r11` na siedmiu badanych wariantach interfejsu. Zmieniono 21 plików runtime: po 7 w każdym z trzech folderów.

### Ograniczenia

Badano rzeczywiste funkcje projektu na kontrolowanym HTML, z symulowanym zegarem, sygnałami generowania i mostem. Kontrole błędów witryny są w nowych testach strumienia wyłączone, aby izolować odczyt kodu; ich wcześniejsze oddzielne testy nadal przechodzą. Nie uruchamiano kodu w aktywnym Roblox Studio ani na zalogowanych kontach użytkownika. Nie ma podstaw, aby utożsamić każdy opisany przypadek użytkownika z jedną z tych przyczyn. Testy wskazanych funkcji potwierdzają zachowanie ich pełnego tekstu aż do żądania mostu, nie dostępność danego API w docelowym kontekście Studio.

EXE, klient ChatWave API, filtry UIBlox, stronicowanie wyników i 15-sekundowy odstęp DeepSeek pozostają bez zmian. Instrukcja podmiany i potwierdzenia załadowania r11 znajduje się w `START-TUTAJ-PL.md`.

## r10 — porównanie odczytu kodu między adapterami

**410 testów, 410 zaliczonych, 0 nieudanych i 0 pominiętych.** Zapis: `tests/regression-results-r10.txt`. Nowy zestaw `tests/cross-ai-code-dom.test.cjs` zawiera 110 testów. Wszystkie 300 wcześniejszych nadal przechodzi. Sprawdzono składnię 9 zmienionych plików JS oraz zgodność ich trzech kopii.

Te same 110 testów uruchomiono na providerach wyjętych z lokalnego ZIP r9: 73 zaliczone, 37 nieudanych. Po poprawce wszystkie przechodzą. Porównywany jest kod znak w znak.

| Adapter / wariant | Nowe testy | Nieudane na r9 | Zaliczone po poprawce |
| --- | ---: | ---: | ---: |
| DeepSeek — kontrola r9 | 15 | 0 | 15 |
| ChatGPT — klasyczny czat | 17 | 6 | 17 |
| ChatGPT Work | 17 | 6 | 17 |
| Claude | 16 | 16 | 16 |
| Motif | 15 | 3 | 15 |
| ChatWave — strona | 15 | 3 | 15 |
| Tencent Hy | 15 | 3 | 15 |
| Razem | 110 | 37 | 110 |

Są to celowo wybrane przypadki kontrolowane, nie statystyka częstości błędów serwisów. Kod zawiera `Instance.new("TextLabel")`, `UDim2.fromOffset`, `Enum.TextXAlignment`, Unicode i długi napis Luau z kilkoma pustymi liniami. Drugi wariant dodaje 350 linii. Puste linie wewnątrz napisu mają znaczenie dla jego wartości.

### Przyczyny i zmiany

ChatGPT i ChatGPT Work już odtwarzały linie CodeMirror i korzystały z pełnego dokumentu publikowanego przez istniejący skrypt pomocniczy. Odczyt nie wykluczał jednak wszystkich kontrolek Copy; przycisk po źródle mógł dokleić tekst do znacznika końca. Gubiona była również liczba pustych akapitów. Poprawiono oba przypadki, zachowując wcześniejszy odczyt pełnego dokumentu CodeMirror.

Claude dodatkowo skracało sekwencję co najmniej trzech nowych linii do dwóch, także wewnątrz źródła `<pre><code>`. Usunięto tę normalizację. Właściwe źródło ma pierwszeństwo przed kontrolkami, a puste akapity i wiersze są zachowane.

Motif, ChatWave i Tencent poprawnie czytały zwykłe źródło, lecz gubiły puste akapity. Wybór pierwszego `code` wewnątrz `pre` mógł wskazać element kontrolki. Wybierany jest teraz właściwy element poza kontrolkami. Wcześniejsze testy odmów, rozumowania i cytatów nadal przechodzą.

JSON w przycisku Copy jest syntetycznym testem izolacji interfejsu, nie stwierdzeniem, że któryś serwis faktycznie umieszcza tam taką komendę. Potwierdza, że treść kontrolki nie może zastąpić właściwej komendy. Osobne przypadki ze zwykłym napisem Copy odtwarzają doklejenie stopki do kodu.

### Zakres i granice

Każdy adapter testowano z krótkim i długim kodem w zwykłym bloku, z nagłówkiem języka/Copy, stopką Copy, opisem przed/po, `<br>` i osobnymi akapitami z linkiem `Instance.new`. Sprawdzono również JSON z kodem, własne panele PlazCode oraz zmianę renderowania tej samej odpowiedzi z ukrytym oryginalnym blokiem.

W ChatGPT i Work porównano wiersze CodeMirror z pełnym dokumentem, gdy DOM zawiera jedynie fragment. Nie zmieniano helpera `chatgpt-cm.js`. U Claude test dotyczy istniejącego odczytu wierszy; nie zakłada działania helpera ChatGPT na tej stronie. Klient ChatWave API nie czyta HTML i nadal przechodzi wcześniejsze testy.

To testy rzeczywistego kodu adapterów na kontrolowanym HTML. Nie wykonywano nowych prób na aktywnych kontach ani kodu w rzeczywistym Studio. Test ChatGPT Work nie oznacza uruchomienia rozszerzenia wewnątrz bieżącej rozmowy Codex. Pozostałe marki obsługiwane w kodzie, np. Gemini/Kimi/Qwen, nie dostały w r10 nowych testów swojego DOM; ta tabela nie potwierdza ich działania na żywo.

Zmieniono `providers/chatgpt.js`, `providers/claude.js` i `providers/webchats.js` w trzech folderach. Ich `transport_build.provider` wynosi `r10`; rdzeń i parser pozostają `r9`. DeepSeek pozostaje r9. Dotychczasowe poprawki debuggera, widoczności Motif i limitów DeepSeek nadal przechodzą testy. Instrukcja aktualizacji znajduje się w `START-TUTAJ-PL.md`.

## r9 — odczyt kodu z HTML DeepSeek i pochodzenie logów

**300 testów, 300 zaliczonych, 0 nieudanych i 0 pominiętych.** Pełny zapis: `tests/regression-results-r9.txt`. 35 nowych testów znajduje się w `tests/deepseek-code-dom.test.cjs`. Wszystkie 265 testów r8 nadal przechodzi. Dziewięć zmienionych plików JS ma poprawną składnię i identyczne odpowiedniki w trzech folderach.

### Odtworzenie odrzucania poprawnego kodu

Nowy krótki kod testowy zawiera dokładnie `Instance.new("TextLabel")`, `UDim2.fromOffset(240, 40)`, `Enum.TextXAlignment.Right`, apostrofy i kropki w nazwach właściwości. Długi wariant dodaje ponad 400 linii z tabelami, cudzysłowami i Unicode. Każdy kod jest przekazywany do rzeczywistego adaptera DeepSeek i parsera w następujących wariantach DOM: zwykły `<pre><code>`, nagłówek języka i Copy, akapit przed/po bloku, osobne akapity kodu, `<br>`, wiersze z numeracją oraz automatycznie podlinkowane `Instance.new`.

W pierwszym zestawie 28 testów, uruchomionym przed zmianą, 21 nie przechodziło. Sama treść krótkiego kodu była poprawna. Wariant z czystym `<pre><code>` przechodził, a ten sam kod z nagłówkiem `luaCopy`, poprzedzającym akapitem lub podziałem na akapity był odrzucany albo tracił nowe linie. Przyczyną było użycie `textContent` całego widżetu zamiast odczytu źródła i granic DOM. R8 zaostrzyło rozpoznawanie znaczników do początku wiersza, lecz testy nie obejmowały tych wariantów interfejsu DeepSeek.

Nowy odczyt pomija elementy interfejsu, korzysta z właściwego źródła `<code>`, zachowuje wiersze i nie duplikuje zagnieżdżonych kontenerów markdown. Oryginalny kod ukryty klasą maskowania jest nadal dostępny do odczytu. Sprawdzono identyczność wyniku parsowania przed i po podświetleniu, dołożeniu Copy, panelu „Worked for…” i chipu narzędzia. Tekst własnego interfejsu nie staje się komendą. Puste linie, wcięcia i zwykłe słowa `json`, `lua`, `Copy` w kodzie pozostają nietknięte. Dla zwykłego źródła ze spanami tokenów odczyt korzysta z literalnego tekstu bez przebudowy linii.

Osobno odtworzono błąd wspólnego parsera: pierwsza wzmianka o znaczniku w prozie przesłaniała późniejszy poprawny blok. Parser szuka teraz rzeczywistego otwarcia wiersza poza otwartą kopertą JSON; zakończony przykład starego formatu przed właściwym blokiem nie blokuje odczytu. Sama opisowa wzmianka o znacznikach nie jest rozpoznawana jako próba komendy. Niedokończony JSON zawierający pozorne znaczniki nadal nie daje wykonywalnego bloku.

Rzeczywisty watcher odpowiedzi zwraca kompletną komendę z HTML zawierającego opis i Copy. Drugi test watchera wstrzymuje strumień na dziewięć sekund przy niedomkniętym kodzie i zmienia kontenery po wznowieniu; rezultat zawiera cały zamierzony kod. To nie jest wykonanie w Studio. Nie stwierdzono limitu kilkunastu linii ani błędu samych cudzysłowów, nawiasów czy kropek w poprawnie odczytanym źródle. Bez HTML lub pełnej wadliwej wiadomości użytkownika nie można zagwarantować, że każdy jego przypadek ma tę samą przyczynę.

### Formaty i diagnostyka aktualizacji

Krótki JSON z kodem zawierającym wskazane symbole jest poprawnie dekodowany, a surowy fenced blok `###LUA###` daje identyczne `arguments.code`, bez koperty i ręcznego escapowania w treści czatu. Normalna serializacja żądania do mostu nadal używa formatu protokołu mostu; nie zmienia to wartości kodu po odkodowaniu. Nie dodano zamieniania `Instance.new`, nazw właściwości, cudzysłowów ani nawiasów. Link HTML jest czytany jako jego widoczny tekst, a nie adres URL.

`plazcode_status` pokazuje teraz `transport_build` z wersją rdzenia, parsera i adaptera. W DeepSeek po pełnym wczytaniu r9 wszystkie trzy wartości wynoszą `r9`; stary parser bez oznaczenia daje `unknown`, zamiast fałszywego potwierdzenia aktualizacji. Sprawdzono rzeczywistą gałąź statusu w obu przypadkach. Beacon adaptera to `2026-10-22_r9-source`. W innych, niezmienionych adapterach pole wersji provider może pozostać `unknown`.

### Dokładny komunikat UIBlox

Testy wykorzystują „UIBlox LUMBERYAK INTERNAL: Too many arguments given for format string”. Wpis typu `MessageWarning` nie trafia do automatycznej naprawy. Dodatkowo wykryto w r8 błąd ustalania pochodzenia: późniejsza ramka `Workspace.Panel` albo ścieżka cytowana w treści mogła przeważyć nad wiadomością źródłową UIBlox/CorePackages.

R9 rozpoznaje jawne źródło na początku komunikatu i pierwszą ramkę stosu. Wewnętrzny błąd nie staje się błędem projektu tylko dlatego, że projekt go wywołał. Rzeczywisty błąd `ServerScriptService.Panel:25` z tą samą treścią o formatowaniu napisu nadal jest przekazywany do analizy. Pełne logi nie są usuwane; zmiana dotyczy kwalifikowania do automatycznej naprawy. Dotychczasowe testy pełnego watchera playtestu z r8 również nadal przechodzą.

### Granice weryfikacji

Warianty HTML są kontrolowanym odtworzeniem, nie zapisem aktualnej strony użytkownika. W zdalnej przeglądarce DeepSeek pokazało formularz logowania; nie uruchamiano logowania i nie odczytano zalogowanego DOM ani rozmowy użytkownika. Nie wykonano r9 z rzeczywistym Studio, Windows ani Firefox. Wszystkie wcześniejsze testy ChatGPT, Claude, Motif, ChatWave, Tencent, klienta API, limitów DeepSeek i pełnych wyników nadal przechodzą. Minimalny odstęp DeepSeek 15 sekund i brak automatycznych ponowień po limicie pozostają bez zmian. Pliku EXE nie zmieniono.

## r8 — przegląd transportu i automatycznych alarmów

**265 testów, 265 zaliczonych, 0 nieudanych i 0 pominiętych.** Pełny zapis: `tests/regression-results-r8.txt`. 68 nowych testów znajduje się w `tests/transport-regression.test.cjs`. Pozostałe 197 testów z r7 nadal przechodzi. Sprawdzono składnię 12 zmienionych plików JS, zgodność trzech kopii oraz istnienie zasobów wskazanych w manifestach.

### Zakres stron

| Integracja | Co sprawdzono lokalnie w r8 |
| --- | --- |
| DeepSeek | Rzeczywisty adapter DOM → parser: długi JSON, `command` po `params`, surowy Luau, wszystkie znaki i linie. Odtworzenie pełnego wyniku przy włączonych i wyłączonych limitach, budżet strony 32 000 znaków, odrzucenie zbyt dużej wiadomości przed zmianą szkicu, minimalny odstęp automatycznych wysyłek. |
| ChatGPT | Ten sam długi kod w trzech formatach przez rzeczywisty odczyt adaptera, pełne odtworzenie wyników i brak opóźnienia DeepSeek. Dotychczasowe testy wysyłania i zakończenia odpowiedzi nadal przechodzą; pliku adaptera nie zmieniano. |
| Claude | Ten sam odczyt kodu i stronicowanie, zachowanie istniejącego budżetu transportu, brak opóźnienia DeepSeek. Dotychczasowe testy kontrolowanego edytora i dostarczenia całych stron nadal przechodzą; pliku adaptera nie zmieniano. |
| Motif | Te same trzy formaty długiego kodu, znaki i pełne wyniki, brak opóźnienia DeepSeek. Pięć testów widoczności odpowiedzi z r7 nadal przechodzi. |
| ChatWave — strona | Te same trzy formaty i pełne wyniki w istniejącym adapterze, brak opóźnienia DeepSeek. Ograniczenia uwierzytelniania i decyzje modelu opisane w r6 nadal obowiązują. |
| Tencent Hy | Te same trzy formaty i pełne wyniki, brak opóźnienia DeepSeek. Dotychczasowe testy rzeczywistego zapisanego HTML JSON/Luau nadal przechodzą. |
| ChatWave API | Długi kod Luau jest zachowany w natywnych argumentach JSON narzędzia oraz w wynikach. Wszystkie 40 testów klienta i proxy z r6 nadal przechodzi. Prawdziwe wywołanie API z kluczem użytkownika pozostaje niezweryfikowane. |

Wszystkie 15 grup adapterów zadeklarowanych w każdym z trzech manifestów ładują wspólny `core/parser.js`; poprawka parsera obejmuje także te grupy. Powyższa tabela rozróżnia konkretne testy DOM wykonane dla serwisów z tej rozmowy. Pozostałych serwisów nie testowano na żywo ani na nowych modelach ich DOM.

### Ustalone przyczyny i zachowanie

Przed zmianą kontrolowane przypadki odtworzyły pięć usterek parsera: brak odczytu poprawnego `multi_edit` z `command` po dwunastu obiektach edycji; odczyt JSON z wnętrza surowego Luau jako komendy; zmiana kodu zawierającego tekst znaczników; odczyt nadal zakodowanych znaków z JSON wewnątrz koperty MCP; oraz wykonanie zastępczego bloku znalezionego w niekompletnym JSON. Zastąpiono wyszukiwanie sześciu poprzedzających nawiasów skanowaniem aktywnych obiektów z uwzględnieniem napisów i escape'ów. Dodatkowe testy chronią kod po niezakończonym cytacie w zwykłej prozie, dosłowny znacznik końca wewnątrz kodu, wcięcia i początkowy identyfikator `json`.

Nie potwierdzono hipotezy o limicie kilkunastu linii ani ogólnego błędu obsługi apostrofów/cudzysłowów w poprawnym JSON. Ponad 320 linii kodu jest odczytywanych znak w znak przez sześć rzeczywistych adapterów w jsdom. Brak pełnego tekstu wadliwej odpowiedzi użytkownika nie pozwala przypisać wszystkich jego objawów do jednej z odtworzonych usterek.

Rzeczywisty watcher odpowiedzi sprawdzono przy dziewięciosekundowej przerwie w niedomkniętym JSON z wyłączonym sygnałem generowania. Teraz czeka na resztę i odczytuje kompletny kod; przed zmianą mógł zwrócić błąd po krótszej przerwie. Rzeczywiście niekompletny blok po upływie osobnego okna bez zmian kończy się błędem i nie jest wykonywany. Okno nie oznacza gwarancji obsługi dowolnie długiej przerwy bez sygnałów strony.

`###LUA###` już było standardowym formatem `execute_luau`. W r8 pierwszeństwo ma dosłowna treść rzeczywistego bloku, a nie przykłady komend z jego środka. Poprawne koperty JSON nadal są dekodowane; parser nie usuwa znaków specjalnych z kodu. Komunikat błędu `execute_luau` prosi o pojedynczy fenced blok Luau, bez koperty JSON.

### Debugger i wyniki

W Auto Debug zachowano typ wpisu `MessageError`/`MessageWarning` oraz powiązany stos. Ostrzeżenie nie jest już automatycznym celem naprawy. Rozpoznane logi CorePackages/CoreGui/BuiltInPlugins i wzorzec UIBlox + LUMBERYAK INTERNAL są traktowane jako wewnętrzne, jeżeli blok nie wskazuje jednocześnie skryptu projektu. Rzeczywisty stos skryptu projektu ma pierwszeństwo przed nazwą pakietu w treści błędu. Błąd o nieznanym pochodzeniu pozostaje do ręcznej oceny. Dokumentacja typów wpisów: [LogService — Roblox Creator Hub](https://create.roblox.com/docs/reference/engine/classes/LogService).

Sprawdzono rzeczywistą funkcję Auto Debug oraz pełny watcher playtestu z kontrolowanymi odpowiedziami mostu. Log wewnętrzny i ostrzeżenie nie zatrzymują Play i nie wysyłają prośby o naprawę. Błąd `ServerScriptService.Panel:42` nadal zatrzymuje Play przy włączonej opcji i trafia do AI. Późniejszy log wewnętrzny nie zasłania wcześniejszego błędu projektu. Nie odczytywano logów z rzeczywistego Studio użytkownika; fragment UIBlox w testach jest reprezentacją opisu, nie pełnym logiem dostarczonym przez użytkownika.

Wyniki `list_commands`/`get_console_output` dłuższe niż budżet wiadomości są zachowywane w pamięci i udostępniane przez `plazcode_result_read`; jest to zamierzone stronicowanie. Dla wszystkich siedmiu ścieżek z tabeli odtworzono pełny długi wynik znak w znak, również z wyłączonymi limitami ustawień. Strony mieszczą się w budżecie wraz z nagłówkiem. Nie dodawano automatycznego ponawiania komendy ani samoczynnego wysyłania wszystkich stron. Bufor należy do bieżącej karty i kontekstu rozmowy/silnika; przeładowanie go usuwa, a stare wyniki mogą zostać zwolnione. Jeśli źródłowy most sam zwróci niepełny wynik, rozszerzenie nie odzyska brakującej treści.

Oddzielny test rzeczywistej gałęzi `plazcode_debug` potwierdza zachowanie wyniku powyżej dawnych ograniczeń 240/4000 znaków. Polecenie opisuje jawnie zakres ostatnich 60 wpisów; nie udaje kompletnego archiwum konsoli.

### Tempo DeepSeek i ograniczenia weryfikacji

Zrzut użytkownika pokazuje polski limit wiadomości po wynikach narzędzi. r5 rozpoznawało ten stan i zatrzymywało pętlę, ale domyślna opcjonalna przerwa wynosiła zero. r8 dodaje providerowy odstęp minimum 15 sekund, niezależny od ustawienia zera. Jest respektowany w rzeczywistym wspólnym kodzie wysyłania, w tym dla startu, korekt formatu i kolejnych stron wyników. Większy odstęp użytkownika ma pierwszeństwo, Stop przerywa czekanie. Kotwica jest aktualizowana po zakończeniu wysyłki i przy wiadomości natywnego interfejsu. Dla pozostałych adapterów testy potwierdzają brak dodania tego minimum.

15 sekund jest lokalnym ustawieniem ostrożnego tempa, nie ustalonym limitem DeepSeek. Limity konta, obciążenie i inne zasady serwisu nadal mogą blokować wysyłanie. Widoczny limit nadal zatrzymuje agenta bez automatycznego wznowienia i bez powtarzania wykonanych komend.

Cała nowa weryfikacja r8 to kontrolowane testy Node/jsdom, zegara, klienta API i odpowiedzi mostu. Nie wykonywano nowych prób na rzeczywistych kontach, nie zainstalowano dodatku w przeglądarce użytkownika i nie sprawdzono rzeczywistego Windows/Studio. Plik EXE pozostaje identyczny. Historyczne próby na stronach opisano poniżej.

## r7 — niewidoczna odpowiedź Motif

**197 testów, 197 zaliczonych, 0 nieudanych i 0 pominiętych.** Pełny zapis: `tests/regression-results-r7.txt`. Pięć nowych testów znajduje się w `tests/motif-layout.test.cjs`; pozostałe 192 testy obejmują dotychczasowe integracje i klienta ChatWave API.

Na zrzucie użytkownika widoczne są podsumowania „Worked for…” PlazCode i brak treści Motif 3 High. Na aktualnej stronie sprawdzono strukturę DOM: `document-model-answer-content` jest elastycznym dzieckiem poziomego wiersza, a jego przodek `document-message-list-wrapper` jest pionową listą. Dotychczasowy domyślny montaż renderera dodawał panel `.rs-chat-activity` o szerokości 100% bezpośrednio przed kontenerem odpowiedzi w tym samym poziomym wierszu. Panel zabierał miejsce przeznaczone na treść odpowiedzi.

Adapter Motif używa teraz istniejącego punktu rozszerzenia `mountActivitySummary`. Wstawia panel przed całym wierszem jako osobne dziecko pionowej listy. Funkcja `place` śledzi zmianę rodzica odpowiedzi, a `dispose` usuwa wyłącznie panel. Nierozpoznany układ nie dostaje panelu wewnątrz wiadomości. Pozostałe serwisy zachowują dotychczasowy montaż.

Pięć testów uruchamia rzeczywisty adapter i kod `core/activity.js`; pierwsze trzy korzystają również z rzeczywistej konfiguracji renderera wyodrębnionej z `core/main.js`. Sprawdzono położenie panelu, nienaruszoną treść odpowiedzi po zwijaniu i rozwijaniu, brak wstrzyknięcia do nieznanego układu, przeniesienie natywnego wiersza, usunięcie panelu oraz kolejność dwóch odpowiedzi. Wszystkie pięć testów nie przechodziło przed poprawką. Są to testy struktury DOM w jsdom, które nie oblicza rzeczywistych wymiarów układu CSS.

Osobno na prawdziwej stronie Motif wybrano poziom High, wysłano krótką syntetyczną prośbę i otrzymano widoczne „Odpowiedź Motif jest widoczna.”. Test wykonano bez zainstalowanego PlazCode. Potwierdza odpowiedź samego serwisu i strukturę strony, ale nie zastępuje testu rozszerzenia w przeglądarce użytkownika. Nie wykonano pełnej pętli ze Studio ani testu Windows/Firefox. Zmiana r7 obejmuje tylko `providers/webchats.js` w trzech kopiach; nie zmienia pliku EXE, klienta API, parsera komend ani adaptera ChatGPT.

## r6 — ChatWave API

**192 testy, 192 zaliczone, 0 nieudanych i 0 pominiętych.** Pełny zapis: `tests/regression-results-r6.txt`. 40 nowych testów znajdują się w `tests/chatwave-api.test.cjs`.

Na prawdziwej stronie odczytano ChatWave → Settings → Docs. Dokumentacja pokazuje bazę `https://chat.thewave.cv/v1`, endpoint `chat/completions`, listę modeli i nagłówek Bearer z kluczem `cw-...`. Nie odczytywano ani nie tworzono klucza użytkownika, nie logowano się do zewnętrznego dostawcy i nie wykonywano autoryzowanego wywołania modelu. Sam opis zgodności OpenAI nie potwierdza obsługi natywnych narzędzi przez wybrany model/konto.

Dodany klient ma dwa natywne narzędzia: odczyt katalogu i router do komend istniejącego mostu. Tylko poprawne `tool_calls` z API uzyskują lokalny znacznik pozwalający wspólnej pętli odczytać komendę. Zwykła treść modelu pozostaje nieaktywna. Każdy wynik wraca w roli `tool` z identyfikatorem konkretnego wywołania. Wywołania API nie są ponawiane po niepewnym wyniku.

Sprawdzono rzeczywisty kod klienta, prywatnego proxy, adaptera, `startSession`, `waitForResponse` i `agentLoop`. Test pełnej pętli obejmuje natywny start → symulowany odczyt mostu → potwierdzenie → zadanie użytkownika → natywne `execute_luau` → istniejący `PlazCodeToolGuard` → symulowane wykonanie → właściwie powiązany wynik API → odpowiedź końcową. Oddzielny test pętli zatrzymuje niepoprawne argumenty przed wykonaniem. Uprawnienia do rzeczywistych operacji Studio nadal podlegają istniejącemu kodowi `runTool`; tej ścieżki nie wykonano z rzeczywistym Studio.

Pozostałe przypadki: odmowa z polem `refusal`, zwykły JSON udający komendę, wiele komend, nieznana komenda, ucięte argumenty, brak i ponowne użycie identyfikatora, niewłaściwa pierwsza komenda, zachowanie pełnego długiego wyniku, odmowa potraktowania zwykłej wiadomości użytkownika jako wyniku narzędzia, brak fałszywej gotowości przy błędzie mostu, brak tekstowego fallbacku po błędzie API i ignorowanie odpowiedzi po Stop.

Proxy odrzuca żądania ze skryptu treści witryny. Akceptuje wyłącznie własną kartę rozszerzenia i wysyła klucz tylko do stałego hosta ChatWave, z wyłączonymi przekierowaniami i bez ciasteczek witryny. Klucz jest przechowywany w pamięci karty, a nie w historii, promptach, komunikacji z mostem, plikach czy magazynie rozszerzenia. Testy HTTP 400/401/403/429/500 i błędu sieci potwierdzają brak ponowień i brak wypisywania treści odpowiedzi HTTP lub szczegółów wyjątku mogących zawierać sekret. Zatrzymanie żądania jest powiązane z kartą, która je rozpoczęła. Treść HTML modelu jest wyświetlana jako tekst. Obsługa SSE składa fragmenty argumentów i Unicode, pomija osobne pola rozumowania i wymaga zakończenia strumienia oraz sygnału końca odpowiedzi. Ucięty strumień nie daje wykonalnej komendy. W czasie żądania API działa ograniczony do jego czasu heartbeat, usuwany po zakończeniu; pozwala obsłużyć wolne odpowiedzi w workerze MV3 bez trwałego zapisywania klucza.

**Ograniczenie:** API i model w testach są symulowane; nie potwierdzono `tool_calls` na prawdziwym koncie. Formularz lokalnej karty rozszerzenia pozwala użytkownikowi wykonać ten brakujący test bez wysyłania klucza w rozmowie. Nie testowano na żywo Windows ani Firefox. W r6 nie zmieniano uprawnień hostów ani pliku EXE.

## Poprzednia weryfikacja r5

Wynik r5: **152 testy, 152 zaliczone, 0 nieudanych i 0 pominiętych**. Pełny zapis: `tests/regression-results-r5.txt`. Środowisko: Node.js i jsdom 26.1.0, Linux.

## r5 — zgłoszenie DeepSeek

Użytkownik sprostował, że ostatnie zgłoszenie dotyczy DeepSeek, a ChatGPT działa poprawnie. Adapter ChatGPT jest zgodny bajt w bajt z r4. Nowe testy są w `tests/deepseek-limits.test.cjs`.

29 nowych testów obejmuje polski komunikat „Zbyt częste wiadomości. Spróbuj ponownie później”, angielskie odpowiedniki, natywny błąd poza obszarem markdown, pusty edytor i aktywny przycisk, zachowanie szkicu, brak fałszywego limitu od treści użytkownika/modelu/kodu/rozumowania, dawnych błędów i ukrytych elementów. Sprawdzono zwykłe wysłanie bez limitu.

Rzeczywisty kod wysyłania zatrzymuje się bez zapisu, jeśli limit już jest widoczny, oraz po jednym kliknięciu, gdy limit pojawi się dopiero po wysłaniu. Rzeczywisty watcher zwraca limit przed obsłużeniem zapamiętanej komendy. Rzeczywista pętla agenta zatrzymuje się także wtedy, gdy limit pojawi się dopiero po parsowaniu komendy; w tych testach nic nie jest dekorowane jako wykonane ani wysyłane do mostu. Pole wpisywania jest odblokowane, a automatyczne wznowienie zablokowane. Obsługa wyniku startu zachowuje komunikat limitu.

Sprawdzono identyfikację odpowiedzi przy dodatkowym kontenerze, późnym `data-message-id` i wymianie elementu tego samego stabilnego wiersza. Zmiana wiersza, rozmowy, poprzedniej wiadomości lub generacji sesji nadal nie przechodzi weryfikacji. Niepotwierdzona odpowiedź zatrzymuje pętlę i blokuje automatyczny powrót watchdoga do tej samej komendy. Zwykły toast zajętego serwera pozostaje oddzielnym stanem; cytaty w modelu i ukryte toasty nie uruchamiają jego ponowień.

Są to kontrolowane testy DOM i odpowiedzi/mostu, oparte na komunikacie widocznym na zrzucie i istniejącej obsłudze DeepSeek. Nie odczytano aktualnego DOM rozmowy użytkownika i nie potwierdzono jej konkretnej przyczyny ostrzeżenia o tożsamości odpowiedzi. Nie wykonano testu na żywo z DeepSeek ani lokalnym Roblox Studio. Nie obchodzi to limitów serwisu; po ich ustąpieniu trzeba sprawdzić stan projektu przed kontynuacją.

## Poprzednia weryfikacja r4

Wynik r4: 123 testy, 123 zaliczone, 0 nieudanych, 0 pominiętych. Środowisko: Node.js i jsdom 26.1.0, Linux. Modele DOM odtwarzają obserwowane kontrolki Motif i ChatWave oraz zalogowany interfejs Tencent. Dwa testy odczytu Tencent wykorzystują zapisany rzeczywisty HTML jego odpowiedzi na syntetyczne wiadomości testowe (JSON i Luau).

## Nowe zrzuty: odmowa jako cytat komendy i błąd serwisu

Odtworzono odmowę zawierającą inline JSON `list_commands`, odmowę `plazcode_result_read`, cytaty HTML, przykłady w kodzie oraz błąd „Unable to reach ChatWave right now.”. Rzeczywisty `startSession` nie wykonuje cytatu w odmowie, nie wysyła automatycznej korekty po jednoznacznej odmowie, nie uznaje startu za zakończony i zwalnia pole wpisywania. Wczesny błąd serwisu nie czeka na pustą odpowiedź modelu.

Rzeczywisty `waitForResponse` ignoruje dawną komendę z pamięci podręcznej, gdy bieżący tekst jest odmową. Prawdziwy blok komendy nadal przechodzi przez ten sam odczyt i parser. Osobno sprawdzono, że kod polecenia zawierający zwykły napis „I cannot call tools” nie staje się przez to odmową, a kod programistyczny z przykładowym JSON nie uruchamia narzędzia. Zachowano odczyt rzeczywistego JSON i Luau Tencent przez zmieniony parser.

Przywrócenie sesji wymaga widocznego potwierdzenia gotowości po odpowiedniej części startu i zapisanej sesji; same dawne znaczniki nie wystarczają. Ścieżki odczytu odpowiedzi, startu, wznowienia i dekorowania komend używają tego samego filtrowania dla nowych adapterów. Pozostali dostawcy zachowują poprzedni parser.

To testy automatyczne z kontrolowanymi odpowiedziami i symulowanym mostem. Nie potwierdzają, że model wybrany w serwisie zaakceptuje protokół. Zrzuty z etapu r4 pokazują brak potwierdzonego połączenia, a nie dowód działania z rzeczywistym Studio. Pełny zapis tamtego etapu: `tests/regression-results-r4.txt`.

## Błędy startu zgłoszone na zrzutach

Zrzuty użytkownika pokazują limit Motif „under 50000 characters” i odrzucenie wiadomości ChatWave powyżej 16 000 znaków. Przyczynę odtworzono w rzeczywistych funkcjach `systemPrompt` i `startSession` z `core/main.js`, z rzeczywistymi bibliotekami promptu, ustawieniem Ultra i adapterem DOM. W r2 pierwsza wiadomość nadal zawierała pełny prompt. `maxChars` uruchamiało tylko próbę skrócenia części bazowej; polityki, Ultra i inne instrukcje dodawano później.

Przed zmianą nowe testy startu odtwarzały te błędy. Po zmianie Motif i ChatWave używają krótkiej pierwszej wiadomości, a całość kontekstu jest dodawana po odpowiedzi na list_commands i dzielona na potwierdzane części. Testy sprawdzają pełną rekonstrukcję instrukcji wraz z pamięcią i dużymi preferencjami użytkownika, bez obcinania.

Przetestowano Roblox i AgentScript z Ultra, Start Agent i Restart Agent w istniejącej rozmowie. Każda faktycznie przekazana do adaptera wiadomość mieści się w limicie serwisu. Brak potwierdzenia części kontekstu nie daje fałszywego stanu gotowości, nie ponawia wiadomości i odblokowuje pole wpisywania. Kontrolowany most udostępnia referencję 400 poleceń; podczas startu wykonywane jest wyłącznie list_commands. Odpowiedzi modelu i mostu są symulowane — nie jest to test na Windows z rzeczywistym Studio.

Motif ma zabezpieczenie poniżej 50 000 znaków przed zapisem szkicu i rozpoznawanie jego komunikatu długości w regionie statusu. Przy kontroli długości obowiązuje mniejszy z limitów serwera i natywnego pola formularza. Pełny zapis wyników: `tests/regression-results-r3.txt`.

## Zakres automatyczny

84 testy nowych adapterów i startu obejmują rozpoznawanie pól i ról, kompletne wiadomości wielowierszowe, Unicode, odczyt JSON, zachowanie szkiców, porównywanie wersji szkiców, Stop podczas wpisywania, równoczesne próby wysyłania, brak podwójnego kliknięcia przy niepewnym wyniku, brak fałszywego potwierdzenia po wyczyszczeniu pola, zmianę czatu podczas wysyłania, ciągłość identyfikatora po pierwszej wiadomości i zapisaniu adresu, długie przerwy w generowaniu, blokadę logowania, limity Motif i ChatWave, obsługę błędów uwierzytelniania, parser PlazCode oraz powyższe przypadki pełnego startu i odmów. Sprawdzono konfigurację skryptów, uprawnienia trzech konkretnych hostów i zachowanie skryptów pomocniczych Firefox.

Testy Tencent uwzględniają rzeczywisty przycisk Send/Stop ze zmiennym identyfikatorem SVG, komendy wewnątrz panelu rozumowania, wizualne numery wierszy, nagłówki kodu oraz dwuetapowe przejście z pustego czatu do zapisanego adresu. Odczytane JSON i Luau są następnie przekazywane do niezmodyfikowanego parsera PlazCode; tekst kodu zachowuje wcięcia i Unicode.

Długą referencję i instrukcje startowe Motif i ChatWave podzielono na potwierdzane części. Test z katalogiem większym niż 70 000 znaków potwierdza pełną rekonstrukcję bez obcinania, a oddzielny test sprawdza granicę dzielenia znaków Unicode.

39 istniejących testów Claude i ChatGPT z przesłanej paczki nadal przechodzi. Ich plików providerów nie zmieniono.

Dodatkowo: `node --check` dla 12 zmienionych plików JS oraz istnienie wszystkich skryptów i arkuszy stylów wskazanych przez konfiguracje root/Chromium/Firefox.

## Próby na rzeczywistych stronach

- Motif: wysłano `Reply exactly: PLAZCODE_TEST_OK`, otrzymano `PLAZCODE_TEST_OK`.
- Motif: wysłano prośbę o blok JSON z `{"command":"list_commands","params":{}}`, otrzymano poprawny blok. W przeglądarce testowej nie wykonywano tej komendy w Studio.
- Tencent: po dokończeniu logowania przez użytkownika otrzymano `PLAZCODE_TEST_OK`, prawidłowy blok JSON `list_commands` oraz siedmiowierszowy blok Luau z `Zażółć gęślą 🦊` i dwuspacjowym wcięciem. Rozpoznano rzeczywiste kontenery `.agent-chat__list__item--human`, `.agent-chat__list__item--ai` oraz końcowy tekst w `.hyc-content-md`.
- Tencent: natywny Stop podczas generowania zakończył próbę stanem `Generation paused.` i powrotem przycisku do Send. Rozpoczęcie nowego czatu wyzerowało liczbę wiadomości i wyświetliło `New chat started`.
- ChatWave: przycisk poprawnie zmienił stan z Voice input na Send message i Stop response. Pojawiła się wiadomość użytkownika oraz błąd `Not authenticated — log in with Discord, then retry.`. Wymagane zalogowanie przed dalszą weryfikacją.
- ChatWave: dalszy etap logowania przez GitHub zatrzymała automatyczna kontrola wymagająca wyraźnego potwierdzenia przejścia do zewnętrznego dostawcy logowania. Końcowego stanu uwierzytelnienia nie odczytywano.

Próby powyżej sprawdzają działanie stron. Adaptery rozszerzenia uruchamiano w testach DOM; nie wstrzykiwano rozszerzenia do przeglądarki testowej. Nie wykonano pełnej pętli agent → lokalny most → Roblox Studio → czat. Nie sprawdzono środowiska Windows, natywnego okna PlazCode, Firefox ani przesyłania załączników na żywo.

## Odtworzenie testów

Wymagane Node.js i npm. Z katalogu PlazCode:

```sh
npm --prefix tests ci --ignore-scripts
npm --prefix tests test
```

Zależność jsdom jest używana tylko przez testy, nie przez rozszerzenie. Pakiet zawiera plik blokady wersji zależności. Przesłany plik EXE zachowuje SHA-256 `05c64807f163835c424ca61455d5f27110e32e6b83969197555b20e6d9d203b6`.
