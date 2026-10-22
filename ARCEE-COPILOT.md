# Arcee i copilot.com — r16 (eksperymentalne)

Zakres: `https://platform.arcee.ai/*` i `https://copilot.com/*`, bez Microsoft Copilot. Nie jest wymagany nowy klucz API; adapter korzysta z rozmowy otwartej w przeglądarce. Nie wprowadza zmian w aplikacji EXE.

## Uruchomienie

1. Podmień cały folder rozszerzenia na wersję 1.24.24 i przeładuj rozszerzenie. Odśwież otwartą kartę serwisu.
2. Zaloguj się w serwisie i otwórz rozmowę z modelem. Podłącz lokalny most PlazCode do Studio lub AgentScript jak wcześniej.
3. W pustym polu wiadomości uruchom Start Agent. Agent musi zwrócić rzeczywiste `list_commands`, otrzymać wynik i potwierdzić części kontekstu. Sam tekst zapewniający o połączeniu nie uruchamia sesji.
4. Gdy Start nie rozpoznaje edytora lub przycisku, zatrzymaj próbę. Nie ma potwierdzonej zgodności z aktualnym interfejsem tych serwisów. Jeśli adres przekieruje do innej domeny, ta integracja jej nie obejmuje.

## Granice weryfikacji

Oba adresy były blokowane przez proxy środowiska (CONNECT 403). Nie wykonano testu na zalogowanych stronach, prawdziwym modelu ani w Roblox Studio. Adaptery używają jawnych znaczników ról (`data-message-author-role`, `data-message-role`, `data-role`; dla copilot.com również `data-content`). Wymagają jednego widocznego edytora wewnątrz formularza lub oznaczonego kontenera rozmowy. Przy innym DOM wymagają dostosowania selektorów.

Wysyłka jest tekstowa, bez zweryfikowanego przesyłania obrazów. Nieznany limit serwera nie jest deklarowany jako znany: uwzględniane jest natywne `maxlength`, a kontekst startowy jest dzielony na części po maksymalnie 7000 znaków źródła plus opis. Nowa wiadomość użytkownika potwierdza kliknięcie; brak potwierdzenia oznacza pauzę bez ponownego wysłania. Przed ręczną ponowną próbą sprawdź rozmowę, ponieważ pierwsza wiadomość mogła dotrzeć.

Testy DOM/modelu/mostu obejmują uruchomienie dla Roblox i AgentScript, pełny długi kontekst, potwierdzenia, odmowy, niezmieniony kod Luau, ochronę szkicu, limit długości, zmianę rozmowy, Stop, równoległe wysyłki i nieznane role. Osobny test Chromium sprawdza natywne wstawianie tekstu, puste linie, końcowy znak nowej linii, Unicode i znaki HTML na syntetycznych stronach obu domen. Cały ruch w tym teście jest zastąpiony lokalnym fixture, więc nie dowodzi działania prawdziwych serwisów.

## Powtórzenie testów

```sh
cd tests
npm ci --no-audit --no-fund
npm test
```

Opcjonalny test przeglądarki wymaga pakietu `playwright` dostępnego dla Node i Chromium. Z katalogu głównego:

```sh
PLAZCODE_CHROMIUM=/usr/bin/chromium node tests/browser/webchats-smoke.cjs
```

W ustawieniach chmurowego środowiska zapisano szkic dodatkowych dozwolonych domen: `platform.arcee.ai` i `copilot.com`. Szkic wymaga zapisania/opublikowania w ustawieniach środowiska; nie zmienia uprawnień przeglądarki użytkownika i nie gwarantuje dostępu do zalogowanego konta.
