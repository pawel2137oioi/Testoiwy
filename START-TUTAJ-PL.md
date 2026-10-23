# PlazCode — rozszerzenie 1.24.37, poprawka odczytu r29

## r29 — natywny blok JSON bez klas wierszy

Raport użytkownika potwierdza poprawne rozpoznanie wiadomości oraz dwóch elementów podglądu kodu, ale kandydat polecenia ma długość 0. Awaria następuje przed parserem. Raport r28 odciął strukturę przed wnętrzem kodu, więc nie ustala dokładnej postaci jego wierszy.

R29 uzupełnia brakującą ścieżkę odczytu: kompletny JSON w rozpoznanym natywnym bloku nie wymaga już klas scriptor-paragraph. Czytany jest cały blok, z pominięciem osobnego nagłówka JSON i znanych kontrolek. Niekompletny JSON, nieczytelny model, wirtualizacja i niespójne metadane nadal zatrzymują wykonanie. Dosłowny kod w parametrach pozostaje zachowany. Diagnostyka pokazuje teraz wnętrze wykrytych bloków przed zewnętrznymi opakowaniami strony, bez kopiowania treści.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj dodatek i odśwież Copilot. Sprawdź **1.24.37** oraz **core:r29/parser:r13/provider:r29**. Chrome/Edge: `PlazCode-Extension`; Firefox: `PlazCode-Extension-Firefox`. EXE bez zmian. Na pustym polu Start Agent musi odebrać list_commands i potwierdzenie kontekstu. W razie błędu przycisk Copy transport report zawiera teraz również strukturę wnętrza kodu.

**Weryfikacja:** 877/877 testów Node i 51 różnych prób Chromium. Scenariusz bez klas paragrafów odtwarza błąd r28 i przechodzi pełny start oraz odczyt na r29. Dokładne wyniki: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md); opis: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R29-SHA256SUMS.txt`. Model i most są kontrolowane. Nie ma testu na zalogowanym koncie; struktura niewidocznych potomków kodu z raportu pozostaje niepotwierdzona.

Poniżej historia; do aktualizacji obowiązuje r29 powyżej.

---

# PlazCode — rozszerzenie 1.24.36, diagnostyka r28

## r28 — raport rzeczywistej strony przy błędzie Copilot

Użytkownik potwierdził, że 1.24.35 nadal nie odczytuje widocznego list_commands. Przyczyna na jego koncie pozostaje nieustalona. To wydanie dodaje diagnostykę potrzebną do analizy rzeczywistego interfejsu; nie deklaruje naprawy handshake i nie dodaje kolejnych zgadywanych selektorów.

**Jak zebrać dane:** podmień cały folder rozszerzenia, przeładuj dodatek i odśwież kartę Copilot. Sprawdź **1.24.36** oraz **core:r28/parser:r13/provider:r28**. Po wystąpieniu Startup handshake failed lub Startup failed kliknij **Copy transport report** w tym oknie. Wklej skopiowany JSON w rozmowie z osobą naprawiającą problem. Gdy schowek jest zablokowany, raport pokaże się pod przyciskami i można go zaznaczyć ręcznie. Jest też dostępny przez Settings → Copy transport report.

Raport zawiera wersje, wybrany silnik RS/AS, liczniki wiadomości i bloków, długość odczytanego tekstu/kandydata komendy, flagi poprawnego JSON oraz ograniczoną strukturę ostatniej odpowiedzi. Zachowuje stan z chwili błędu i osobno aktualny odczyt. Nie kopiuje treści wiadomości, kodu, szkicu, adresu rozmowy, ID wiadomości, href/title/aria-label ani dowolnych atrybutów. Nazwy komponentów są ograniczone do technicznych markerów interfejsu. Dane pozostają w pamięci karty; kopiowanie następuje wyłącznie po kliknięciu. Nie wysyła wiadomości, nie klika Copy na stronie AI i nie wykonuje poleceń Studio.

**Weryfikacja:** 851/851 testów Node i 4 celowane próby Chromium. Obejmują rzeczywisty kod błędu z nieobsługiwanym kontrolowanym rendererem i skopiowanie zredagowanego raportu, poprawny start Scriptor, odmowę i Arcee. Nie przeprowadzono próby na zalogowanym koncie. W tej wersji nie zmieniono parsera, reguł odczytu bloków ani protokołu startowego. EXE bez zmian; Chrome/Edge: `PlazCode-Extension`, Firefox: `PlazCode-Extension-Firefox`. Wyniki: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md); opis: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R28-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r28 powyżej.

---

# PlazCode — rozszerzenie 1.24.35, lokalna poprawka r27

## r27 — poprawny list_commands w bloku kodu Microsoftu

Na nowym zrzucie model zwraca poprawny JSON, a start mimo tego zgłasza brak list_commands. Wariant czytnika r26 rozpoznaje role, ale szuka kodu w pre. Publiczny eksporter Microsoftu opisuje również scriptor-component-code-block z logicznymi wierszami scriptor-paragraph i fragmentami scriptor-textRun. R27 czyta te fragmenty jako źródło, bez nagłówka JSON, numerów linii i Copy. Nie zmienia prośby startowej ani nie zastępuje komendy lokalnym katalogiem.

Obsługiwane są oba JSON-y ze zrzutu: z params i bez params, format wielowierszowy, otwarty markdown-reply oraz surowy protokół Luau. Znaki, odstępy, puste linie i treść parametrów pozostają zachowane. Luki/duplikaty numeracji, sprzeczna deklaracja liczby linii i jawna wirtualizacja blokują wykonanie; nie odtwarza się brakujących fragmentów. Jeden nieczytelny blok nie pozwala wykonać części odpowiedzi. Zwykła odmowa poza blokiem nadal zatrzymuje start.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj dodatek i odśwież kartę Copilot. Wersja **1.24.35**, raport **core:r27/parser:r13/provider:r27**. Chrome/Edge: `PlazCode-Extension`; Firefox: `PlazCode-Extension-Firefox`. EXE bez zmian. Start wymaga pustego pola; nowy pusty czat usuwa wpływ starego niepełnego startu.

**Weryfikacja:** 840/840 testów Node i 49 różnych prób Chromium. Nowe scenariusze przechodzą list_commands, kontekst i jeden get_studio_state; r26 na tym samym formacie odtwarza błąd handshake po jednej korekcie. Model, most i Studio są kontrolowane. Nie ma próby na zalogowanym koncie użytkownika, więc dokładna struktura jego DOM pozostaje niepotwierdzona. Wyniki: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md); źródło formatu: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R27-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r27 powyżej.

---

# PlazCode — rozszerzenie 1.24.34, lokalna poprawka r26

## r26 — wariant Microsoft i jawna odmowa Copilot

Na zrzucie 1.24.33 czytnik nadal zgłasza 0 wpisów, a model odpowiada: „I cannot participate in or control external browser extensions by emitting structured commands for them.” To jawna odmowa protokołu. R26 nie próbuje jej obchodzić ani ponawiać prośby.

Dodano opisany w publicznym czytniku wariant Microsoft: dokładne klasy fai-UserMessage/fai-CopilotMessage wraz z role=article, testid copilot-message, treść chatOutput i markdown-reply. Obsługiwany jest również pełny tekst i kod z otwartego shadow root oznaczonego markdown-reply wewnątrz rozpoznanej odpowiedzi. Nieaktywne fallbacki i sloty nie są wykonywane; inne shadow roots nie ustalają roli.

Po nowej, ustabilizowanej odmowie start kończy się komunikatem **AI declined the connection request**, także gdy nie udało się potwierdzić wpisu użytkownika. Odmowa nie staje się potwierdzeniem dostarczenia. Nie uruchamia się komend, kontekstu ani drugiej prośby. Stara odmowa, cytat i treść w trakcie generowania nie są przypisywane do nowej próby. Raport niepotwierdzonej wysyłki zawiera teraz dodatkowe liczniki struktur DOM, bez treści czatu.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj dodatek i odśwież Copilot. Wersja **1.24.34**, raport **core:r26/parser:r13/provider:r26**. Chrome/Edge: `PlazCode-Extension`; Firefox: `PlazCode-Extension-Firefox`. EXE bez zmian. Przed świadomą nową próbą zachowaj lub wyczyść szkic; start wymaga pustego pola. Jeśli wybrany model nadal odmawia, agent pozostaje wyłączony.

**Weryfikacja:** 811/811 testów Node i 46 różnych prób Chromium. Wariant Microsoft przechodzi start i odczyt z kontrolowanym modelem, a dokładna odmowa ze zrzutu zatrzymuje pełny interfejs bez ponowienia. Nie przeprowadzono próby na zalogowanym koncie ani w prawdziwym Studio; bieżąca struktura DOM użytkownika nadal nie jest potwierdzona. Wyniki: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md); źródła i ograniczenia: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R26-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r26 powyżej.

---

# PlazCode — rozszerzenie 1.24.33, lokalna poprawka r25

## r25 — Copilot: „Read user messages: 0”

Zrzut 1.24.32 potwierdza brak rozpoznanych wpisów, a nie tylko pusty tekst zwiniętej wiadomości. Dodano dokładne, opisane w publicznych eksporterach znaczniki Copilot: tokeny klas `group/user-message`, `group/ai-message`, `data-testid="ai-message"` i artykuł użytkownika z natywnym ID zakończonym `-user-message`. Czytnik korzysta też z właściwej treści `group/ai-message-item` i `max-w-user-text-message`, pomijając etykiety dostępności i reakcje. Nie zgaduje roli na podstawie JSON, wyglądu lub dowolnej klasy zawierającej słowo message.

Testy obejmują wiadomości bez wszystkich wcześniejszych atrybutów, zwinięty podgląd, pierwszy zapis adresu rozmowy, rozpoznanie polecenia AI, kontekst i odczyt Studio. Wersja r24 w takim przypadku odtwarza 0 odczytanych wpisów; r25 przechodzi. Same odpowiedzi AI i stare wpisy nadal nie potwierdzają wysyłki. Send nie jest ponawiany.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj dodatek i odśwież stronę Copilot. Sprawdź **1.24.33** i **core:r25/parser:r13/provider:r25**. W nowym pustym czacie uruchom Start Agent. Zachowaj lub wyczyść szkic pozostały po poprzedniej próbie. Chrome/Edge: `PlazCode-Extension`; Firefox: `PlazCode-Extension-Firefox`. EXE bez zmian.

**Weryfikacja:** 787/787 testów Node i 42/42 prób Chromium. Pełny interfejs obejmuje pięć wariantów Copilot i jeden Arcee; model, most i Studio są kontrolowane. Sprawdzono też odczyt dwóch publicznych zapisów DOM Copilot. Nie ma dostępu do zalogowanego konta użytkownika, więc zgodność z jego bieżącym DOM pozostaje niepotwierdzona. Wyniki: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md); źródła znaczników: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R25-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r25 powyżej.

---

# PlazCode — rozszerzenie 1.24.32, lokalna poprawka r24

## r24 — potwierdzenie wysłanej wiadomości Copilot

Po ostatnim zrzucie poprawiono odczyt historii rozmowy. Czytnik pomijał wszystkie elementy button/role=button, także jawnie oznaczoną wiadomość będącą kontrolką rozwijania. Taki wpis mógł dać pusty tekst mimo poprawnego wysłania. R24 czyta treść oznaczonych wiadomości, pomijając ich przyciski Copy/menu i metadane; obsługuje również dodatkowe jawne znaczniki treści Copilot.

Jeśli nowy własny wpis zawiera tylko skrócony podgląd, agent może rozwinąć go raz, po sprawdzeniu zgodnego prefiksu co najmniej 80 znaków i przynależności do bieżącej próby. Dopiero pełna zgodność tekstu potwierdza odbiór. Nie ponawia Send. Stary wpis, sam JSON asystenta, obcy podgląd i rozwinięcie bez pełnego tekstu nadal nie potwierdzają wysyłki. Błąd podaje teraz liczbę odczytanych wiadomości i długość pasującego prefiksu, bez treści czatu.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj dodatek i odśwież Copilot. Sprawdź **1.24.32** i raport **core:r24/parser:r13/provider:r24**. Uruchom Start Agent w nowym pustym czacie; wcześniej zachowaj lub wyczyść szkic pozostały po starej próbie. Chrome/Edge: `PlazCode-Extension`, Firefox: `PlazCode-Extension-Firefox`. EXE bez zmian.

**Weryfikacja:** 767/767 testów Node i 39/39 wykonanych prób Chromium. Pełny interfejs przechodzi start i jeden odczyt Studio dla dwóch wariantów historii Copilot oraz dla Arcee. Model i most są kontrolowane; nie przeprowadzono próby na zalogowanym koncie ani w prawdziwym Studio. Przyczynę pustego odczytu odtworzono w kodzie; struktura prywatnego DOM ze zrzutu pozostaje niepotwierdzona. Wyniki: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md); instrukcja: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R24-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r24 powyżej.

---

# PlazCode — rozszerzenie 1.24.31, lokalna poprawka r23

## r23 — dokładna końcówka Copilot U+200B U+200C

Zrzut 1.24.30 ujawnił drugi znak: **U+200C**. R22 obsługiwało inne warianty końcówki po U+200B, ale nie tę parę. R23 dodaje dokładnie ten przypadek do porównania własnego znanego zapisu i echa. Nie usuwa U+200C z dowolnego tekstu, wnętrza kodu ani ze świadomie podanej końcówki źródła.

Test odtwarza na r22 pełny komunikat: **Expected 552 characters, read 554; difference at 552 (end / U+200B U+200C)**. Przypadek sprawdzany jest również po kliknięciu Start Agent z całym zestawem skryptów rozszerzenia i późniejszą komendą get_studio_state. Model i most pozostają kontrolowane; nie jest to próba na zalogowanym koncie.

**Aktualizacja:** zastąp cały folder rozszerzenia, przeładuj dodatek i odśwież Copilot. Sprawdź **1.24.31** i raport **core:r23/parser:r13/provider:r23**. Uruchom Start Agent w nowym pustym czacie, żeby nie pozostał tekst po wcześniejszej próbie. EXE bez zmian. Zmiany zachowania dotyczą wyłącznie tej końcówki Copilot.

**Weryfikacja:** 746/746 testów Node i 38/38 wykonanych prób Chromium. Wyniki: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md); instrukcja: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R23-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r23 powyżej.

---

# PlazCode — rozszerzenie 1.24.30, lokalna poprawka r22

## r22 — niewidoczna końcówka Copilot i start Arcee po odpowiedzi opisowej

Nowy zrzut Copilot wskazuje dokładnie **552 oczekiwane / 554 odczytane znaki, różnica od U+200B na pozycji 552**. Odtworzono ten sam komunikat na r21 w Chromium. R22 porównuje własny znany tekst z prezentacją edytora: dopuszcza wyłącznie krótką końcówkę od U+200B, dodaną za całym niezmienionym źródłem. Nie usuwa znaków z DOM ani z dowolnego szkicu. Znaki niewidoczne celowo podane w treści, także na jej końcu, pozostają częścią źródła. Zwykła edycja użytkownika unieważnia zapamiętany własny zapis. Uwzględniono tę samą końcówkę w potwierdzeniu wiadomości, bez ponownego Send.

Arcee: po jednej nieskutecznej korekcie odpowiedzi opisowej rozszerzenie może pobrać katalog poleceń lokalnie przez list_commands. Jest to rzeczywisty odczyt katalogu, a nie udawane polecenie modelu: nie oznacza się odpowiedzi opisowej jako wykonanej komendy. Start wymaga poprawnego wyniku, świeżego potwierdzenia wybranego silnika, odbioru wszystkich części kontekstu i końcowego potwierdzenia modelu. Odmowa, błędna komenda, błąd mostu i Stop nadal zatrzymują start. Pełny JSON jako jedyny inline code odpowiedzi jest teraz odczytywany; przykłady w opisie i cytaty pozostają wyłączone.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj je i odśwież strony. Wersja **1.24.30**; raport Arcee/Copilot/Motif: **core:r22/parser:r13/provider:r22**. Uruchom Start Agent w nowym pustym czacie; w istniejącym Arcee użyj Restart Agent. Szkic pozostały po starej próbie należy wcześniej zachować lub wyczyścić. EXE bez zmian; jedna aktywna instalacja dodatku.

**Weryfikacja:** 742/742 testy Node i 57/57 prób Chromium, w tym 2 próby pełnego startu i komendy odczytu. Wyniki: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md). Pełny interfejs sprawdzany jest z kontrolowanym modelem i mostem, bez zalogowanych kont ani prawdziwego Studio. Instrukcja: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R22-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r22 powyżej.

---

# PlazCode — rozszerzenie 1.24.29, lokalna poprawka r21

## r21 — Copilot „prepared text changed” i Arcee bez inspekcji

Copilot: po wklejeniu agent czeka do 2 sekund na dokładny tekst i jego stabilność przez 200 ms. Nie wpisuje go ponownie. Odczyt zwykłego contenteditable korzysta z dokumentu, zamiast tekstu zależnego od CSS. Pomija nieedytowalne kontrolki i oznaczony techniczny BR ProseMirror; rzeczywiste znaki, odstępy i nowe linie pozostają dosłowne. Zmiana rozmowy przed wysłaniem nie jest traktowana jak pierwszy zapis rozmowy. Błąd podaje teraz długości i pozycję pierwszej różnicy, bez kopiowania całego źródła.

Arcee i Copilot: pytanie o zawartość obecnego Studio jest prośbą o odczyt. Jeżeli AI tylko oferuje inspekcję, aktywny agent sprawdza połączenie i wysyła najwyżej jedno przypomnienie o rzeczywistym odczycie. Korzysta wyłącznie z dostępnych schematów; list_commands może poprzedzić inspekcję. Ta ścieżka blokuje komendy spoza listy odczytu. Kolejna zapowiedź bez wykonania kończy się widoczną pauzą, bez oznaczenia odczytu jako ukończonego. Odmowa, pytanie o niejednoznaczny cel, zakaz narzędzi, teoria i Stop nie uruchamiają przypomnienia.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj je i odśwież strony. Sprawdź **1.24.29** i raport **core:r21/parser:r13/provider:r21** dla Arcee/Copilot/Motif. Otwórz nowy pusty czat przed Start Agent, aby nie wysyłać szkicu pozostałego po poprzedniej próbie ani używać starego kontekstu startowego. EXE bez zmian; zachowaj jedną instalację dodatku.

**Weryfikacja:** 700/700 testów Node i 43/43 prób Chromium. Wyniki i ograniczenia: [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md). Komunikat Copilot odtworzono na r20 przy opóźnionym wklejeniu do prawdziwego Lexical; poprawiony przepływ przechodzi. Nie obejrzano zalogowanego DOM Copilot i nie ustalono, która różnica źródła wystąpiła na koncie użytkownika. Arcee testowano z tekstem ze zrzutu, rzeczywistą pętlą i kontrolowanymi odpowiedziami modelu/mostu. Szczegóły: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R21-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r21 powyżej.

---

# PlazCode — rozszerzenie 1.24.28, lokalna poprawka r20

## r20 — pierwsze uruchomienie Arcee i potwierdzenie wysyłki Copilot

Arcee: zapis pierwszej rozmowy pod `/playground/<id>` zachowuje rozpoczętą sesję. Wcześniej zmiana adresu mogła przerwać start, dlatego kolejna próba działała już na zapisanym czacie. Przejście między dwoma zapisanymi czatami nadal przerywa bieżącą sesję.

Copilot: potwierdzenie wysłania obsługuje jawne znaczniki wiadomości, wypełnienie wcześniej pustego wiersza i przebudowę DOM. Sprzątanie parametrów logowania lub nadanie wiadomości identyfikatora przez serwer nie oznacza nowej rozmowy. Po potwierdzonym odbiorze agent czyści własny niezmieniony tekst, jeżeli strona pozostawiła go w edytorze. Nie klika ponownie Send; inny szkic pozostaje zachowany. Stara identyczna wiadomość ani sam JSON asystenta nie potwierdzają nowej wysyłki.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj je i odśwież obie strony. Numer **1.24.28**; raport Motif/Arcee/Copilot: **core:r20/parser:r13/provider:r20**. EXE bez zmian. Zachowaj jedną aktywną instalację dodatku.

**Weryfikacja:** 670/670 testów Node i 38/38 prób Chromium. Szczegóły i wyniki w [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md). Nowe testy obejmują pełny start obu adapterów z rzeczywistym watcherem i kontrolowanymi odpowiedziami oraz modelami edytorów React/Lexical. Nie potwierdzono działania na zalogowanych kontach z prawdziwym modelem i Studio. Instrukcja: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `WEBCHATS-R20-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r20 powyżej.

---

# PlazCode — rozszerzenie 1.24.27, lokalna poprawka r19

## r19 — start Copilot i odczyt bloku kodu Arcee

Po kolejnych zrzutach poprawiono dwa odrębne przepływy. Copilot nie zmienia już atrybutów edytora podczas blokady; blokuje ręczne edycje zdarzeniami. Wysyłka czeka na efekt fokusu i akceptuje zastąpienie edytora wyłącznie w tym samym lokalnym kontenerze, przy niezmienionej rozmowie i dokładnej treści. Kontrolowane edytory mogą przyjąć tekst przez własny handler wklejania, bez korzystania ze schowka systemowego. Dla Lexical uwzględniono wewnętrzną selekcję i techniczny końcowy BR; nie usuwa się znaków źródła.

Arcee renderuje bloki w CodeInput/CodeMirror, zamiast zwykłego pre. Odczyt korzysta teraz z pełnego dokumentu CodeMirror, również gdy DOM pokazuje tylko wycinek. Publiczny formatter Arcee dzieli znacznik json na js i linię on. Adapter rozpoznaje wyłącznie ten dokładny artefakt wokół kompletnego obiektu komendy w bloku kodu. Parametry i kod Luau pozostają dosłowne. Pierwsze żądanie i jedna korekta proszą Arcee o JSON bez markdown. Rozumowanie i cytaty pozostają wyłączone z wykonywania komend.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj je i odśwież obie strony. Numer **1.24.27**; raport Motif/Arcee/Copilot: **core:r19/parser:r13/provider:r19**. EXE bez zmian. Używaj jednej aktywnej instalacji dodatku.

**Sprawdzono:** 651/651 testów Node i 32/32 próby Chromium: 15 pełnego interfejsu, 6 prostych edytorów i 11 na rzeczywistych bibliotekach React, Lexical i CodeMirror. Testy startu Arcee obejmują list_commands, jego wynik, kontekst oraz potwierdzenia, także po jednej korekcie. Nie przeprowadzono próby na zalogowanych kontach z rzeczywistym modelem/mostem/Studio. Szczegóły: [ARCEE-COPILOT.md](ARCEE-COPILOT.md), sumy: `WEBCHATS-R19-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r19 powyżej.

---

# PlazCode — rozszerzenie 1.24.26, lokalna poprawka r18

## r18 — Copilot rozpoznawany dopiero po ręcznym wpisaniu tekstu

Użytkownik potwierdził, że na copilot.com/chat rozpoznanie działa dopiero po wpisaniu dowolnego tekstu. R17 uzależniało znalezienie pola poza formularzem od przycisku Send, który Copilot może montować dopiero dla niepustej wiadomości. R18 rozpoznaje puste pole po etykiecie wiadomości/Copilot lub jako jedyny edytor w głównej części /chat. Agent wpisuje wiadomość i dopiero potem czeka na aktywny, lokalny przycisk. Dodano polskie etykiety Wyślij/Prześlij i Zatrzymaj/Przerwij. Brak przycisku po wpisaniu nadal kończy próbę bez kliknięcia innych kontrolek i bez ponowienia.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj je i odśwież Copilot. Wersja **1.24.26**; raport nowych adapterów i Motif: **core:r18/parser:r13/provider:r18**. Nie trzeba wpisywać znaku przed Start Agent. EXE bez zmian; wcześniejsze poprawki Luau, Motif i położenia paska są zachowane.

**Weryfikacja:** 631/631 testów Node, 6/6 prób edytora i 15/15 prób pełnego interfejsu Chromium. Nowe testy odtwarzają puste pole, domontowanie polskiego Send po wpisaniu i jego zniknięcie po wysłaniu. Na r17 nie przechodziło 5 z 21 testów kompozytora; r18 przechodzi wszystkie. Testy są kontrolowane, bez zalogowanej rozmowy z prawdziwym modelem/mostem. W tej sesji odczyt /chat ponownie blokował CONNECT 403. Szczegóły: [ARCEE-COPILOT.md](ARCEE-COPILOT.md); sumy: `COPILOT-R18-SHA256SUMS.txt`.

Poniżej historia; do aktualizacji obowiązuje r18 powyżej.

---

# PlazCode — rozszerzenie 1.24.25, lokalna poprawka r17

## r17 — pasek zasłaniający pole i brak wykrywania Arcee/Copilot

Po zrzutach poprawiono wykrywanie rzeczywistego pola Arcee poza formularzem oraz lokalnych edytorów bez formularza i roli textbox. Pasek znajduje się nad rozpoznanym polem. Gdy pola nie rozpoznano, pasek przechodzi na górę okna, zamiast zakrywać dolny czat. Dopasowuje szerokość do wąskiego okna. Pisanie, kliknięcie Send i Enter bez uruchamiania agenta pozostają dostępne.

**Aktualizacja:** podmień cały folder rozszerzenia, przeładuj je i odśwież kartę serwisu. Wersja **1.24.25**; raport Motif/Arcee/Copilot: **core:r17/parser:r13/provider:r17**. Używaj jednej instalacji dodatku. EXE bez zmian. Poprawki Luau i Motif są zachowane.

**Weryfikacja:** 625/625 testów Node, 6/6 prób edytora i 12/12 prób pełnego interfejsu PlazCode w Chromium, w tym przycisk i Enter przy wyłączonym agencie, niewykryte pole oraz widoki odpowiadające zrzutom. Odczytano publiczny kod Arcee; Copilot publicznie pokazuje stronę logowania. Nie testowano zalogowanych rozmów z prawdziwym modelem i mostem. Integracje nadal są eksperymentalne. Szczegóły: [ARCEE-COPILOT.md](ARCEE-COPILOT.md), sumy: `COMPOSER-R17-SHA256SUMS.txt`.

Poniżej historia wcześniejszych wersji; do aktualizacji obowiązuje r17 powyżej.

---

# PlazCode — rozszerzenie 1.24.24, lokalna poprawka r16

## r16 — eksperymentalne Arcee i copilot.com

Dodano rejestrację **https://platform.arcee.ai/** oraz dokładnie **https://copilot.com/** w menu, popupie, obsłudze kart i paczkach Chrome/Firefox. Nowe adaptery obsługują tekst, wymagają jednoznacznego pola rozmowy, jawnych ról wiadomości oraz potwierdzenia wysłania przez nową wiadomość użytkownika. Nie klikają ponownie po niepewnym wysłaniu, nie nadpisują szkicu i nie ucinają kodu. Kontekst startowy jest przesyłany w potwierdzanych częściach. Edytor contenteditable zachowuje puste linie i Unicode; treść jest sprawdzana przed kliknięciem.

**Stan: eksperymentalny.** Sieć środowiska zwracała CONNECT 403 dla obu adresów. Selektory nowych stron są umową opartą na semantycznych atrybutach DOM, nie wynikiem oględzin zalogowanych stron. Testy na stronach syntetycznych nie potwierdzają zgodności z aktualnym interfejsem Arcee ani copilot.com. Nie dodano copilot.microsoft.com. Szczegóły i sposób uruchomienia: [ARCEE-COPILOT.md](ARCEE-COPILOT.md).

**Aktualizacja:** zastąp cały folder rozszerzenia paczką z tej gałęzi, przeładuj rozszerzenie i odśwież stronę. Zachowaj jedną aktywną instalację. W Chrome/Edge użyj `PlazCode-Extension`, w Firefox `PlazCode-Extension-Firefox`. Numer rozszerzenia: **1.24.24**; raport nowych adapterów i Motif: **core:r16/parser:r13/provider:r16**. EXE pozostaje w wersji 1.24.20. Poprawki Luau i Motif z r13–r15 są zachowane. Bieżące sumy: `WEBCHATS-R16-SHA256SUMS.txt`.

---

# PlazCode — rozszerzenie 1.24.23, lokalna poprawka r15

Lokalna poprawka r15 z 22 października 2026, na bazie paczki PlazCode 1.24.20 i wcześniejszych poprawek. To wersja do dalszej weryfikacji, nie oficjalne wydanie PlazCode. Rozszerzenie ma numer 1.24.23; aplikacja desktopowa pozostaje w wersji 1.24.20.

## r15 — Motif czekający na wynik, który już wrócił

Nowy zrzut kończy się tekstem „Czekam na wynik odczytu BuildSolarisHud…” po kilku zakończonych komendach i zwróconym wyniku `get_studio_state`. R14 wykluczało każdą odpowiedź zawierającą „czekam” z kontynuacji, także gdy model czekał na wynik narzędzia zamiast na użytkownika. W r15 te dwa przypadki są rozróżniane.

Jeśli w aktywnym zadaniu Motif czeka na wynik narzędzia, PlazCode przypomina maksymalnie trzy ostatnie rzeczywiste wyniki z tej pętli. Zapisuje je dopiero po potwierdzonym wysłaniu. Nie wykonuje ponownie komend ani nie wymyśla brakującego odczytu. Model może użyć otrzymanych danych albo wysłać nową komendę, jeśli potrzebuje odczytu innego skryptu. Limit dwóch prób dotyczy teraz kolejnych odpowiedzi bez postępu; poprawna komenda i potwierdzone dostarczenie jej wyniku odnawiają limit. Zmiana zadania przez kolejkę czyści kontekst przypominanych wyników.

Pytania, oczekiwanie na dane lub zgodę użytkownika, odmowy, Stop i niepewny błąd narzędzia nadal nie uruchamiają tej kontynuacji. Dwie kolejne nieskuteczne próby kończą się pauzą z komunikatem. Rzeczywiste asynchroniczne zadanie zwracające identyfikator wymaga sprawdzenia jego udokumentowanego statusu; przypomnienie nie oznacza, że takie zadanie zakończyło się sukcesem.

**Aktualizacja z r14:** podmień `core/main.js`, `providers/webchats.js` i `manifest.json` w używanym folderze rozszerzenia plikami z bieżącej wersji repozytorium. Kopie w katalogu głównym, `PlazCode-Extension` i `PlazCode-Extension-Firefox` są zgodne. Przeładuj rozszerzenie, odśwież Motif i uruchom ponownie zadanie z paska PlazCode. Numer rozszerzenia: **1.24.23**. Raport Motif: **`core:r15/parser:r13/provider:r15`**. EXE nie wymaga wymiany.

**Weryfikacja:** 552/552 testy, bez błędów i pominięć. Zestaw Motif ma 42 przypadki; na r14 przechodziły 34, a 8 nie przechodziło. Odtworzono tekst ze zrzutu, przypomnienie wcześniejszego odczytu po sprawdzeniu obiektu i stanu Studio, odnawianie limitu po postępie oraz ograniczenie kontekstu do trzech wyników i bieżącego zadania. Są to testy kontrolowanego DOM, modelu i mostu, nie test zalogowanego Motif ani rzeczywistego Studio. Bieżące sumy kontrolne: `MOTIF-R15-SHA256SUMS.txt`.

## r14 — Motif kontynuuje po wyniku narzędzia

Na zrzucie `search_game_tree` zwraca wynik, ale dalszy krok nie następuje. Analiza i testy odtworzyły kilka sposobów przerwania pętli:

- Tekst ze zrzutu „To ja błędnie stwierdziłem, że nie mam dostępu. Wysłałem polecenie…” był rozpoznawany jako bieżąca odmowa. Adapter rozróżnia teraz wycofaną wcześniejszą wypowiedź od aktualnej odmowy. Rzeczywista odmowa, także po takim sprostowaniu, nadal zatrzymuje wykonywanie.
- Motif może rozdzielić odpowiedź na kilka sekcji `.prose`. PlazCode odczytuje wszystkie główne sekcje w kolejności, z pominięciem własnego interfejsu i obszarów rozumowania. Komenda w drugiej sekcji nie znika z odpowiedzi czytanej przez pętlę.
- Przebudowanie starej odpowiedzi podczas oczekiwania na nową mogło spowodować zatrzymanie lub odczyt starej komendy jako nowej. Motif używa teraz natywnego identyfikatora wiadomości, a gdy go brakuje — potwierdzenia pojawienia się nowej odpowiedzi przez licznik. Sam nowy węzeł DOM lub późno nadany identyfikator nie wystarcza. Przy braku nowej odpowiedzi stara komenda nie jest wykonywana ponownie.
- Po udanym wyniku narzędzia model czasem kończy na zapowiedzi typu „Zacznę od odnalezienia pojazdu…”, bez kolejnej komendy. W aktywnym zadaniu projektowym Motif dostaje wtedy prośbę o następny krok. Limit wynosi dwie prośby na zadanie; powtarzane zapowiedzi kończą się widocznym komunikatem i pauzą, zamiast oznaczenia zadania jako ukończonego. Końcowa odpowiedź, pytanie do użytkownika, odmowa, Stop i szybkie pytania nie uruchamiają tej kontynuacji.

**Aktualizacja z r13:** zastąp `core/main.js`, `providers/webchats.js` i `manifest.json` w używanym folderze rozszerzenia odpowiadającymi im plikami z tej paczki. Paczka zbiorcza r14 zawiera także wszystkie pliki poprawki Luau r13 i kopie w trzech katalogach. Rozpakuj ją do głównego folderu istniejącej instalacji PlazCode. Przeładuj dodatek i odśwież kartę Motif. Nie trzeba wymieniać EXE. Dla Motif oczekiwany raport transportu to **`core:r14/parser:r13/provider:r14`**, a numer rozszerzenia to **1.24.22**.

**Weryfikacja:** 535/535 testów, bez błędów i pominięć. Nowy zestaw `tests/motif-continuation.test.cjs` ma 25 przypadków; na kodzie r13 przechodziło 14, a 11 nie przechodziło. Testy rzeczywistej pętli sprawdzają wysłanie wyniku, odpowiedź modelu, ograniczoną kontynuację i następną komendę oraz brak powtórzenia już wykonanego polecenia. Model i most są kontrolowane; nie wykonano testu na zalogowanym Motif ani w aktywnym Roblox Studio. Szczegóły: `TESTY-TRZY-SERWISY.md`.

Poniżej zachowano historię starszych poprawek. Dla bieżącej paczki obowiązuje instrukcja r15 powyżej.

## r13 — zachowanie całego kodu Luau i aktualnej komendy

Analiza kodu i nowe testy odtworzyły pięć problemów:

- Gdy jeden blok `<pre>` zawierał kilka elementów `<code>`, czytnik brał tylko pierwszy. Fragment kończący się w środku `Instance.new` gubił dalszy kod i zamknięcie komendy. Poprawiono odczyt DeepSeek, ChatGPT, Claude oraz wspólnego adaptera Motif/ChatWave/Tencent.
- Znaczniki `###MCP_TOOL###` zapisane w napisie lub komentarzu surowego Luau mogły zastąpić właściwą komendę albo zgubić ją w serii ramek MCP. Parser respektuje teraz granice otaczającego bloku Luau, również nieukończonego.
- Starsza, poprawnie odczytana komenda z pamięci mogła zastąpić aktualną odpowiedź z innym albo jeszcze nieukończonym kodem. Pamięć nie zastępuje teraz widocznej komendy.
- Przy zaniku sygnału generowania DeepSeek otwarta komenda mogła zostać uznana za uciętą już po 15 sekundach ciszy. Ten osobny limit bezczynności wynosi teraz 60 sekund. Postęp źródła resetuje licznik, a Stop nadal przerywa oczekiwanie. Prawdziwie niepełny kod nadal jest odrzucany; poprawka nie dopisuje brakującego źródła ani cudzysłowów.
- Kod powyżej 18 000 znaków jest przesyłany fragmentami. Jeśli fragment kończył się na `]`, `]=` lub podobnym początku znacznika, opakowanie napisu Luau mogło zamknąć się za wcześnie. Dobór znacznika uwzględnia teraz także tę granicę, zachowując końcowe znaki fragmentu.

**Aktualizacja:** zatrzymaj zadanie PlazCode. Z tej wersji repozytorium skopiuj `manifest.json`, `core/main.js`, `core/parser.js` oraz `providers/deepseek.js`, `providers/chatgpt.js`, `providers/claude.js`, `providers/webchats.js` do odpowiadających im ścieżek w używanej instalacji. Repozytorium zawiera zsynchronizowane kopie w katalogu głównym, `PlazCode-Extension` i `PlazCode-Extension-Firefox`. Zachowaj jedną aktywną instalację dodatku. Przeładuj dodatek w panelu rozszerzeń, a następnie odśwież kartę DeepSeek lub innego serwisu. Nie trzeba podmieniać pliku EXE. W Settings → raport transportu oczekuj **`core:r13/parser:r13/provider:r13`** dla wymienionych adapterów i wersji rozszerzenia **1.24.21**.

**Weryfikacja:** 510/510 testów, bez błędów i pominięć. Nowy zestaw `tests/luau-source-integrity.test.cjs` ma 26 przypadków; na niezmienionym kodzie r12 przechodził 1, a 25 nie przechodziło. Są to testy rzeczywistych czytników, parsera, watchera, walidatora i dispatchera na kontrolowanym DOM oraz symulowanym moście. Nie są potwierdzeniem uruchomienia tej wersji na zalogowanym koncie DeepSeek ani w aktywnym Roblox Studio. Szczegóły: `TESTY-TRZY-SERWISY.md`.

## r12 — status bez pytania AI i kopiowanie odrzuconego źródła

Przesłany zapis zawiera udany wynik `PlayerGui=true Interface=true`, etykiety kart oraz późniejszy błąd odczytu, ale nie zawiera źródła odrzuconej komendy. Sama etykieta `execute_luau` nie pozwala odtworzyć cudzysłowów ani znaczników. Stary tekst komunikatu błędu może pochodzić z historii lub nadal wczytanej starszej konfiguracji; nie ustala wersji aktywnego rozszerzenia.

Znaleziono i poprawiono dwie konkretne niespójności:

- `plazcode_status` miał lokalną obsługę i opis tekstowy, ale brakowało mu pełnego wpisu ze schematem w `toolList`. Teraz znajduje się na początku katalogu, również po jego odczycie z pamięci. Schemat przyjmuje `{}`. To lokalne narzędzie rozszerzenia, które nie wymaga obsługi w Studio. Sprawdzono rzeczywisty `runTool` przy odłączonym Studio i katalogu bez tej nazwy: status wraca bez wywołania mostu.
- Przy włączonym `SHOW_APPROACH` dopisek po wyniku nadal nakazywał używanie znaczników zamiast JSON, mimo obsługi obu formatów w r11. Teraz dopisek zachowuje wybrany poprawny format. Nie wymusza przełączania sposobu przesyłania kodu.

### Jak odczytać wersję i błąd po aktualizacji

1. Zatrzymaj agenta, podmień odpowiedni folder rozszerzenia z paczki, przeładuj dodatek i odśwież czat przez F5. Jeżeli aplikacja używa głównego folderu PlazCode, podmień także jego `core` i `overlay.css`. Zachowaj jedną aktywną kopię rozszerzenia.
2. Otwórz **Settings → Transport diagnostics → Copy transport report** w pasku PlazCode. Raport powstaje lokalnie, bez pytania DeepSeek i bez komend Studio. Widać go również w ustawieniach, gdy przeglądarka odmawia zapisu do schowka.
3. Oczekiwane wersje dla DeepSeek, ChatGPT/Work, Claude, Motif, ChatWave i Tencent: **`core:r12/parser:r11/provider:r11`**. Parser i adaptery nie były zmieniane w r12. Te wartości pojawiają się także w nowych dopiskach `SYSTEM_STATE`.
4. Przy kolejnym błędzie kliknij **Copy text** na czerwonej karcie komendy. Kopiuje dokładny tekst odrzucony przez parser, wraz z istniejącymi znacznikami. Nie kopiuj samej etykiety karty ani osobnej karty wyniku. Przy odmowie dostępu do schowka karta otworzy tekst do ręcznego skopiowania.

Karta zachowuje źródło także po odbudowaniu jej interfejsu. Zmiana kodu na inny o tej samej długości odświeża teraz treść i przycisk kopiowania. Również ostatnia nieudana próba, po której automat się zatrzymuje, ma źródło do skopiowania. Surowe źródło nie jest dodawane do automatycznego raportu diagnostycznego ani wysyłane osobno; kopiowanie odbywa się po kliknięciu użytkownika. R12 nie odtwarza kodu, którego nie ma w wcześniej skopiowanym tekście rozmowy.

**Weryfikacja:** 484/484 testy, w tym 17 nowych; na plikach r11 nowy zestaw miał 2 zaliczone i 15 nieudanych przypadków. Testy obejmują katalog, rzeczywisty lokalny dispatcher, dopisek Show approach, kopiowanie dokładnego tekstu, odmowę schowka, odbudowę karty i wersje w ustawieniach. To testy lokalne na kontrolowanym DOM i z symulowanym mostem; nie uruchamiano tej paczki w aktywnej sesji Studio użytkownika. Wyniki: `tests/regression-results-r12.txt`.

Zmieniono `core/main.js`, `core/config.js` i `overlay.css` w trzech folderach. EXE i poprawki parsera z r11 pozostają bez zmian. Nowy status i raport nie uruchamiają ponownie wykonanej komendy GUI.

## r11 — granice komend Luau i odczyt podczas generowania

Usunięto odtworzone błędy, których nie obejmowały wcześniejsze testy:

- Watcher porównywał tekst po zwinięciu białych znaków, a adaptery usuwały je z końca odczytu. Dopisywanie spacji lub nowych linii wewnątrz kodu mogło więc wyglądać jak zatrzymany strumień i kończyć się fałszywym komunikatem o uciętej komendzie. Adaptery przekazują teraz również literalny odczyt do śledzenia postępu. Licznik bezczynności i chwila zakończenia uwzględniają rzeczywiste zmiany źródła.
- Niedomknięty przykład obiektu JSON w opisie przed fenced blokiem Luau blokował poprawny kod poniżej. Stan tego przykładu nie przenosi się już przez granicę bloku. Znaczniki wewnątrz niedomkniętej wartości tekstowej JSON nadal nie są wykonywane.
- `###END_LUA###` wewnątrz wielowierszowego napisu lub komentarza Luau ucinał źródło. Parser rozpoznaje napisy, escapowane znaki, komentarze i długie nawiasy, zanim uzna znacznik za koniec polecenia.
- Motif, ChatWave i Tencent miały dodatkowy filtr odrzucający poprawne `###LUA:Edit###` i warianty odstępów akceptowane przez parser. Niedokończony surowy blok mógł też kończyć turę jako zwykły tekst. Ujednolicono rozpoznawanie tych przypadków.

Oba dotychczasowe formaty pozostają obsługiwane: poprawny JSON `execute_luau` oraz literalny blok `###LUA###`. Instrukcje i komunikaty nie zakazują już poprawnego JSON. W formacie ze znacznikami kod zapisuje się dosłownie; w JSON stosuje się zwykłe escapowanie JSON. Nie usuwa się cudzysłowów, nawiasów, kropek ani wywołań funkcji.

**Aktualizacja:** zatrzymaj agenta, zastąp odpowiedni folder `PlazCode-Extension` lub `PlazCode-Extension-Firefox` z tej paczki i przeładuj rozszerzenie. Jeżeli aplikacja korzysta z głównego folderu PlazCode, zastąp również jego `core` i `providers`. Zachowaj jedną aktywną kopię dodatku. Odśwież otwarte czaty przez F5. Nowe instrukcje startowe zostaną wysłane przy nowym uruchomieniu sesji.

W `plazcode_status` trzy wartości `transport_build` powinny wynosić `r11` dla DeepSeek, ChatGPT/Work, Claude, Motif, ChatWave i Tencent. Pole `last_parse_failure` jest puste albo zawiera metadane ostatniego błędu: format, długość, stan domknięcia i wersje. Nowy wpis diagnostyczny `tool.parseFailure` nie zawiera źródła Luau ani treści rozmowy.

**Weryfikacja:** 467/467 testów, w tym 57 nowych. Nowy zestaw na plikach r10 miał 8 zaliczonych i 49 nieudanych przypadków. Sprawdzono rzeczywiste adaptery, parser, watcher, walidator i wysyłkę przez `runTool` z kontrolowanym mostem. Obejmuje to `Instance.new`, `UDim2.fromOffset`, `Color3.fromRGB`, krótki i długi kod oraz kontrolne `multi_edit` i `get_studio_state`. Nie potwierdza to wykonania kodu w Twojej sesji Studio. Nie zmieniono EXE, 15-sekundowego odstępu DeepSeek ani zatrzymywania po limicie serwisu.

Pełny zakres: `TESTY-TRZY-SERWISY.md`. Wynik testów: `tests/regression-results-r11.txt`.

## r10 — inne AI, w tym ChatGPT i ChatGPT Work

Rozszerzono sprawdzanie na adaptery ChatGPT, ChatGPT Work, Claude, Motif, ChatWave i Tencent; DeepSeek r9 jest punktem porównania. Nowy zestaw obejmuje Copy przed i po kodzie, opisy, linki, `<br>`, akapity, wielokrotne puste linie wewnątrz napisu Luau, CodeMirror oraz zmianę renderowania tej samej komendy. Poprzednie testy długiego kodu nie obejmowały wszystkich tych wariantów HTML.

Poprawiono odczyt kontrolek Copy w ChatGPT/Work, zwijanie pustych linii u Claude i gubienie pustych akapitów w pozostałych badanych adapterach. Właściwe źródło kodu ma pierwszeństwo przed tekstem jego kontrolek. Zachowano odczyt pełnego dokumentu CodeMirror w ChatGPT, aby częściowo widoczny DOM nie zastępował całego kodu. Wcięcia, puste linie i literalna treść kodu pozostają bez zmian.

**Weryfikacja:** 410/410 testów przeszło, w tym 110 nowych porównań między adapterami. Ten sam zestaw na providerach r9 miał 37 nieudanych przypadków. To kontrolowane testy DOM i wcześniejsze symulacje mostu. Test ChatGPT Work sprawdza adapter interfejsu; nie oznacza uruchomienia dodatku wewnątrz tej rozmowy ani połączenia tej rozmowy ze Studio.

**Aktualizacja z r9:** zatrzymaj agenta. Podmień `providers/chatgpt.js`, `providers/claude.js` i `providers/webchats.js` w głównym folderze PlazCode, w `PlazCode-Extension` i w `PlazCode-Extension-Firefox` — łącznie 9 plików. Przeładuj rozszerzenie i odśwież czaty (F5). Przy starszej instalacji skopiuj całe odpowiednie foldery rozszerzenia oraz główne foldery `core` i `providers` z tej paczki.

W `plazcode_status` zmienione adaptery mają `transport_build.provider: "r10"`; rdzeń i parser pozostają `r9`, ponieważ nie zmieniano ich w tej aktualizacji. DeepSeek nadal pokazuje trzy wartości `r9` i zachowuje odstęp 15 sekund. Pliku EXE nie zmieniono. Szczegółowe wyniki i ograniczenia: `TESTY-TRZY-SERWISY.md`.

## r9 — poprawna komenda odrzucana po renderowaniu DeepSeek

W r8 brakowało obsługi nagłówka języka/Copy i granic akapitów w odczycie DeepSeek. Adapter pobierał całe `textContent`: nagłówek `luaCopy` mógł zlepić się ze znacznikiem początku, a `<p>` i `<br>` nie dawały nowych linii. To pozwalało odtworzyć odrzucanie identycznego krótkiego kodu po zmianie sposobu renderowania. Nowe testy wykorzystują wprost `Instance.new("TextLabel")`, `UDim2.fromOffset` i `Enum.TextXAlignment`; znaki te nie wymagają specjalnego usuwania lub zastępowania.

r9 odczytuje literalną treść kodu, pomija nagłówki, przyciski Copy, numery wierszy i własne panele PlazCode, zachowuje granice akapitów, `<br>`, wiersze podświetlania, wcięcia i puste linie. Ten sam odczyt służy do parsowania, rozpoznawania wiadomości i śledzenia strumienia. Ukryty przez PlazCode oryginalny blok nadal jest czytany; jego treść nie jest zastępowana tekstem przycisków.

Parser pomija wzmiankę o `###LUA###` w zdaniu przed właściwym blokiem. Zakończony przykład JSON w opisie też nie blokuje właściwego Luau. Jednocześnie znaczniki wewnątrz niedokończonego JSON nie są wykonywane jako zastępczy blok. **Obsługiwane są oba formaty:** poprawny JSON `execute_luau` oraz surowy blok Luau. Preferowany format do pisania kodu pozostaje jeden fenced blok z `###LUA###` i `###END_LUA###` w osobnych liniach. W tym formacie kod wpisuje się dosłownie, bez koperty JSON i bez ręcznego escapowania.

**UIBlox:** ostrzeżenie „LUMBERYAK INTERNAL: Too many arguments given for format string” nie staje się celem automatycznej naprawy. W r8 późniejsza ramka wywołującego skryptu projektu mogła przeważyć nad źródłem błędu CorePackages. r9 rozpoznaje wiadomość źródłową i pierwszą ramkę stosu; sam cytat ścieżki w treści nie ustala pochodzenia. Błąd faktycznie wskazujący projektowy skrypt nadal jest zgłaszany, również przy tej samej treści o formatowaniu napisu.

**Aktualizacja z r8:** zatrzymaj agenta. Podmień `core/main.js`, `core/parser.js` i `providers/deepseek.js` w głównym folderze PlazCode, w `PlazCode-Extension` i w `PlazCode-Extension-Firefox` — łącznie 9 plików. Przeładuj rozszerzenie i odśwież czaty (F5). Przy starszej lub niepewnej instalacji skopiuj całe odpowiednie foldery rozszerzenia oraz główne foldery `core` i `providers` z tej paczki. Zachowaj jedną aktywną kopię dodatku.

Po odświeżeniu wynik `plazcode_status` w DeepSeek zawiera `transport_build` z `core`, `parser` i `provider` równymi `r9`. Brak pola lub `unknown` oznacza, że nie wczytano wszystkich nowych części. Nie trzeba ponawiać wykonanych zmian w Studio, żeby sprawdzić status. Odstęp DeepSeek minimum 15 sekund i zatrzymanie po limicie z r8 pozostają aktywne.

**Weryfikacja:** 300/300 testów przeszło, w tym 35 nowych. Spośród pierwszych 28 przypadków regresyjnych 21 nie przechodziło przed zmianą. Nowe przypadki obejmują również rzeczywisty watcher odpowiedzi, zmianę renderowania tej samej wiadomości i dokładny tekst zgłoszenia UIBlox. To kontrolowane warianty DOM i odpowiedzi mostu. Testowa przeglądarka DeepSeek wymaga logowania; nie sprawdzono Twojej aktywnej rozmowy ani rzeczywistego Studio. Raport: `TESTY-TRZY-SERWISY.md`.

## r8 — komendy, debugger, wyniki i odstęp DeepSeek

Sprawdzono zgłoszenie o ucinaniu JSON/Luau, fałszywych alarmach UIBlox oraz brakujących wynikach. Nie znaleziono limitu kilkunastu linii w parserze rozszerzenia. Przed zmianą odtworzono konkretne błędy: poprawny JSON z `command` po długiej liście edycji nie był odczytywany, przykład JSON wewnątrz surowego Luau mógł zostać uznany za osobną komendę, a znaczniki w napisach lub JSON wewnątrz koperty MCP mogły zmieniać odczyt kodu.

- Parser rozpoznaje właściwy zewnętrzny obiekt niezależnie od kolejności pól i pomija nawiasy wewnątrz napisów oraz zakończone obiekty edycji. Surowy blok `###LUA###` jest odczytywany dosłownie, z zachowaniem wcięć, cudzysłowów i nowych linii. Taki format już wcześniej był przewidziany w protokole; poprawiono również komunikat ponownego przesłania `execute_luau`, aby nie sugerował kolejnej koperty JSON.
- Przy niedomkniętej komendzie chwilowy zanik wskaźnika generowania nie kończy już odczytu po kilku sekundach. Bez potwierdzenia zakończenia z natywnego interfejsu parser czeka do 15 sekund bez zmian tekstu. Trwające generowanie nadal utrzymuje oczekiwanie, a rzeczywiście niekompletna odpowiedź kończy się błędem bez wykonania uciętego kodu.
- Automatyczny debugger i automatyczna naprawa playtestu wymagają wskazania skryptu projektu. Same ostrzeżenia, rozpoznane logi wewnętrznych pakietów Roblox oraz błędy bez ustalonego pochodzenia nie uruchamiają naprawy. Pełne logi nadal można odczytać ręcznie. Usunięto dodatkowe obcinanie pojedynczych wpisów do 240 znaków i wyniku `plazcode_debug` do 4000 znaków.
- Długi wynik nie jest odrzucany: pozostaje w pamięci bieżącej karty do odczytu przez `plazcode_result_read`. Testy składają go z powrotem znak w znak. To stronicowanie służy zmieszczeniu wiadomości w limicie i nie wymaga ponawiania oryginalnej komendy. DeepSeek zachowuje stronę do 32 000 znaków także po wyłączeniu ustawionych limitów. Zbyt duży bezpośredni szkic jest odrzucany przed zmianą treści pola, zamiast obcinany.
- **Tylko DeepSeek:** automatyczne wiadomości mają minimum **15 sekund odstępu**, również podczas startu, przekazywania wyników i odczytu ich kolejnych stron. Większa wartość `Seconds between commands` jest respektowana. Odstęp jest liczony także od wiadomości użytkownika i zakończenia rzeczywistej wysyłki przez rozszerzenie. Komunikat limitu serwisu nadal zatrzymuje zadanie bez automatycznych ponowień. Nie jest to gwarancja zniesienia limitu serwera lub konta.

**Aktualizacja z r7:** zatrzymaj agenta. Podmień `core/main.js`, `core/parser.js`, `core/config.js` oraz `providers/deepseek.js` w głównym folderze PlazCode, w `PlazCode-Extension` i w `PlazCode-Extension-Firefox` — łącznie 12 plików. Następnie przeładuj rozszerzenie i odśwież otwarte czaty (F5). Przy starszej instalacji skopiuj całe odpowiednie foldery rozszerzenia oraz główne foldery `core` i `providers` z paczki, aby zachować wcześniejsze poprawki. Pliku EXE ani ustawień Windows nie trzeba podmieniać. Przed kontynuacją po limicie DeepSeek sprawdź ostatni wynik i stan projektu, aby nie powtórzyć wykonanych zmian.

**Weryfikacja:** 265/265 testów automatycznych przeszło, w tym 68 nowych. Testowano rzeczywiste adaptery DeepSeek, ChatGPT, Claude, Motif, ChatWave i Tencent, wspólny parser, klienta ChatWave API oraz ścieżki odczytu odpowiedzi i debuggera. Kod testowy ma ponad 320 linii i zawiera cudzysłowy, apostrofy, nawiasy, backslashe oraz Unicode. To kontrolowane testy DOM, zegara i odpowiedzi mostu; nie wykonano r8 na żywo z kontami tych serwisów ani z Twoim Studio. Szczegóły i ograniczenia: `TESTY-TRZY-SERWISY.md`.

## r7 — widoczność odpowiedzi Motif

Zgłoszony zrzut przedstawia Motif 3 High. Podsumowanie PlazCode „Worked for…” było wstawiane do poziomego wiersza wiadomości obok odpowiedzi. Jego szerokość 100% zabierała miejsce elastycznemu kontenerowi tekstu. W r7 podsumowanie jest osobnym elementem pionowej listy, nad całym wierszem odpowiedzi. Zwijanie podsumowania nie modyfikuje ani nie ukrywa natywnej treści Motif. Jeżeli adapter nie rozpozna listy wiadomości, pozostawia odpowiedź bez podsumowania.

**Aktualizacja z r6:** zatrzymaj bieżące zadanie i podmień `providers/webchats.js` w głównym folderze PlazCode oraz w folderach `PlazCode-Extension` i `PlazCode-Extension-Firefox` — łącznie 3 pliki. Przeładuj dodatek, potem odśwież stronę Motif (F5). Nie trzeba ponawiać wykonanych poleceń, aby zobaczyć wcześniejsze odpowiedzi. Przy aktualizacji ze starszej wersji skopiuj cały odpowiedni folder rozszerzenia z tej paczki, aby zachować także nowe pliki r6. Plik EXE pozostaje bez zmian.

**Weryfikacja:** 197/197 testów automatycznych przeszło. Pięć nowych testów sprawdza rzeczywisty renderer podsumowania, układ z aktualnego DOM Motif, zwijanie, zmianę położenia wiersza, wiele odpowiedzi i nierozpoznany układ. Bez poprawki te pięć testów nie przechodziło. Na prawdziwej stronie Motif 3 High sprawdzono też krótką odpowiedź po polsku; była widoczna. Ten test strony wykonano bez rozszerzenia. Nie wykonano testu r7 z zainstalowanym dodatkiem na Twoim komputerze ani z rzeczywistym Studio. Szczegóły: `TESTY-TRZY-SERWISY.md`.

## r6 — ChatWave API z natywnymi wywołaniami narzędzi

Dodano osobną pozycję **ChatWave API** w menu AI paska PlazCode. Korzysta z endpointu opisanego w ChatWave → Settings → Docs, zamiast protokołu polegającego na wypisywaniu JSON w zwykłych odpowiedziach modelu. Ta nowa ścieżka wymaga własnego klucza ChatWave API. Zwykły czat na stronie i nowa karta API to dwa różne sposoby połączenia.

**Stan weryfikacji:** 192/192 testów automatycznych przeszło, w tym 40 testów API i pełnej pętli ze symulowanym modelem/mostem. Bez klucza użytkownika nie wykonano wywołania modelu na prawdziwym API. Dokumentacja na stronie opisuje zgodność z klientami OpenAI, ale nie potwierdza wprost obsługi `tool_calls` dla tego modelu/konta. Nowy klient zatrzyma start, jeśli API odrzuci narzędzia, zwróci odmowę albo tylko zwykły tekst. Nie jest to jeszcze potwierdzenie, że Twoja konfiguracja ChatWave działa ze Studio.

### Aktualizacja do r6 i uruchomienie API

1. Zatrzymaj bieżące zadanie. Rozpakuj ZIP r6.
2. W folderze, z którego masz już wczytane rozszerzenie, skopiuj całą zawartość odpowiedniego folderu `PlazCode-Extension` lub `PlazCode-Extension-Firefox` z tej paczki. Zachowaj ten sam folder instalacji i jedną aktywną kopię dodatku. r6 dodaje nowe pliki — podmiana samych 6 plików z instrukcji r5 nie wystarczy. Pliku EXE ani ustawień aplikacji Windows nie trzeba podmieniać.
3. Przeładuj rozszerzenie, a następnie odśwież stronę z paskiem PlazCode.
4. W menu AI paska PlazCode wybierz **ChatWave API**. Otworzy się lokalna karta rozszerzenia z formularzem.
5. Użyj własnego klucza z ChatWave → Settings → API keys. Wpisz go wyłącznie w polu hasła lokalnej karty rozszerzenia. Nie wysyłaj go w rozmowie z modelem ani tutaj. Klucz pozostaje w pamięci tej karty; odświeżenie lub zamknięcie usuwa go. Nie jest zapisywany na dysku ani przekazywany do mostu Studio.
6. Pobierz modele, wybierz model dostępny dla Twojego klucza i kliknij **Otwórz rozmowę API**. Sama lista modeli nie potwierdza obsługi narzędzi.
7. Uruchom **Start Agent**. Nowa ścieżka wymaga natywnego wywołania `list_commands`, rzeczywistego wyniku z lokalnego mostu i potwierdzenia odebrania wyniku. Błąd połączenia ze Studio nie daje stanu gotowości.

Wiadomości, ustawienia kontekstu i wyniki narzędzi będą wysyłane do ChatWave. Obowiązują limity i zasady Twojego konta API. Obrazów i plików w tej nowej ścieżce nie obsłużono.

Komendy są przyjmowane wyłącznie z natywnego `tool_calls`. Zwykły JSON, cytaty i bloki Luau w treści odpowiedzi nie uruchamiają niczego. Wynik komendy wraca jako wiadomość `tool` z właściwym `tool_call_id`; żadne wykonanie nie jest udawane. Kontrole argumentów, uprawnień i Stop pochodzą z istniejącej pętli PlazCode. Błąd HTTP, niepełne argumenty, wielokrotne komendy lub spóźniona odpowiedź po Stop nie powodują przełączenia na wykonywanie tekstu ani automatycznego ponowienia API.

Jeżeli API zwróci HTTP 400 dotyczące narzędzi, ta konfiguracja nie przyjmuje wymaganego formatu. HTTP 401/403 wymaga sprawdzenia klucza i dostępu do API/modelu. Nie zastępuj tego wielokrotnymi restartami agenta. Szczegóły: `TESTY-TRZY-SERWISY.md`.

## r5 — DeepSeek: limit wiadomości i identyfikacja odpowiedzi

Ostatnie zgłoszenie dotyczy DeepSeek; użytkownik potwierdził, że ChatGPT działa prawidłowo. Adapter ChatGPT pozostaje identyczny z r4. Zrzut DeepSeek pokazuje „Zbyt częste wiadomości. Spróbuj ponownie później” oraz ostrzeżenie PlazCode o braku potwierdzenia bieżącej odpowiedzi. Sam obraz nie pozwala ustalić, czy oba komunikaty mają wspólną przyczynę.

r5 rozpoznaje polski komunikat limitu, również przy pustym polu i aktywnym przycisku wysyłania. Sprawdza go przed zapisem wiadomości, po wysłaniu, podczas oczekiwania na odpowiedź i bezpośrednio przed wykonaniem komendy. Limit zatrzymuje zadanie, odblokowuje pole i blokuje automatyczne wznowienie starej komendy. Nie powoduje automatycznego ponawiania wiadomości. Treść limitu cytowana przez model, użytkownika lub w kodzie nie jest traktowana jak komunikat strony.

Identyfikator odpowiedzi DeepSeek jest odczytywany z najbliższego stabilnego wiersza listy. Dodatkowy kontener i późniejsze nadanie `data-message-id` nie zmieniają tożsamości tego wiersza. Zmiana rozmowy, sesji, wysłanej wiadomości lub wiersza nadal zatrzymuje wykonanie. Brak potwierdzenia tożsamości odpowiedzi blokuje też automatyczne wznowienie zadania.

Wszystkie 152 testy automatyczne przeszły, w tym 29 nowych testów DeepSeek. Są to kontrolowane modele DOM i symulowane odpowiedzi/most; nie potwierdzono odtworzenia problemu w Twojej aktywnej rozmowie ani działania z rzeczywistym Studio. Poprawka nie usuwa limitu po stronie serwisu.

Po aktualizacji zaczekaj, aż DeepSeek ponownie pozwoli wysyłać wiadomości. Przed kontynuacją sprawdź ostatnie komendy i ich wyniki w rozmowie oraz stan projektu w Studio. Nie powtarzaj już wykonanych zmian. W ustawieniach PlazCode jest pole `Seconds between commands (0 = no pause)`; większy odstęp ogranicza częstotliwość wysyłania, ale nie gwarantuje uniknięcia limitu.

## r4 — odmowy modelu, cytaty komend i gotowość

Nowe zrzuty pokazują odmowę uczestniczenia w protokole PlazCode oraz błąd serwisu ChatWave „Unable to reach ChatWave right now.”. Cytat JSON w odmowie został wcześniej rozpoznany jak komenda. Niezakończony start mógł też pozostawić znaczniki, na podstawie których czat uznawano za połączony i wznawiano zwykłą pętlę z dzielonymi wynikami.

r4 odczytuje polecenia z właściwych bloków komend lub samodzielnej odpowiedzi JSON. Pomija cytaty inline, bloki cytowań, kod programistyczny zawierający przykładowe komendy i odmowy modelu. Odpowiedzi modelu pozostają widoczne. Sam znacznik „Starting Up” nie potwierdza połączenia. Przy odmowie start zatrzymuje się bez wykonywania cytowanych komend i bez kolejnych próśb o zmianę decyzji. Błąd serwisu jest wykrywany także przed pojawieniem się odpowiedzi i zwalnia pole wpisywania.

Krótka prośba startowa Motif/ChatWave opisuje faktyczny mechanizm zainstalowanego rozszerzenia i pyta tylko o listę możliwości. Przyjęcie takiego protokołu zależy od modelu. Odmowa lub niedostępność serwisu nadal może uniemożliwić połączenie; r4 pokazuje wtedy brak gotowości. Pełnego działania z rzeczywistym Studio na Twoim komputerze nie potwierdzono.

## Wcześniejsze aktualizacje r1–r5 (dla r6–r10 użyj instrukcji powyżej)

r3 naprawia zgłoszone błędy Start Agent: Motif wymaga wiadomości krótszych niż 50 000 znaków, a ChatWave dopuszcza 16 000. Poprzednie dzielenie listy komend nie obejmowało pierwszego promptu startowego. Ustawienie Ultra mogło przekroczyć limit nawet bez własnych instrukcji.

Teraz pierwsza wiadomość jest krótkim żądaniem listy komend. Pełne instrukcje, ustawienia Ultra, pamięć i preferencje użytkownika przychodzą później w kolejnych potwierdzanych częściach. Każda ma około 10 000 znaków plus krótki nagłówek. Nic nie jest ucinane. Gotowość wymaga odebrania wszystkich części i końcowego potwierdzenia.

Jeżeli masz już zainstalowaną wcześniejszą poprawkę:

1. Zatrzymaj aktywne zadanie agenta.
2. Podmień z tego ZIP-a pliki `providers/webchats.js`, `providers/deepseek.js` i `core/main.js` w trzech miejscach: w głównym folderze PlazCode, w `PlazCode-Extension` oraz w `PlazCode-Extension-Firefox` — łącznie 9 plików. Przy aktualizacji wyłącznie z r4 wystarczy 6 plików: `providers/deepseek.js` i `core/main.js` w tych trzech katalogach.
3. Przeładuj rozszerzenie w `chrome://extensions`, `edge://extensions` lub panelu dodatków Firefox.
4. Odśwież stronę czatu (F5). Dla Motif i ChatWave otwórz nowy czat i uruchom Start Agent, aby rozmowa nie zawierała dawnych części startu ani odmów. Dla DeepSeek poczekaj na ustąpienie limitu i sprawdź ostatni wynik przed kontynuacją istniejącej rozmowy. Restart Agent nadal jest obsługiwany w istniejących rozmowach.

Możesz pozostawić Ultra. Podczas startu zobaczysz kilka wiadomości z potwierdzeniami; poczekaj na końcową gotowość. Dla nowej instalacji obowiązuje instrukcja poniżej.

## Co działa i co sprawdzono

| Serwis | Stan |
| --- | --- |
| Motif — https://chat.motiftech.io/chat | Sprawdzono na prawdziwej stronie wysłanie krótkiej wiadomości i odpowiedź oraz wygenerowanie komendy `list_commands` w JSON. Adapter i parser sprawdzono automatycznie na modelu DOM. Nie sprawdzono pełnej pętli z lokalnym Studio. |
| ChatWave — https://chat.thewave.cv/ | Pola, przyciski, role wiadomości i limit 16 000 znaków odczytano z prawdziwej strony. Próba odpowiedzi skończyła się „Not authenticated”. Dalszy test wymaga zalogowania. Adapter sprawdzono na modelu DOM. |
| Tencent Hy — https://aistudio.tencent.ai/ | Po zalogowaniu sprawdzono odpowiedź tekstową, JSON `list_commands`, wielowierszowy Luau z polskimi znakami i wcięciami, zatrzymanie generowania oraz rozpoczęcie nowego czatu. Rzeczywiste fragmenty HTML odpowiedzi służą do testów adaptera i parsera. Nie sprawdzono pełnej pętli z lokalnym Studio. |

152/152 testy automatyczne przeszły: 29 dla poprawki DeepSeek, 84 dla nowych adapterów i procesu startu oraz 39 wcześniejszych. Testy obejmują rzeczywisty kod startu, odczytu odpowiedzi, wysyłania i pętli agenta, przypadki odmów ze zrzutów, pełne preferencje, Ultra, oba silniki i istniejące rozmowy. Most i odpowiedzi modelu są w tych testach symulowane.

Nowe adaptery obsługują tekst. Przesyłanie obrazów i plików jest wyłączone, ponieważ nie zostało zweryfikowane. Nie jest to potwierdzenie pełnej obsługi wizualnych zadań Roblox. Windows, lokalny most i Roblox Studio nie były uruchamiane w tym środowisku.

Zachowano poprawki r2: rozpoznawanie rzeczywistych ról Tencent, odrzucanie komend z panelu rozumowania, usuwanie wizualnych numerów wierszy i nagłówków kodu, wykrywanie natywnego Stop oraz stabilność identyfikatora czatu podczas nadawania adresu rozmowie.

## Uruchomienie w Chrome lub Edge

1. Rozpakuj ZIP do nowego folderu. Nie przenoś samego `PlazCode.exe` bez pozostałych plików.
2. Uruchom `PlazCode.exe`, aby wystartował lokalny most. Wymagania Roblox/AgentScript są takie same jak w oryginalnej paczce.
3. Otwórz `chrome://extensions` w Chrome lub `edge://extensions` w Edge i włącz tryb programisty.
4. Jeśli używasz już wersji wczytanej z folderu, wskaż poprawiony folder `PlazCode-Extension`. Wczytaj rozszerzenie tylko raz; równoczesne kopie mogą wykonywać tę samą komendę.
5. Po podmianie plików przeładuj rozszerzenie i odśwież stronę czatu (F5).
6. Otwórz wybrany adres w tej przeglądarce, zaloguj się, jeśli serwis tego wymaga, i uruchom agenta z paska PlazCode. Lista serwisów w pasku zawiera nowe adresy.

Zmiana dotyczy plików rozszerzenia, jego menu i komunikacji z mostem. Plik EXE nie został przebudowany. Lista serwisów wbudowana w okno natywnej aplikacji może wymagać osobnej zmiany w pełnym źródle aplikacji; do testu użyj strony w Chrome/Edge z wczytanym rozszerzeniem.

## Firefox

W `about:debugging#/runtime/this-firefox` wybierz tymczasowe wczytanie dodatku i wskaż `PlazCode-Extension-Firefox/manifest.json`. Ta lokalna wersja dodatku nie jest podpisana. Uwzględniono istniejące mechanizmy przekazywania zdarzeń Firefoksa, ale przeglądarki Firefox nie testowano na żywo.

## Krótki test na Twoim komputerze

1. Otwórz pusty czat i uruchom Start Agent. Sprawdź, czy rzeczywiście uzyskuje stan gotowości.
2. Poproś o odczyt stanu projektu lub listę komend. Porównaj wynik ze stanem Studio.
3. Sprawdź wysłanie kolejnej wiadomości, Stop i rozpoczęcie nowego czatu.
4. Przed testowaniem zmian w grze zapisz projekt. Ta paczka nie zawiera potwierdzenia testu mostu ani operacji Studio na Twoim komputerze.

Jeśli któraś strona zmieni interfejs, może być potrzebne ponowne dostosowanie adaptera. Nie przesyłaj haseł, kodów, ciasteczek ani tokenów w rozmowie.

## Zasady wysyłania

Wiadomość jest wysyłana jednym kliknięciem. Samo wyczyszczenie pola nie jest dowodem dostarczenia; potrzebna jest nowa wiadomość użytkownika z właściwą treścią. Niepewny wynik zatrzymuje próbę zamiast klikać ponownie. Szkice użytkownika są zachowywane, zmiana czatu przerywa próbę, a za długie wiadomości są odrzucane bez ucinania. Długie wyniki narzędzi korzystają z istniejącego dzielenia wyników PlazCode.

Paczka nie przenosi profilu WebView2 ani dawnych logów. Aplikacja utworzy własne pliki przy uruchomieniu. Zachowano pliki aplikacji, wcześniejsze poprawki, konfigurację i licencje. Zwykła aktualizacja PlazCode może zastąpić tę lokalną poprawkę.

Szczegóły: `TESTY-TRZY-SERWISY.md`. Kod adaptera: `providers/webchats.js` i identyczne kopie w dwóch folderach rozszerzeń. Testy: `tests/webchats.test.cjs`.
