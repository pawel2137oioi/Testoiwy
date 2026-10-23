# Raport weryfikacji — 2026-10-24 (Europe/Warsaw)

## r32 — start przekraczający dziesięć minut i cztery widoczne tury

**941/941 testów Node**, bez błędów i pominięć (`npm test --prefix tests`, Node v24.19.0, Linux). Dodano 13 przypadków do istniejącego webchats.test.cjs. Uruchamiają rzeczywisty startSession, czytnik odpowiedzi i watchdog z kontrolowanym zegarem. R31 odtwarza dwa niezależne przerwania: Start got stuck mimo kolejnych poprawnych odpowiedzi po 160 sekund oraz chat changed after sending po przycięciu listy do czterech tur. R32 przechodzi oba pełne starty, zachowując wszystkie części kontekstu.

Przypadki ujemne potwierdzają limity braku postępu przy busy=false i busy=true, twardy limit jednego kroku mimo zmieniającego się tekstu, Stop po czwartej części bez piątej wysyłki oraz odrzucenie starego węzła, starej odpowiedzi ponownie zamontowanej przed echem, obcej wiadomości użytkownika, innego czatu, Stop i poprzedniego obiektu wysłania. Pełne echo oraz nowa odpowiedź po nim zachowują powiązanie po remoncie. Istniejący test tożsamości uaktualniono świadomie: pusty widok pod tym samym zapisanym adresem nie oznacza nowej rozmowy; przejście do nowego adresu nadal ją zmienia.

**20/20 scenariuszy pełnego interfejsu Chromium** (`node tests/browser/webchats-startup.cjs`). Obejmują wszystkie poprzednie warianty Copilot i Arcee, odmowy, raport błędu, brak pełnego źródła oraz nowe microsoft-windowed i microsoft-slow-windowed. Nowe warianty usuwają starsze elementy, nie nadają ID wiadomości i zachowują maksymalnie cztery wpisy każdej roli. Wysyłają co najmniej dziesięć części, odbierają je po kolei dokładnie raz i przechodzą do natywnego pytania z jednym get_studio_state oraz wynikiem. Wariant slow przesuwa Date.now o 160000 ms przy każdej odpowiedzi kontekstu; to test upływu czasu z rzeczywistymi timerami Chromium, nie wielominutowa próba sieciowa na koncie. Odpowiedzi kontekstu są opóźnione o 250 ms, aby czytnik najpierw widział poprzednią odpowiedź.

Osobny baseline tego samego pełnego interfejsu z adapterem r31 zatrzymuje się przy części 4 i wyświetla chat changed after sending. Gotowość pozostaje niepotwierdzona, brak komend projektu. Nie jest doliczony do nowych 20. **36/36 prób prawdziwych React/Lexical/CodeMirror** oraz **4/4 próby ProseMirror** z r31 również przeszły. Łącznie **60 różnych sprawdzeń Chromium**. Nie powtarzano osobnej niezmienionej macierzy geometrii ani 12 prób czytnika kodu MAIN z r30; skrypt MAIN i CSS nie zostały zmienione.

Zrzut nie zawiera przyczyny anulowania ani struktury listy, więc nie przypisuje się mu z pewnością jednego z odtworzonych mechanizmów. Brak próby na zalogowanym koncie lub prawdziwym Studio. Gotowość, echa i kolejność są sprawdzane na kontrolowanej stronie z rzeczywistym kodem rozszerzenia; nie wykonano automatycznego ponowienia Send. Kompletność źródła i parser r13 pozostają zachowane. Wersja 1.24.40, core/provider r32; EXE bez zmian. Składnię, parytet kopii runtime, manifesty, zasoby i ZIP-y sprawdzono przed publikacją. Sumy: WEBCHATS-R32-SHA256SUMS.txt.

---

## r31 — akapity kompozytora i błąd 7282/7339 na pozycji 173

**928/928 testów Node**, bez błędów i pominięć (`npm test --prefix tests`, Node v24.19.0, Linux). Nowy copilot-paragraphs.test.cjs dodaje 14 przypadków. Test tworzy pierwszy z dziesięciu rzeczywistych komunikatów startupFeedbackMessages: 7282 znaki, 55 separatorów i U+0042 na pozycji 173. Kompozytor zapisuje każdą linię jako p oraz dodaje znaną parę znaków kursora. Adapter r30 odtwarza dokładnie 7339 znaków i U+000A na pozycji 173; r31 wysyła oryginalny tekst.

Przypadki obejmują dwa sposoby zapisu akapitów, z markerem Lexical i bez niego, dziesięć części bez duplikacji, zmianę edytora, zachowanie obcego szkicu oraz odrzucenie rzeczywistych zmian pustej linii, spacji, kodu i Unicode po ustaleniu separatora. Diagnostyka last_draft_failure ujawnia tylko powód, etap, długości, pozycję różnicy i flagę wymiany edytora; nie zawiera źródła ani punktów kodowych. Wybór separatora wymaga zgodności całego własnego zapisu i pozostaje przypisany do edytora.

**4 sprawdzenia Chromium z rzeczywistym ProseMirror** (`tests/browser/copilot-paragraphs.cjs`): dokładny komunikat 7282 znaków, dosłowny Luau z wcięciami/pustymi liniami/Unicode/znakami niewidocznymi, wszystkie części kontekstu wysłane raz oraz zaufane wpisanie przez klawiaturę po własnym zapisie. Model dokumentu jest niezależnym punktem porównania. Fixture używa kontrolowanego clipboardTextParser zachowującego każdą linię jako osobny p; nie jest to domyślny parser ProseMirror ani pobrany prywatny komponent Copilot. Domyślne wklejanie ProseMirror może scalać kolejne końce linii, więc test nie przypisuje mu zachowania zachowującego źródło.

**36/36 istniejących prób Chromium** bibliotek React/Lexical/CodeMirror (`tests/browser/controlled-editors.cjs`) nadal przechodzi. **3/3 celowane próby pełnego interfejsu** (`tests/browser/webchats-startup.cjs`) obejmują microsoft-line-paragraphs, microsoft-virtualized i Arcee. Każda przechodzi Start, list_commands, odbiór kontekstu, gotowość i jedno natywne pytanie z dokładnie jednym get_studio_state oraz wynikiem. W sumie **43 różne sprawdzenia Chromium**. Oddzielny baseline r30 w pełnym interfejsie zatrzymuje się na rzeczywistym Startup failed przed wysłaniem kontekstu, po jednym handshake, bez komend projektu; nie jest doliczony do 43.

Model, most i Studio w próbach pełnego interfejsu są kontrolowane. Nie przeprowadzono próby na zalogowanym koncie. Nie powtarzano niezmienionej macierzy geometrii ani osobnych 12 prób czytnika MAIN z r30; ten skrypt i CSS pozostają bez zmian. Zgłoszone wartości odtworzono dokładnie, lecz biblioteka i prywatny DOM użytkownika nie zostały odczytane. Kopie runtime, składnię JS, manifesty, integralność ZIP-ów i sumy zweryfikowano przed publikacją. Wersja 1.24.39, core/provider r31, parser r13, EXE bez zmian. Sumy: WEBCHATS-R31-SHA256SUMS.txt.

---

## r30 — model wirtualizowanego Scriptor i błąd niedostępnego źródła

**914/914 testów Node**, bez błędów i pominięć (`npm test --prefix tests`). Dodano 37 przypadków copilot-virtualized.test.cjs. Zewnętrzne opakowania, klasy scriptor-component-code-block/scriptor-codeblock-virtualized, cztery gałęzie i role=textbox odpowiadają zredagowanej strukturze z raportu r29. Atrybuty dostępności i obiekty modeli niewidoczne w raporcie są kontrolowane. Nie używa się prywatnego HTML, wiadomości ani projektu użytkownika.

Próby obejmują dokładny list_commands z params i bez, brak MAIN, brak pełnego modelu, blokowanie innych poleceń i parametrów z samego viewportu, natywne EditContext i readonly textarea oraz jawne pola właściciela komponentu React. Sprawdzają długi Luau z funkcjami Roblox/Unicode/znakami niewidocznymi, surowy protokół Luau, limit źródła bez przycinania, aktualizację poza viewportem bez zmiany długości, bieżący alternate, niejednoznaczne gałęzie, utratę modelu, stare atrybuty bez odpowiedzi MAIN, niezgodność modelu z viewportem, granicę obcego przodka DOM, wyjątek gettera, cytat/UI/użytkownika/nieznaną rolę, otwarty markdown-reply, odmowę i brak źródła w diagnostyce. Operacje fetch/Copy/schowka są liczone i nie występują podczas odczytu.

**12 sprawdzeń Chromium z prawdziwym React i osobnymi światami MAIN/isolated** (`PLAZCODE_BROWSER_DEPS=/tmp/plazcode-ui-r19 node tests/browser/copilot-virtualized.cjs`). CDP tworzy izolowany kontekst adaptera i potwierdza, że nie widzi on właściwości React. Bez czytnika pełne polecenie projektu pozostaje niewykonywalne. Po załadowaniu MAIN cały JSON i dosłowny parametr kodu przekraczający 100 tys. znaków docierają do prawdziwego parsera mimo viewportu o długości 80 znaków. Cztery kolejne edycje o tej samej długości poza viewportem nie zwracają poprzedniej wersji. Niekompletny model pozostaje niekompletny. Czytanie nie dotyka schowka ani Copy; osobne ręczne kliknięcie natywnego Copy nadal działa. Faktyczna odmowa poza blokiem nadal zatrzymuje komendy.

Pełny interfejs `microsoft-virtualized` używa tej struktury i rzeczywistego EditContext Chromium: przechodzi list_commands bez params, cały potwierdzony kontekst i jedno pytanie użytkownika z jednym get_studio_state oraz wynikiem. Projektowy command ma przycięty viewport, więc sam DOM nie wystarczyłby do wykonania. Na r29 ten sam fixture odtwarza Startup handshake failed po jednej korekcie; brak komend projektu. To odtworzenie stanu czytnika na podstawie raportu, nie próba na prawdziwym koncie Microsoft.

Nowy wariant `microsoft-virtualized-no-model` sprawdza lokalny handshake bez modelu, a następnie widoczny błąd źródła przy poleceniu projektu, zero wywołań mostu, zero ponowień i raport command_source_unavailable. Dla otwartego fragmentu zachowano domyślne oczekiwanie watchera na ustabilizowanie (około 15 sekund); fixture czeka do 30 sekund na komunikat. Dodatkowe celowane próby obejmują poprzedni Scriptor multiline, native JSON, odmowę w otwartym shadow reply i Arcee. **6/6 celowanych scenariuszy pełnego interfejsu** przeszło; wraz z osobnymi światami wykonania daje to **18 różnych sprawdzeń Chromium**. Osobny r29 baseline potwierdza wcześniejszy błąd i nie jest doliczony do tej liczby. Model/background/Studio są kontrolowane, a czasy generowania skrócone wyłącznie w fixture.

Sandbox tej sesji blokuje komunikację między procesami Chromium i szczegółowy kanał wyników procesów Node. Testy uruchomiono z zatwierdzonym wykonaniem poza tym ograniczeniem. Nie powtarzano niezmienionych 36 testów pisania do edytorów ani całej macierzy geometrii. Nowy komponent fixture React dopisuje osobny renderer; dotychczasowe funkcje kompozytorów pozostają zachowane.

Wersja 1.24.38; core/provider r30, parser r13. Nowy MAIN script jest zadeklarowany wyłącznie dla copilot.com we wszystkich trzech manifestach, bez nowych uprawnień lub hostów. Brak testu na zalogowanym koncie i brak dostępu do prywatnego modelu Microsoftu. Obsługiwane pola modelu sprawdzono na kontrolowanych obiektach i rzeczywistym React; inne niedostępne modele pozostają jawnym błędem zamiast źródłem częściowych komend. Kopie runtime, składnię Node v24.19.0 w Linux, zasoby manifestów, integralność ZIP-ów i sumy sprawdzono przed publikacją. Sumy: WEBCHATS-R30-SHA256SUMS.txt.

---

## r29 — odczyt pełnego JSON bez markerów paragrafów

**877/877 testów Node**, bez błędów i pominięć (`npm test --prefix tests`). Dodano 25 przypadków czytnika oraz 1 przypadek diagnostyki. Obejmują list_commands z params i bez, wielowierszowy JSON, opcjonalny osobny nagłówek JSON, natywny code oraz pełną długą treść Luau z Instance.new, UDim2.fromOffset, Color3.fromRGB, Unicode i dosłownymi znakami niewidocznymi. Dodatkowa ścieżka odczytu wymaga całego poprawnego JSON z command, bez wyszukiwania wybranego potomka i bez domykania źródła.

Przypadki ujemne sprawdzają dodatkową prozę, niekompletny JSON, nieoznaczony numer linii, jawnie wirtualizowany blok, Monaco/CodeMirror bez pełnego źródła, nieczytelny shadow root, ukryty fragment, slot, deklarację wierszy bez rozpoznanych linii, indeksy, cytaty, przyciski, własne karty, odmowę i nieznane role. Oznaczony gutter jest pomijany, a liczby w dosłownych parametrach pozostają zachowane. Nieczytelny blok obok poprawnej komendy zatrzymuje całość. Nowy test diagnostyki umieszcza blok pod 18 opakowaniami i potwierdza, że próbka obejmuje wnętrze kodu, liczniki paragrafów/runów i brak dostępnego źródła, nadal bez treści i w limicie 48 elementów.

Pełny zestaw bibliotek edytora: **36/36 prób Chromium** (`PLAZCODE_BROWSER_DEPS=/tmp/plazcode-ui-r19 node tests/browser/controlled-editors.cjs`). Sprawdza rzeczywiste modele React/Lexical i CodeMirror, dosłowne źródło, niewidoczne znaki, pojedynczą wysyłkę, remounty i blokadę zaufanej edycji użytkownika. Zmieniony czytnik odpowiedzi nie zmienia tych ścieżek pisania.

Pełny interfejs: **15/15 scenariuszy Chromium** (`node tests/browser/webchats-startup.cjs`), łącznie z bibliotekami edytora **51 różnych prób Chromium**. Nowy wariant `microsoft-native-json` przechodzi Start, list_commands bez params, potwierdzony kontekst i jedno natywne pytanie z jednym get_studio_state oraz wynikiem. Adapter r28 na tym samym fixture odtwarza rzeczywisty Startup handshake failed po jednej korekcie, z pustą listą komend mostu. Brak ponownego Send i kliknięć natywnego Copy. Zewnętrzne markery FAI, lastChatMessage i głębokie opakowania odpowiadają raportowi użytkownika, ale pominięte w tym raporcie wnętrze kodu jest reprezentatywnym fixture, a nie pobranym HTML konta.

Pierwsze uruchomienie pełnej macierzy UI wykryło wyścig w harnessie: domyślny monitor Play/console wykonywał dwa własne odczyty podczas przerwy po gotowości, co naruszało licznik komend protokołu. Fixture wyłącza ten odrębny monitor przez istniejące rsAutoFix=false; runtime i jego domyślne ustawienie nie są zmienione. Końcowe 15/15 obejmuje również dotychczasowe warianty historii, Scriptor, raport błędu, oba scenariusze odmowy i Arcee.

Node v24.19.0 w Linux sprawdza składnię zmienionych JS; kopie root, Chromium i Firefox są zgodne. Wersja 1.24.37, core/provider r29, parser r13. Nie zmieniono parsera, prośby startowej, ról, odmów ani wymagań potwierdzenia. Nie ma próby na zalogowanym koncie Copilot ani w rzeczywistym Studio. Dostarczony raport ustala etap utraty źródła, ale nie dowodzi dokładnej struktury wierszy użytkownika; naprawa usuwa konkretną znalezioną lukę czytnika. Sumy: WEBCHATS-R29-SHA256SUMS.txt.

---

## r28 — diagnostyka zamiast kolejnej niepotwierdzonej poprawki DOM

**851/851 testów Node**, bez błędów i pominięć (`npm test --prefix tests`). Nowy copilot-diagnostics.test.cjs dodaje 11 przypadków do wcześniejszych 840: nierozpoznany renderer i liczniki źródła, oddzielny stan z chwili błędu i aktualna strona, redakcję treści/ID/URL/szkicu/atrybutów, ograniczoną próbkę nieoznaczonych artykułów bez nadawania im ról, limity głębokości/liczby elementów, kopiowanie wyłącznie po kliknięciu, odmowę schowka i ręczny odczyt, zwykłe bannery bez nowej akcji, tanią etykietę wersji bez odczytywania DOM, awarię hooka diagnostycznego i odrzucenie dowolnych pól tekstowych w metadanych błędu.

**4 celowane próby Chromium** z pełnym zestawem skryptów i CSS: microsoft-unrecognized-code, microsoft-scriptor-multiline, microsoft-refusal-unknown-user-shadow oraz Arcee plain. Pierwsza próba pokazuje poprawny JSON w kontrolowanym nieobsługiwanym rendererze, odtwarza rzeczywisty błąd handshake i sprawdza działający Copy transport report. Raport zawiera strukturę i candidate_chars=0, zachowuje sesję jako nieuruchomioną; kliknięcie nie dodaje wiadomości ani komend mostu. Pozostałe przypadki zachowują udany start/odczyt lub zatrzymanie po odmowie. Schowek w browser fixture jest kontrolowany. Model i most są kontrolowane; czasy stabilizacji skrócono wyłącznie w fixture.

Nie powtarzano 36 niezmienionych prób bibliotek edytora i całej poprzedniej macierzy geometrii; nie zmieniono ich ścieżek pisania/wysyłania. Pełny poprzedni wynik 840 Node + 49 Chromium w r27 nie oznaczał zgodności z faktycznym kontem użytkownika. Obecny błąd z 1.24.35 jest nadal otwarty do uzyskania raportu rzeczywistej struktury. R28 zmienia tylko zbieranie i udostępnianie diagnostyki oraz metadane wersji.

Raport ma ograniczoną próbkę 48 elementów, głębokość 10 i nazwy technicznych komponentów/markerów. Nie zawiera źródła wiadomości, kodu, wartości pola, adresu rozmowy ani natywnych ID; nie jest zapisywany w storage ani automatycznie eksportowany. Etykiety wersji korzystają z osobnego taniego helpera, bez cyklicznego skanowania DOM. Błąd opcjonalnego hooka nie blokuje raportu podstawowego. Składnia zmienionych JS sprawdzona Node 24 w Linux; kopie Chromium i Firefox zgodne. Nie ma próby na zalogowanym koncie ani w prawdziwym Studio. Wersja 1.24.36, core/provider r28, parser r13. Sumy: WEBCHATS-R28-SHA256SUMS.txt.

---


## r27 — kod Scriptor w rozpoznanej odpowiedzi Microsoftu

**840/840 testów Node**, bez błędów i pominięć (`npm test --prefix tests`). Nowy copilot-scriptor.test.cjs dodaje 29 przypadków do wcześniejszych 811. Obejmuje dokładne JSON-y list_commands z params i bez, odwróconą kolejność pól, kilka logicznych linii, brak markerów textRun, zagnieżdżone runy i ich warianty nazw klas, angielski/niemiecki/polski podgląd kodu, długą dosłowną treść Luau w JSON oraz 800 zamontowanych logicznych linii surowego Luau. Sprawdza Instance.new, UDim2.fromOffset, Color3.fromRGB, Unicode, znaki niewidoczne, whitespace i puste wiersze bez skracania źródła.

Pozostałe przypadki obejmują open shadow markdown-reply, cytaty/Copy/karty PlazCode, nieznane role, brak natywnego kontenera kodu, odmowę poza blokiem, niekompletny JSON, jawnie wirtualizowany viewport, brakującą i zdublowaną linię, sprzeczną liczbę linii oraz reakcję na nieczytelny blok obok poprawnego. Czytnik nie zwraca starej komendy po edycji. Karta narzędzia jest mocowana przy rzeczywistej grupie kodu, poza źródłem. Nie zmieniono zachowania odmów.

**49 różnych prób Chromium**: 36 controlled-editors.cjs i 13 webchats-startup.cjs. Trzy nowe warianty to microsoft-scriptor, microsoft-scriptor-shadow oraz microsoft-scriptor-multiline. Kod nie używa pre: zawiera nagłówek JSON, Copy, numerację, logiczne paragrafy i podzielone textRun. Wariant wielowierszowy pomija params przy list_commands. Każdy przechodzi rzeczywisty kod startu, odbiór kontekstu, gotowość i jedno natywne pytanie z jednym get_studio_state oraz wynikiem. Liczniki kontrolują brak powtórzonych wiadomości i kliknięć Copy. Dotychczasowe odmowy i Arcee nadal przechodzą. Model/background/Studio są kontrolowane, czasy stabilizacji skrócone tylko w fixture.

Na r26 nowe dodatnie próby czytnika nie przechodzą. Osobna próba pełnego interfejsu z tym adapterem czeka na rzeczywisty Startup handshake failed po jednej korekcie, zamiast uznawać sam przycisk Restart za zakończenie startu. Poprawiony wariant przechodzi protokół. W testach sukcesu oczekuje się również canRestoreSession(), nie tylko zmiany etykiety przycisku. Odpowiedzi i źródło DOM nie pochodzą z zalogowanego konta użytkownika.

Źródło kontraktu: TomSchmidtDev/browser-ai-chat-exporter, commit 0830aad4488754ba7c6b2cdcf6cfb7ea65841e80, platforms/copilot/content.js, obsługa scriptor-component-code-block. Są to publiczne przykłady i własne fixture. Wirtualizowany edytor bez pełnego modelu nie jest wspierany; sprawdza się dostępne deklaracje liczby/indeksów i jawne znaczniki wirtualizacji, bez obietnicy wykrycia każdej nieoznaczonej zmiany interfejsu.

Wersja 1.24.35, core/provider r27, parser r13; wszystkie trzy kopie zgodne. Zmienione JS sprawdzone Node 24 w Linux. Nie powtarzano niezmienionych zestawów geometrii i podstawowej wysyłki. Nie przeprowadzono testu na zalogowanym koncie ani w rzeczywistym Studio. Sumy: WEBCHATS-R27-SHA256SUMS.txt.

---


## r26 — wariant Microsoft i odmowa protokołu

**811/811 testów Node**, bez błędów i pominięć (`npm test --prefix tests`). Nowy copilot-microsoft-dom.test.cjs dodaje 24 przypadki do wcześniejszych 787. Obejmuje natywne artykuły fai-UserMessage/fai-CopilotMessage, chatOutput i klasę treści użytkownika, copilot-message, deduplikację i odrzucenie nieoznaczonych/podobnych elementów. Sprawdza pełny dosłowny JSON/Luau z otwartego markdown-reply, zagnieżdżenie hostów, reakcje, cytaty, odmowę mimo pozornego polecenia, brak roli nieznanego shadow hosta oraz niewykonywanie slotów i nieaktywnej treści light DOM.

Próby odmowy używają dokładnego zdania ze zrzutu. Nowa stabilna odmowa przy nierozpoznanym wpisie użytkownika przerywa wysyłkę z oznaczonym błędem; nie stanowi potwierdzenia odbioru i nie pozwala na ponowienie. Stare odmowy/remounty/duplikaty ID, cytaty, treść w czasie generowania oraz Stop i zmiana czatu zachowują dotychczasowe ograniczenia. Nowe liczniki struktury transkryptu nie zawierają źródła wiadomości.

**46 różnych prób Chromium**: 36 controlled-editors.cjs oraz 10 scenariuszy webchats-startup.cjs. Siedem wariantów Copilot przechodzi Start, kontekst i jeden odczyt (dotychczasowe pięć, Microsoft w light DOM i otwartym shadow root). Dwa kolejne odtwarzają dokładną odmowę, w tym nierozpoznany wpis użytkownika + rozpoznana odpowiedź w shadow root: pokazuje się wyłącznie AI declined the connection request, połączenie nie jest oznaczane jako gotowe, brak korekty i części kontekstu, pojedynczy Send i zero komend projektu. Arcee nadal przechodzi swój scenariusz. Scenariusze odmowy i Arcee uruchamiano również oddzielnie przez PLAZCODE_TEST_HISTORY; liczba 46 dotyczy różnych przypadków, nie sumy powtórzeń. Model, most i Studio są kontrolowane, stabilizację skrócono tylko w fixture.

Adapter r25 w nowych dodatnich przypadkach wariantu Microsoft nie rozpoznaje wpisów; pełna próba microsoft-plain odtwarza brak potwierdzenia. Nie potwierdza to struktury prywatnego konta. Źródłem wariantu jest publiczny browser-ai-chat-exporter, commit 0830aad4488754ba7c6b2cdcf6cfb7ea65841e80, platforms/copilot/content.js. Obsługa otwartego markdown-reply jest sprawdzana na własnym fixture, nie na prywatnym komponencie Microsoft.

Wersja 1.24.34, core/provider r26, parser r13; wszystkie trzy kopie zgodne. Składnia zmienionych JS sprawdzona Node 24 w Linux. Nie powtarzano niezmienionych zestawów geometrii i podstawowej wysyłki. Nie ma próby na zalogowanym koncie lub w rzeczywistym Studio; dostęp do zamkniętych shadow roots nie jest dodany, a slotted reply pozostaje nieobsługiwany. Odmowa modelu nie jest naprawiana zmianą promptu ani lokalnym katalogiem. Sumy: WEBCHATS-R26-SHA256SUMS.txt.

---


## r25 — brakujące znaczniki ról Copilot

**787/787 testów Node**, bez błędów i pominięć (`npm test --prefix tests`). Nowy copilot-role-markers.test.cjs dodaje 20 przypadków. Sprawdza dokładne tokeny nazwanych grup, testid ai-message, artykuł użytkownika z natywnym ID, treść bez dotychczasowych data-content/data-role, deduplikację zagnieżdżonych znaczników, wyłączenie etykiet i reakcji, pojedyncze wysłanie i rozwinięcie, pierwszy zapis rozmowy, remount starego wpisu, zachowany szkic i przywracanie potwierdzonej sesji. Odmienne podciągi klas i group-hover, sama klasa wewnętrznej treści AI, wyrównanie wizualne, znaczniki w nav/aside/pre/code/blockquote/dialog/edytorze oraz sam JSON AI nie stają się wpisami lub dowodem dostarczenia. Suma: wcześniejsze 767 + 20.

**42/42 próby Chromium**: 36 controlled-editors.cjs i 6 webchats-startup.cjs. Trzy nowe przepływy pełnego startu nie używają wcześniejszych data-content/data-role/data-message-id. Użytkownik ma dokładną klasę group/user-message i natywne ID; asystent jest rozpoznawany przez testid ai-message albo group/ai-message. Test obejmuje treść group/ai-message-item bez markdown, metadane i reakcje, ucięty podgląd rozwijany raz przez przypisaną kontrolkę, U+200B U+200C po własnym źródle i pierwszy zapis /chat/conversation/<id>. Każdy przepływ przechodzi kontekst, gotowość oraz jedno natywne pytanie z jednym get_studio_state i wynikiem, bez duplikacji Send/Copy. Dotychczasowe dwa warianty Copilot i Arcee pozostają w zestawie. Model i most są kontrolowane, czasy stabilizacji skrócono tylko w fixture.

Na adapterze r24 nowe dodatnie próby nazwanych znaczników nie przechodzą; pełny interfejs wariantu named-groups odtwarza brak potwierdzenia przy zerowej liczbie odczytanych wiadomości. Porównanie nie obejmuje zalogowanego konta. Dodatkowo uruchomiono odczyt dwóch publicznych zapisów DOM z repo revivalstack/ai-chat-exporter, commit 4ce218d1290956703489870aafa2adfdf4448f38: copilot-chat-dom.html i copilot-dom-2question-ans-pairs.html. Oba dają po dwa wpisy użytkownika i AI z niepustą treścią. Źródła i zakres: ARCEE-COPILOT.md.

Składnię zmienionych JS sprawdzono Node 24 w Linux; runtime Windows z MAINTENANCE.md nie jest dostępny. Wersja 1.24.33, core/provider r25, parser r13. Trzy kopie zsynchronizowane. Nie powtarzano niezmienionych zestawów geometrii i podstawowej wysyłki (poprzedni wynik w r22). Nie przeprowadzono próby na zalogowanym koncie ani w prawdziwym Studio. Publiczne przykłady potwierdzają znaczniki, ale nie dowodzą aktualnej struktury konta użytkownika. Sumy: WEBCHATS-R25-SHA256SUMS.txt.

---


## r24 — odczyt zwiniętej historii i potwierdzenie wysyłki Copilot

**767/767 testów Node**, bez błędów i pominięć (`npm test --prefix tests`). Nowy copilot-history.test.cjs dodaje 21 przypadków: sześć oznaczonych struktur historii, czytanie wiadomości będącej button/role=button, oddzielenie treści od metadanych i Copy/menu, dwa sposoby rozwinięcia nowego skrótu, pełny tekst zwinięty tylko przez CSS, brak pełnego tekstu po rozwinięciu, stare i anonimowe wpisy po remoncie, niezgodny/krótki prefiks, obce aria-controls, Stop/zmianę rozmowy/remount, blok kodu asystenta w kontrolce oraz odrzucenie samego JSON asystenta jako dowodu wysyłki i nieoznaczonego JSON jako roli. Suma: wcześniejsze 746 + 21.

**39/39 wykonanych prób Chromium**: 36 controlled-editors.cjs oraz 3 webchats-startup.cjs. Pełny zestaw skryptów i overlay.css przechodzi Start Agent, odbiór kontekstu i natywne pytanie z jednym get_studio_state oraz wynikiem. Copilot obejmuje dokładne 552 znaki + U+200B U+200C, jawne wiadomości z role=button, metadane i Copy, pełny tekst zwinięty przez CSS oraz faktycznie ucięty podgląd rozwijany raz do pełnej treści. Licznik kontroluje brak kliknięć Copy, nadmiarowych rozwinięć i duplikacji Send. Arcee nadal przechodzi lokalny katalog po odpowiedzi opisowej i rzeczywisty kod odczytu. React/Lexical/CodeMirror sprawdzają wewnętrzny model, dokładne źródło i pojedynczą wysyłkę.

Adapter r23 w tej samej nowej próbie pełnego interfejsu zatrzymuje się po wysłaniu na braku potwierdzenia. Dodatnie próby odczytu wiadomości w kontrolce również odtwarzają ten błąd na r23. Na r24 przechodzą. Nie wykonywano ponownie niezmienionych zestawów geometrii i podstawowej wysyłki; poprzednie wyniki są w r22. Składnię zmienionych JS sprawdzono Node 24 w Linux; wskazany w MAINTENANCE.md runtime Windows nie jest dostępny.

Zmiana dotyczy czytnika historii Copilot i ograniczonego rozwijania własnego nowego wpisu, nie ponownego wysyłania. Pełny tekst nadal jest wymagany do potwierdzenia. W razie niepowodzenia raport zawiera wyłącznie liczniki i długości. Wersja 1.24.32, core/provider r24, parser r13. Trzy kopie zsynchronizowane. Model, background i Studio w próbach są kontrolowane; zegar stabilizacji skrócono tylko w fixture. Nie oglądano zalogowanego DOM użytkownika; nie ustalono z pewnością, który wariant struktury występuje na jego koncie. Sumy: WEBCHATS-R24-SHA256SUMS.txt.

---


## r23 — dokładna para U+200B U+200C z komunikatu Copilot

**746/746 testów Node**, bez błędów i pominięć (`cd tests && npm test`). Dotychczasowy webchats-r22.test.cjs rozszerzono z 26 do 30 przypadków. Dodano dokładną końcówkę U+200B U+200C, literalne U+200C w kodzie i na końcu podanego źródła oraz różnicę wewnątrz szkicu. Domyślne opakowanie tego fixture jest teraz parą ze zrzutu, więc dotychczasowe próby echa, remountu i czyszczenia również ją obejmują. Suma: wcześniejsze 742 + 4.

**38/38 wykonanych prób Chromium**: 36 controlled-editors.cjs i 2 webchats-startup.cjs. Zestawy obejmują rzeczywiste React/Lexical/CodeMirror oraz kontrolowane contenteditable z dokładną parą w edytorze i echu. Zaufany input użytkownika z literalną parą pozostaje niezmieniony. Pełne skrypty rozszerzenia i overlay.css przechodzą kliknięcie Start Agent, gotowość i jedno natywne pytanie z komendą get_studio_state oraz jej wynikiem. Model, background i Studio są symulowane; czasy stabilizacji skrócono wyłącznie w fixture.

Nowy dodatni przypadek porównano z adapterem r22: z 9 wariantów końcówki przechodziło 8, a U+200B U+200C odtwarzało dokładnie „Expected 552 characters, read 554; difference at 552 (end / U+200B U+200C)”. Pełny interfejs ze starym adapterem również zatrzymał się na tym komunikacie. Na r23 oba zestawy przechodzą. Nie wykonywano ponownie niezmienionych zestawów geometrii i podstawowej wysyłki; ich poprzednie wyniki są w r22.

Jedyna zmiana zachowania to dopuszczenie U+200C jako drugiego znaku krótkiej końcówki od U+200B, za pełnym dokładnym własnym zapisem. Brak ogólnego usuwania znaków niewidocznych. Wersja 1.24.31, core/provider r23, parser r13. Trzy kopie zsynchronizowane. Nie przeprowadzono próby na zalogowanym Copilot ani w prawdziwym Studio. Sumy: WEBCHATS-R23-SHA256SUMS.txt.

---


## r22 — dokładny błąd 552/554/U+200B i lokalny katalog Arcee

**742/742 testy Node**, bez błędów i pominięć (`cd tests && npm test`). Nowy webchats-r22.test.cjs zawiera 26 przypadków: niewidoczna końcówka po pełnym znanym zapisie Copilot, znaki literalne wewnątrz i na końcu źródła, własność szkicu, remount, echo i czyszczenie własnego zapisu, inny szkic i nieznana końcówka, Arcee inline JSON oraz odrzucenie opisów/cytatów/odmów/przykładów. Dodano 16 przypadków rzeczywistego startSession: dwie odpowiedzi opisowe w istniejącym czacie, pełny watcher i kontekst, poprawny inline JSON, odmowa, uszkodzone/inne polecenie, błędy katalogu, brak odbioru kontekstu, Stop/zmiana rozmowy/generacji i świeży live-status zamiast wnioskowania o połączeniu z samych schematów. Suma: wcześniejsze 700 + 26 + 16.

**57/57 prób Chromium**: 15 układu pełnego interfejsu, 6 podstawowej wysyłki, 34 controlled-editors.cjs oraz 2 nowe webchats-startup.cjs. Kontrolowany contenteditable z tą samą wiadomością startową i końcówką od U+200B na adapterze r21 odtwarza dokładnie: „Expected 552 characters, read 554; difference at 552 (end / U+200B)”. R22 wysyła ją raz. Rzeczywiste React/Lexical/CodeMirror nadal sprawdzają zgodność wewnętrznego modelu, dosłowny kod z Unicode, blokadę i zwolnienie edycji. Dodatkowe próby obejmują literalny U+200B/FEFF w kodzie i zaufany input użytkownika po własnym zapisie.

Nowy zestaw pełnego startu ładuje wszystkie skrypty grupy manifestu i overlay.css. Klika Start Agent i czeka na gotowość. Dla Copilot pole zawiera dokładne 552 znaki plus dwa znaki prezentacji, także w echu. Dla Arcee dwie zwykłe odpowiedzi uruchamiają rzeczywisty kod lokalnego list_commands i odbiór kontekstu. Następnie użytkownik wysyła pytanie natywnym polem i przyciskiem. W obu przypadkach cały agent wysyła dokładnie jedno get_studio_state do kontrolowanego backgroundu, odbiera wynik i przekazuje go modelowi. Nie ma ponowionej wiadomości startowej ani pozostawionego szkicu. Zegar stabilizacji jest skrócony wyłącznie w fixture.

W nowej weryfikacji katalogu rozdzielono opt-in świeżego live-status od wcześniejszych wymagań innych adapterów. Dotychczasowy ChatWave API przechodzi wszystkie 40 testów, w tym natywne wywołania funkcji, start i pętlę z wynikami.

To testy pełnego kodu z kontrolowaną stroną, modelem i mostem, a nie zalogowanych usług ani rzeczywistego Roblox Studio. Pierwszy dodatkowy znak Copilot wynika z komunikatu użytkownika; drugi nie był widoczny w r21, dlatego testy obejmują krótkie warianty końcówki. Nie ustalono pełnego źródła ostatniej odpowiedzi Arcee ze zrzutu. Nie zmieniano danych kont ani natywnego EXE.

Wersja 1.24.30, core/provider r22, parser r13. Zsynchronizowane trzy kopie. Sumy: WEBCHATS-R22-SHA256SUMS.txt. Polecenia prób Chromium i zależności: ARCEE-COPILOT.md.

---


## r21 — Copilot przed Send i Arcee bez odczytu projektu

**700/700 testów Node**, bez błędów i pominięć (`cd tests && npm test`). Nowy `webchats-r21.test.cjs` ma 12 przypadków źródła contenteditable, rzeczywistych/technicznych BR, odstępów/Unicode, opóźnionego zatwierdzenia, zmienionego szkicu, stabilności, Stop i przełączenia rozmowy. Wspólny fixture rzeczywistej pętli `motif-continuation.test.cjs` rozszerzono o 18 przypadków obu nowych adapterów: pytanie ze zrzutu, jeden odczyt i wynik, pobranie schematów przed inspekcją, ograniczenie powtarzanej zapowiedzi, pytania teoretyczne, zakaz narzędzi, doprecyzowanie celu, odmowa, odpowiedź końcowa, odłączony most, Stop/zmiana czatu/generacji oraz blokada zapisu po przypomnieniu. Model i most są kontrolowane. Suma: wcześniejsze 670 + 12 + 18.

**43/43 próby Chromium**: 15 pełnego interfejsu, 6 podstawowej wysyłki i 22 controlled-editors.cjs. Rzeczywisty Lexical otrzymuje paste po 350 ms; agent czeka na model i wysyła dokładnie raz. Ten sam test na adapterze r20 kończy się „Copilot: prepared text changed before sending. Nothing was sent.”, zgodnie z komunikatem ze zrzutu. Testy źródła kontrolowanego edytora akapitowego obejmują nieedytowalną kontrolkę, oznaczony techniczny BR oraz CSS text-transform, z zachowaniem pełnego wielowierszowego tekstu, NBSP i końcowego newline. Dotychczasowe modele React, wirtualizacja CodeMirror oraz geometria paska pozostają zaliczone. Powtórzenie: ARCEE-COPILOT.md.

Cztery nowe dodatnie scenariusze pętli inspekcji uruchomiono też na samych plikach r20: żaden nie przechodził. Po poprawce przechodzą w całym zestawie. To odtworzenie zachowania w kontrolowanym środowisku, nie dowód zgodności z aktualnym prywatnym DOM serwisów.

Nie przeprowadzono testu na zalogowanych Arcee/Copilot ani z prawdziwym Studio. Screenshot Arcee dostarcza tekstu odpowiedzi, ale nie dziennika bridge/DOM; screenshot Copilot potwierdza etap porównania, ale nie wskazuje różniącego się znaku. Naprawiono odtworzone warianty, dodając do błędu długości i indeks/kod pierwszej różnicy, bez udawania potwierdzonego dostępu do konta.

Wersja 1.24.29, core/provider r21, parser r13. Zsynchronizowane trzy kopie rozszerzenia. Sumy: WEBCHATS-R21-SHA256SUMS.txt.

---


## r20 — pierwsza rozmowa Arcee i potwierdzenie wysyłki Copilot

**670/670 testów Node**, bez błędów i pominięć (`cd tests && npm test`). Nowy plik `webchats-r20.test.cjs` ma 17 przypadków: pierwszy zapis Arcee, remount i późny ID pierwszej wiadomości, stopniowe renderowanie jej tekstu, porządkowanie parametrów Copilot, rzeczywista zmiana rozmowy, jawne role, ponowne użycie pustego wiersza, stare identyczne wiadomości, wirtualizacja z nowym natywnym ID, pozostawiony własny szkic, inny szkic i brak dowodu doręczenia. Dodano 2 testy pełnego startu obu adapterów z rzeczywistym watcherem: jedno list_commands, wynik i potwierdzony kontekst, bez powtórzonego żądania i pozostałego tekstu w polu. Suma: wcześniejsze 651 + 17 + 2.

**38/38 prób Chromium**: 15 pełnego interfejsu, 6 podstawowej wysyłki i 17 `controlled-editors.cjs`. Rozszerzone fixture rzeczywistych React 19.2.0 i Lexical 0.38.2 zachowują tekst po wysłaniu; adapter usuwa go z modelu dopiero po potwierdzeniu. Sprawdzono jedno kliknięcie, pusty model, zgodność źródła, blokadę użytkownika i przywrócenie edycji. Dotychczasowe próby pełnego dokumentu CodeMirror i geometrii paska pozostają zaliczone. Zależności i polecenia: ARCEE-COPILOT.md.

Przed ostatnimi dwoma testami renderowania pierwszego wiersza uruchomiono pierwotny zestaw 15 przypadków r20 na samym adapterze r19: 5 zaliczonych, 10 nieudanych. To porównanie adaptera na kontrolowanym DOM, nie wynik działania poprzedniej wersji na kontach użytkownika.

Nie przeprowadzono testu zalogowanego Arcee ani Copilot z prawdziwym modelem/mostem/Studio. Dostęp do /chat Copilot blokował CONNECT 403. Zrzut pokazuje odpowiedź list_commands i pozostawiony tekst, ale nie rozstrzyga dokładnej kolejności zdarzeń; poprawka obejmuje odtworzone przyczyny znalezione w kodzie. Obie integracje pozostają eksperymentalne.

Wersja 1.24.28, core/provider r20, parser r13. Zsynchronizowane trzy kopie rozszerzenia. Sumy: WEBCHATS-R20-SHA256SUMS.txt.

---


## r19 — Copilot composer changed oraz Arcee js/on/CodeMirror

**651/651 testów Node**, bez błędów i pominięć. Nowy plik webchats-r19.test.cjs ma 18 przypadków: wymiana edytora po fokusie/input, inny szkic/kontener/rozmowa, Stop, odczyt CodeMirror ze zrzutu Arcee, pełne długie źródło, niezmienione parametry, aktualizacja dokumentu o tej samej długości, brak tapu, niepełny/niepoprawny artefakt on, cytaty i rozumowanie, format startu oraz MAIN-world rejestracja wszystkich kopii. Dodano też 2 testy rzeczywistego startSession Arcee: list_commands z CodeMirror, wynik, potwierdzane części kontekstu i stan gotowości, także po jednej korekcie formatu. Suma: wcześniejsze 631 + 18 + 2.

**32/32 próby Chromium**: 15 pełnego interfejsu, 6 podstawowej wysyłki i 11 controlled-editors.cjs. Nowy zestaw uruchamia prawdziwe React/Lexical/CodeMirror na kontrolowanych stronach. Weryfikuje wewnętrzny model edytora, nie tylko tekst DOM. Wymiana pola po fokusie i input, pierwsza wiadomość w istniejącym czacie aa, źródło wielowierszowe z Unicode/HTML/newline, czyszczenie, blokada klawisza użytkownika i przywrócenie edycji przechodzą. Prawdziwy CodeMirror przekazuje cały długi dokument mimo wirtualizacji; adapter rozpoznaje js/on/list_commands. Zależności i polecenia: ARCEE-COPILOT.md.

Nie testowano zalogowanych stron z rzeczywistym modelem i mostem. Rozpoznanie artefaktu Arcee opiera się na publicznym bundle z poprzedniej sesji i nowym zrzucie. Mechanizm kontrolowanego edytora Copilot sprawdzono na bibliotekach, bez potwierdzenia wersji/frameworka prywatnego interfejsu Microsoft. Nie usunięto kontroli zmiany rozmowy ani zgodności treści i nie dodano ponowienia wysyłki.

Wersja 1.24.27, core/provider r19, parser r13. Zsynchronizowane trzy kopie rozszerzenia. Sumy: WEBCHATS-R19-SHA256SUMS.txt.

---

## r18 — wykrycie Copilot przed pojawieniem się Send

**631/631 testów Node**, bez błędów i pominięć; **6/6 prób edytowania/wysyłki** i **15/15 prób pełnego interfejsu Chromium**. Nowe 6 testów sprawdza puste pole z polską i angielską etykietą, domontowanie polskiego Send po input i jego usunięcie po wysłaniu, /chat z query string ze zrzutu, brak przycisku po wpisaniu bez przypadkowych kliknięć, niejednoznaczne edytory i polski Stop. Te same 21 testów kompozytora uruchomione na kodzie r17: 16 zaliczonych, 5 nieudanych. Na r18 wszystkie przechodzą.

Dodano 3 próby pełnego interfejsu w widokach 980×596, 953×240 i 390×596: contenteditable z etykietą Wyślij wiadomość do funkcji Copilot, brak Send przed wpisaniem, pierwsza wysyłka przez adapter bez ręcznej litery, ponowne wykrywanie po usunięciu Send oraz natywne kliknięcie/Enter przy nieuruchomionym agencie. Scenariusz odpowiada zachowaniu potwierdzonemu przez użytkownika; fixture pozostaje kontrolowane. Bieżący odczyt /chat blokował CONNECT 403. Nie testowano zalogowanego modelu ani Studio. Wersja 1.24.26, core/provider r18, parser r13. Sumy: `COPILOT-R18-SHA256SUMS.txt`.

---

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
