# Arcee i copilot.com — r30, rozszerzenie 1.24.38

## R30 — rzeczywisty wirtualizowany edytor Scriptor

Raport użytkownika z r29 pokazał już wnętrze kodu: scriptor-component-code-block + scriptor-codeblock-virtualized, 0 paragrafów i 0 runów, nagłówek JSON o długości 4 oraz osobny role=textbox z 27 znakami kodu. Wiadomości i korzeń treści były rozpoznane. Czytnik zwracał brak źródła przed parserem. R29 nie obsługiwało tego wirtualizowanego wariantu; ogólny odczyt całego DOM nie wystarcza również z powodu pomocniczych elementów dostępności. Struktura klas, gałęzi i textboxa jest teraz potwierdzona raportem, ale prywatny model Microsoftu nie został odczytany z konta.

Nowy providers/copilot-code.js działa w MAIN wyłącznie na copilot.com. Odczytuje pełny dokument z EditContext, readonly textarea albo jawnych pól źródła właściciela natywnego komponentu React. Nie przeszukuje dowolnego drzewa aplikacji: odczyt React jest ograniczony do właścicieli konkretnego korzenia kodu, do najbliższej granicy DOM i 16 poziomów. Wymaga zgodności z fragmentami widocznego textboxa i jednej zgodnej wartości. Pełny zatwierdzony props kodu ma pierwszeństwo przed EditContext, jeśli jego bufor jest dokładnym fragmentem tego kodu (oknem surrounding text). Sprzeczne rewizje pozostają błędem. Bieżące host props wskazują zatwierdzoną gałąź; przy niejednoznacznych alternatach różniących się kodem wykonanie jest zatrzymane. Nie wybiera się najdłuższego stringa ani losowej podobnej komendy.

Adapter pobiera źródło przez synchroniczne zdarzenie i odpowiedź, sprawdza jego długość oraz znany rodzaj modelu. Brak czytnika, błąd modelu lub utrata właściciela nie pozwalają użyć starego atrybutu. Zmiana źródła o tej samej długości jest odczytywana ponownie. Źródło przekraczające limit 2 097 152 jednostek UTF-16 jest niedostępne, nigdy przycięte. Nie klika się natywnego Copy, nie odczytuje ani nie nadpisuje schowka, nie ustawia inputu i nie zmienia modelu strony. Źródło w DOM jest aktualizowane wyłącznie po jego zmianie; brak cyklicznego skanowania wszystkich bloków historii.

Wyjątek bez pełnego modelu obejmuje tylko dokładny JSON list_commands z nieobecnym lub pustym params, bez innych pól, odczytany z jedynego textboxa tego wirtualizowanego bloku. To lokalny katalog, bez skutków w projekcie. Wyjątek nie obejmuje get_studio_state, execute_luau ani innych poleceń projektu i nie odtwarza brakujących argumentów. Model, jeśli jest dostępny, zawsze ma pierwszeństwo, również gdy jego JSON jest niekompletny. Nadal wymagane są potwierdzony kontekst i gotowość, a odmowa poza kodem zatrzymuje pracę.

Niedostępne pełne źródło polecenia projektu kończy się widocznym Full code source unavailable i przyciskiem raportu zamiast zwykłego zakończenia jako tekst. Nie uruchamia się nic z tej odpowiedzi, nie ponawia automatycznie komendy i nie wysyła korekty. Watcher zachowuje swoje oczekiwanie na ustabilizowanie i koniec generowania, także gdy widoczny fragment wygląda jak niezamknięta komenda. Raport zawiera wyłącznie znany reader/model_status/model_kind i długości; nie kopiuje źródła ani propsów React.

Testy odtwarzają błąd r29 na strukturze wirtualizowanego edytora, a r30 przechodzi start i jeden odczyt. Oddzielna próba używa prawdziwego React i dwóch światów wykonania Chromium: właściwości React są niewidoczne dla adaptera, ale czytnik MAIN przekazuje cały kod ponad 100 tys. znaków mimo viewportu krótszego niż 100 znaków. Nie jest to próba na prywatnym komponencie Microsoftu ani zalogowanym koncie. Szczegóły: TESTY-TRZY-SERWISY.md.

## R29 — pełny JSON z natywnego bloku bez klas paragrafów

Raport r28 z konta użytkownika potwierdził etap awarii: rozpoznano 2 wpisy użytkownika i 2 odpowiedzi AI, 4 artykuły, 1 korzeń treści i 2 elementy podglądu Scriptor. Ostatnia odpowiedź ma 34 znaki w czytniku, lecz candidate_chars=0; core kończy ją jako text, z 0 wywołań i bez błędu parsera. Problem występuje przed parserem. Próbka struktury dochodzi do lastChatMessage, ale limit głębokości odcina wnętrze kodu. Raport nie dowodzi konkretnej klasy jego wierszy ani dokładnej przyczyny odrzucenia źródła.

W czytniku znaleziono brakującą ścieżkę: natywny blok bez scriptor-paragraph zawsze zwracał brak źródła, nawet gdy zawierał kompletny JSON. R29 czyta cały taki blok i przyjmuje go wyłącznie jako poprawny obiekt JSON z kluczem command. Może pominąć osobno wyrenderowany początkowy nagłówek JSON, znane kontrolki i oznaczone guttery. Nie szuka komendy w wybranym potomku, nie usuwa nieoznaczonych numerów, nie naprawia nawiasów ani nie dopisuje parametrów. Obsługuje list_commands z params i bez niego oraz zwykłe komendy z dosłownym kodem Luau w parametrze. Surowy Luau nadal wymaga dotychczasowego kontraktu logicznych linii.

Nieczytelne modele/shadow roots, sloty, ukryte fragmenty, jawna wirtualizacja i metadane wierszy bez rozpoznanych linii blokują tę dodatkową ścieżkę. Zwykły tekst poza kodem, niepełny JSON i nieoznaczone guttery nie są wycinane w poszukiwaniu poprawnego podzbioru. Nieczytelny blok nadal zatrzymuje pozostałe komendy tej odpowiedzi. Role, odmowy modelu, potwierdzenie wysłania i protokół startu pozostają wymagane.

Diagnostyka najpierw opisuje wykryte bloki kodu, dopiero później zewnętrzne opakowania odpowiedzi. Dodaje liczniki paragrafów/runów, dostępność i długość odczytanego źródła oraz flagę wykluczenia przez czytnik. Nadal zachowuje limit 48 elementów i nie zawiera tekstu czatu ani kodu. Pozwala sprawdzić wnętrze bloku, które zniknęło z raportu r28.

Reprezentatywny wariant bez klas paragrafów odtwarza błąd na r28 i przechodzi pełny start oraz jeden odczyt na r29. Jego zewnętrzne markery i głębokie opakowania odpowiadają raportowi; niewidoczne w raporcie potomki kodu są kontrolowanym fixture, nie kopią DOM użytkownika. Wyniki i granice weryfikacji: TESTY-TRZY-SERWISY.md. Nie potwierdzono działania na zalogowanym koncie.

## R28 — jednorazowy raport rzeczywistej struktury odpowiedzi

Na koncie użytkownika również r27 kończy się Startup handshake failed mimo poprawnego JSON na ekranie. Nie potwierdzono przyczyny. Kolejne zgadywanie wariantu HTML nie rozstrzygnie, czy problem dotyczy wyboru odpowiedzi, źródła kodu, filtra UI czy walidacji świeżości. Dotychczasowy raport zawierał głównie wersje i metadane błędu parsera; brakowało odczytu dostawcy.

R28 dodaje opcjonalny raport dostawcy i przycisk Copy transport report bezpośrednio przy błędzie startu Copilot. Ten sam raport jest w Settings. Dane obejmują wybrany silnik, wynik startu (rodzaj, długość, liczba wywołań, obecność/bieżącość przypisanej odpowiedzi), liczniki rozpoznanych wiadomości i bloków, długości źródła, flagi poprawnego JSON/klucza command/list_commands oraz próbkę struktury ostatniej odpowiedzi. Gdy żadna odpowiedź nie ma rozpoznanej roli, raport może opisać ostatnie trzy natywne artykuły jako unclassified, bez uznania ich za AI.

Próbka ma najwyżej 48 elementów i głębokość 10. Zachowuje tag, techniczną rolę, ograniczone nazwy komponentów/markerów, liczbę znaków/dzieci, znacznik otwartego shadow root i informację o pomijaniu przez czytnik. Nie przechowuje tekstu, kodu, szkicu, URL, ID, href/title/aria-label ani dowolnych atrybutów. Metadane przekazane przez core są jawnie ograniczone do znanego rodzaju wyniku, liczników i booleanów. Jeden snapshot z chwili błędu pozostaje w pamięci obok oddzielnego aktualnego odczytu. Nie jest to eksport historii.

Kopiowanie następuje tylko po kliknięciu, przez istniejącą funkcję schowka; przy odmowie przeglądarki raport pozostaje widoczny do zaznaczenia. Brak automatycznego wysyłania danych i brak kliknięć natywnych przycisków Copilot. Zwykłe etykiety wersji nie wykonują skanowania struktury. Inni dostawcy zachowują raport podstawowy. Parser, reguły ról, selektory bloków i reguły startu nie są zmienione.

Po aktualizacji odtwórz błąd i użyj przycisku w jego oknie. Raport jest potrzebny do diagnozy faktycznej strony zamiast dopasowywania kolejnego fixture do przypuszczenia. R28 nie jest potwierdzoną naprawą tego konta. Sprawdzenia i ograniczenia: TESTY-TRZY-SERWISY.md.


## R27 — natywny blok kodu Scriptor

Nowy zrzut r26 pokazuje poprawne JSON-y list_commands, lecz handshake nadal ich nie rozpoznaje. [Publiczny czytnik Microsoftu](https://github.com/TomSchmidtDev/browser-ai-chat-exporter/blob/0830aad4488754ba7c6b2cdcf6cfb7ea65841e80/platforms/copilot/content.js#L29) opisuje scriptor-component-code-block oraz podgląd kodu z logicznymi scriptor-paragraph i fragmentami scriptor-textRun. Dotychczasowe szukanie tylko pre nie obejmowało tej struktury.

R27 przyjmuje taki blok wyłącznie w rozpoznanej odpowiedzi AI. W obrębie każdej logicznej linii skleja fragmenty tekstu, a linie łączy pojedynczym newline. Zagnieżdżone fragmenty nie dublują tekstu. Zachowuje dosłowne znaki, w tym whitespace i niewidoczne znaki w źródle; nie bierze nagłówka języka, gutterów i Copy. Puste linie pozostają w źródle. Kontener może mieć dokładny znacznik scriptor-component-code-block albo etykietę podglądu kodu w EN/DE/PL, ale musi zawierać rozpoznane paragrafy. Kod w cytacie, kontrolce i UI PlazCode nie jest wykonywany. Nieznana rola nie staje się AI na podstawie JSON.

Brak paragrafów lub pełnego modelu jawnie wirtualizowanego edytora oznacza brak źródła. Jeśli dostępne są data-line-count, aria-rowcount/aria-setsize lub indeksy linii, muszą być spójne i ciągłe. Luki, duplikaty, inny deklarowany rozmiar lub jawna wirtualizacja zatrzymują wykonanie; nie skleja się tekstu wokół brakujących wierszy. Nieczytelny blok blokuje także wykonanie pozostałej części odpowiedzi. Diagnostyka codeSourceUnavailable zawiera wyłącznie rodzaj edytora. Niewidoczna wirtualizacja bez metadanych i zamknięte modele edytora nie mają osobnego źródła w tej wersji.

Aktualizuje się także czytnik całej odpowiedzi i kotwicę karty narzędzia, więc nagłówki i numery nie wracają do parsera po dekorowaniu. Faktyczna odmowa poza blokiem nadal ma pierwszeństwo; tekst przypominający odmowę wewnątrz literalnego parametru kodu nie jest odpowiedzią modelu. Prośba startowa, brak ponowienia Send i wymaganie potwierdzonego kontekstu pozostają zachowane. Komunikat nieodczytanego handshake Copilot mówi teraz o braku odczytu po stronie PlazCode; nie twierdzi, że model nie zwrócił widocznej komendy, i nie zaleca ponowienia Start.

Testy odtwarzają wariant na r26 i przejście pełnego protokołu na r27. Nie potwierdzono struktury prywatnego DOM ze zrzutu; jest to poprawka luki znalezionej w czytniku na podstawie publicznie opisanego formatu. Model, most i Studio są kontrolowane. Wyniki: TESTY-TRZY-SERWISY.md.


## R26 — wariant Microsoft i odmowa modelu

Na zrzucie r25 nadal występuje Read user messages: 0, a odpowiedź modelu jest jawną odmową udziału w protokole. Nie zmieniono prośby startowej ani zasad odmowy. Poprawiono odczyt innego wariantu interfejsu i rozróżnienie odmowy od niepotwierdzonego wysłania.

[Publiczny browser-ai-chat-exporter](https://github.com/TomSchmidtDev/browser-ai-chat-exporter/blob/0830aad4488754ba7c6b2cdcf6cfb7ea65841e80/platforms/copilot/content.js#L161) opisuje artykuły Microsoft z fai-UserMessage i fai-CopilotMessage, testid copilot-message oraz treść chatOutput, fai-UserMessage__message, markdown-reply i fai-CopilotMessage__content. R26 przyjmuje dokładne tokeny tych klas i wymaga role=article dla korzeni fai, bez ogólnego dopasowania dowolnej klasy zawierającej message. Zagnieżdżone znaczniki nadal liczą się raz.

W rozpoznanej odpowiedzi można odczytać otwarty shadow root hosta markdown-reply. Dotyczy to pełnego tekstu, kodu oraz odmowy. Źródło nie obejmuje nagłówków Copy, cytatów, elementów PlazCode ani nieaktywnego light DOM zasłoniętego shadow root. Nie interpretuje się fallbacków slotów; taki wariant wymaga osobnego kontraktu. Inne komponenty i zamknięte shadow roots nie dostarczają wykonywalnych odpowiedzi. Funkcja wykrywania ról nie penetruje dowolnych shadow roots strony.

Jeżeli po Send pojawi się nowa rozpoznana odpowiedź z odmową, adapter czeka na zanik Stop i stabilny tekst. Stara odpowiedź, remount/duplikat starego ID i odmowa tylko w cytacie nie należą do nowej próby. Właściciel wysyłki i rozmowa muszą pozostać aktualne. Odmowa zgłoszona bez potwierdzonego wpisu użytkownika rzuca oznaczony błąd, nie potwierdza wysyłki; core wyświetla AI declined the connection request i pozostawia sesję nieuruchomioną. Nie wysyła korekty, kontekstu ani drugiego Send. Przy poprawnym echu dotychczasowa obsługa odmowy w watcherze nadal obowiązuje.

Niepotwierdzona wysyłka zapisuje dodatkowo jedynie liczniki artykułów, korzeni Microsoft, nazwanych grup i hostów odpowiedzi. Nie zapisuje HTML, klas dowolnych elementów, identyfikatorów konta ani źródła czatu. To diagnostyka, nie dowód przyjęcia prośby. Dokładna struktura zalogowanego konta ze zrzutu pozostaje niepotwierdzona. Model, który nadal odmawia, nie uruchomi agenta; jego zgodności nie można zagwarantować poprawką czytnika. Wyniki: TESTY-TRZY-SERWISY.md.


## R25 — rozpoznawanie nazwanych grup wiadomości Copilot

Nowy zrzut r24 podaje **Read user messages: 0; closest text 0/552 characters**. W takim przypadku poprawa odczytu istniejącego rozpoznanego wpisu nie wystarcza. Dodano dokładne znaczniki ról i treści znalezione w dwóch publicznych implementacjach eksportu rozmów:

- [revivalstack/ai-chat-exporter, zapisane DOM i selektory](https://github.com/revivalstack/ai-chat-exporter/tree/4ce218d1290956703489870aafa2adfdf4448f38): reference-html-dom/copilot-chat-dom.html, copilot-dom-2question-ans-pairs.html oraz sekcja COPILOT_MESSAGE_SELECTOR w ai-chat-exporter.user.js.
- [TomSchmidtDev/browser-ai-chat-exporter, odczyt consumer UI](https://github.com/TomSchmidtDev/browser-ai-chat-exporter/blob/0830aad4488754ba7c6b2cdcf6cfb7ea65841e80/platforms/copilot/content.js#L201): dokładny token group/user-message, testid ai-message i treść użytkownika wewnątrz grupy.

Adapter przyjmuje dokładne tokeny `group/user-message` i `group/ai-message`, testid `ai-message` oraz role=article z natywnym ID kończącym się `-user-message`. Nie używa podciągu class*=message, utility group-hover, samego JSON ani pozycji w kolumnie. Klasa `group/ai-message-item` jest treścią, nie samodzielnym dowodem roli. Rozpoznane wpisy nie mogą pochodzić z cytatu, kodu, nawigacji, dialogu ani kompozytora. Zagnieżdżone dotychczasowe znaczniki nie dublują wpisów.

Treść użytkownika pochodzi z data-content=user-message lub dokładnych znaczników treści, w tym max-w-user-text-message. AI korzysta z group/ai-message-item. Etykiety sr-only/data-copy=false i reakcje pozostają poza tekstem. Natywne ID użytkownika utrzymuje tożsamość po remoncie i rozwinięciu podglądu. Nadal wymagane jest nowe pełne echo własnego tekstu, a nie sama odpowiedź AI lub stary identyczny wpis. Brak ponownego Send.

Nowe fixture odtwarzają brak rozpoznanych ról na r24 po usunięciu wszystkich wcześniejszych atrybutów. R25 przechodzi pełny start, kontekst i kontrolowany odczyt. Nie oglądano zalogowanego DOM konta użytkownika; podane źródła są publicznymi przykładami i implementacjami, a nie potwierdzeniem jego bieżącej wersji interfejsu. Bezpośredni odczyt copilot.com/chat w tej sesji blokował CONNECT 403. Wyniki: TESTY-TRZY-SERWISY.md.


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
3. Sprawdź wersję **1.24.38**. Raport transportu nowych adapterów: **core:r30/parser:r13/provider:r30**. Na pustym polu Start Agent musi potwierdzić połączenie przez list_commands i odbiór kontekstu.
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

Sumy bieżącej paczki: `WEBCHATS-R30-SHA256SUMS.txt`.


### Dodatkowe testy kontrolowanych bibliotek

To zależności wyłącznie testów przeglądarki; rozszerzenie ich nie potrzebuje. Przykład instalacji w osobnym katalogu:

```sh
npm install --prefix /tmp/plazcode-ui-r19 --cache /tmp/plazcode-npm-cache --no-audit --no-fund --package-lock=false react@19.2.0 react-dom@19.2.0 lexical@0.38.2 @lexical/plain-text@0.38.2 @codemirror/view@6.38.8 @codemirror/state@6.5.2 esbuild@0.25.11
PLAZCODE_BROWSER_DEPS=/tmp/plazcode-ui-r19 PLAZCODE_CHROMIUM=/usr/bin/chromium node tests/browser/controlled-editors.cjs
```

Pakiet playwright musi być dostępny dla Node jak w pozostałych próbach przeglądarki. Zestaw buduje fixture w pamięci przez esbuild; nie zmienia plików runtime ani zależności tests/package-lock.json.
