# Poprawka przesyłania wyników do Claude

Dotyczy: załączonej paczki PlazCode 1.24.20. Data poprawki: 18 października 2026.
To lokalna poprawka skryptów rozszerzenia, a nie nowe oficjalne wydanie PlazCode.
Numer wersji 1.24.20 oraz pliki aplikacji desktopowej pozostają zgodne z paczką bazową.

## Instalacja

1. Zatrzymaj aktywne zadanie PlazCode i zachowaj kopię obecnego folderu.
2. Wypakuj ten ZIP. W używanej instalacji podmień pliki `providers/claude.js`
   oraz `core/main.js` na poprawione pliki z odpowiadającego jej folderu:
   - Chrome / Edge: `PlazCode-Extension`.
   - Firefox: `PlazCode-Extension-Firefox`.
   - Jeśli rozszerzenie załadowano bezpośrednio z głównego folderu `PlazCode`,
     użyj plików z głównego folderu. Wszystkie trzy kopie zawierają tę samą poprawkę.
3. Przeładuj rozszerzenie na `chrome://extensions` albo `edge://extensions`.
   W Firefoksie wybierz Reload w `about:debugging#/runtime/this-firefox`.
4. Odśwież kartę Claude i uruchom ponownie agenta PlazCode.
5. Po ponownym uruchomieniu odczytaj wynik na nowo. Wyniki przechowywane przed
   odświeżeniem karty nie pozostają w pamięci rozszerzenia.

Nie trzeba ponownie instalować Studio ani przebudowywać PlazCode.exe.
Aktualizacja oficjalnego PlazCode może zastąpić zmodyfikowane pliki.

## Co zostało poprawione

- Adapter ustawia fokus na polu wiadomości i zapisuje tekst w ograniczonych
  porcjach. Po każdej porcji czeka na aktualizację edytora i sprawdza całą treść.
- Porównanie obejmuje początek, środek, koniec, nowe linie i wcięcia. Normalizuje
  jedynie końce linii oraz spacje nierozdzielające używane przez edytor.
- Gdy edytor zgubi fragment podczas wpisywania, rozszerzenie raz odtwarza
  niewysłaną wiadomość. Jeśli nadal jest niekompletna, nie klika Wyślij i zgłasza błąd.
- Kontrola treści odbywa się ponownie po oczekiwaniu na przycisk Wyślij
  i po dołączeniu obrazów. Zatrzymanie zadania przerywa przygotowywanie wiadomości.
- Wyślij jest klikane tylko raz. Sama utrata końcówki tekstu nie potwierdza
  dostarczenia i nie uruchamia kolejnego wysłania.
- Wyniki dla Claude są przekazywane stronami do 10 000 znaków. Pełny wynik
  pozostaje w istniejącym buforze PlazCode. Claude otrzymuje identyfikator
  i instrukcję `plazcode_result_read`; powinien odczytywać kolejne strony aż
  `next_offset` wyniesie `null`. Nie wymaga to powtarzania komendy w Studio.
- Nagłówek pierwszej strony mieści się w limicie razem z treścią.
  Wyłączono awaryjne obcinanie wiadomości przez adapter Claude.
- Odczyt pojedynczego znaku Unicode, który nie mieści się w podanym limicie,
  zwraca komunikat zamiast zapętlać stronicowanie bez postępu.

Nie dodawaj 1500 znaków wypełniacza. Gdy wynik ma kilka stron, Claude powinien
odczytać je przez `plazcode_result_read`, zgodnie z nagłówkiem odpowiedzi.
Bufor wyników jest związany z kartą, rozmową i wybranym silnikiem; nie jest
trwałym archiwum i może usuwać starsze wpisy według istniejących limitów PlazCode.

## Weryfikacja

29 testów regresji przeszło w Node.js. Obejmują m.in.:

- 40 numerowanych linii ze znacznikami początku i końca oraz nagłówkiem skryptu;
- zasymulowaną utratę pierwszego fragmentu podczas aktualizacji edytora;
- uszkodzenie początku, środka i końca, także zmianę bez zmiany długości;
- 700 linii, puste linie, wcięcia, polskie znaki i emoji;
- wyniki od około 14 tys. do ponad 240 tys. znaków i odtworzenie ich z kolejnych stron;
- wysłanie kolejnych stron przez rzeczywisty kod adaptera z atrapą edytora;
- opóźnione potwierdzenie, zablokowane Wyślij, Stop oraz wiadomości z obrazami.

Test symulujący utratę początkowego fragmentu nie przechodzi na oryginalnym
adapterze 1.24.20: wysyła on tekst od `LINIA_025`. Poprawiony adapter odtwarza
całą wiadomość przed wysłaniem. Symulacja pokazuje brak zabezpieczenia w starej
wersji; nie stanowi dowodu, który mechanizm na stronie Claude wywołał utratę
tekstu w zgłoszonej sesji.

Uruchomienie testów z głównego folderu PlazCode:

```sh
node --test tests/claude-delivery.test.cjs
```

W tym środowisku nie wykonano testu na zalogowanej stronie Claude ani z działającym
Roblox Studio. Testy sprawdzają kod z symulowanym edytorem i transportem.
Historyczny plik `VALIDATION.txt` opisuje także weryfikację bazowego wydania;
tamte wyniki nie są certyfikacją tej lokalnej poprawki.

## Krótki test po instalacji

Poproś Claude, aby wykonał w Studio kod z `tests/claude-roundtrip.luau`,
odczytał cały wynik i podał pierwszy oraz ostatni znacznik i liczbę linii `LINIA_`.
Oczekiwany wynik: `<<<START_TESTU>>>`, `<<<KONIEC_FRAGMENTU>>>`, 40 linii.
Następnie ustaw w tym kodzie `count = 400` i powtórz odczyt, uwzględniając
wszystkie strony. Nie trzeba dodawać wypełniacza. Kod testu nie modyfikuje place.

Zmodyfikowane skrypty i testy są objęte licencją GPL-3.0-or-later z paczki bazowej.
