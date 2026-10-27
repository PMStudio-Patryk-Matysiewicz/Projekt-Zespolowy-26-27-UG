# Jak pracujemy (Git + Jira)

Każda zmiana w kodzie to zadanie w Jirze, osobna gałąź i Pull Request. Na `main` jest zawsze działająca wersja – z niej wdrażamy na VPS.

## Cykl pracy nad zadaniem

1. **Weź zadanie** z bieżącego sprintu na [tablicy SCRUM](https://patryk-m-studia.atlassian.net/jira/software/projects/SCRUM/boards/1), przypisz się i przesuń je do **W toku**.
2. **Utwórz gałąź** od aktualnego `main`:
   ```bash
   git switch main
   git pull
   git switch -c feature/SCRUM-12-model-konia
   ```
3. **Commituj** z kluczem zadania na początku – każdy commit trafi na `main`, a CI odrzuci commit bez klucza:
   ```bash
   git commit -m "SCRUM-12 Dodaj model konia"
   ```
4. **Wypchnij gałąź i otwórz PR** do `main`:
   ```bash
   git push -u origin feature/SCRUM-12-model-konia
   ```
   Na GitHubie kliknij *Compare & pull request* (albo `gh pr create`). Tytuł: `SCRUM-12 Model konia`, opis według szablonu. Zadanie przesuń do **Code review**.
5. **Review:** PR musi zatwierdzić ktoś inny niż autor, do 48 h od zgłoszenia. Poprawki po uwagach pushujesz na tę samą gałąź. Wątek zamyka (*Resolve conversation*) osoba, która go otworzyła, gdy uzna poprawkę za wystarczającą.
6. **Scal** przyciskiem *Rebase and merge* – robi to autor. GitHub pozwoli dopiero, gdy:
   - jest 1 zatwierdzenie,
   - checki `backend`, `frontend` i `jira-key` są zielone,
   - wszystkie wątki w review są rozwiązane.

   Tych warunków nie może obejść nikt, także admin. Gałąź na GitHubie usuwa się sama. Zadanie przesuń do **Gotowe**.
7. **Posprzątaj lokalnie:**
   ```bash
   git switch main
   git pull
   git branch -D feature/SCRUM-12-model-konia
   ```
   `-D`, bo GitHub przy rebase tworzy nowe commity i Git nie rozpoznaje gałęzi jako scalonej.

## Nazwy gałęzi

`<typ>/SCRUM-<numer>-<krótki-opis>` – małe litery, myślniki, bez polskich znaków.

| Typ | Kiedy | Przykład |
| --- | --- | --- |
| `feature` | nowa funkcja | `feature/SCRUM-12-model-konia` |
| `fix` | poprawka błędu | `fix/SCRUM-31-saldo-po-splicie` |
| `docs` | dokumentacja | `docs/SCRUM-20-diagram-erd` |
| `chore` | konfiguracja, Docker, zależności | `chore/SCRUM-11-docker-compose` |

Klucz `SCRUM-xx` w nazwie gałęzi, w commitach i w tytule PR sprawia, że Jira pokazuje je przy zadaniu (panel *Development*). Gałąź można też utworzyć z poziomu zadania w Jirze – wtedy dopisz na początku typ.

## Gdy `main` poszedł do przodu

Ktoś scalił swoje zmiany, a Ty jeszcze pracujesz na gałęzi:

```bash
git fetch
git rebase origin/main
git push --force-with-lease
```

Historia `main` musi być liniowa, więc nie używamy `git merge origin/main` – CI odrzuci PR z merge commitem. `--force-with-lease` tylko na własnej gałęzi.

Przed scaleniem warto złączyć drobne commity typu „poprawka literówki”: `git rebase -i origin/main`.

Jeśli po scaleniu dwie gałęzie dodały migrację o tym samym numerze w tej samej aplikacji Django:

```bash
docker compose exec backend python manage.py makemigrations --merge
```

i commitnij powstały plik.

## Zasady

- Nie pushujemy prosto do `main` – GitHub to blokuje.
- Jeden PR = jedno zadanie. Duże zadanie dzielimy w Jirze na podzadania.
- Zmiana modelu idzie w tym samym PR co jej migracja.
- Żadnych sekretów w repo (`.env`, klucze, hasła).

## Kiedy zadanie jest gotowe

- PR jest zatwierdzony, checki są zielone i PR jest scalony do `main`.
- Aplikacja wstaje z `docker compose up --build` i zmiana działa.
- Migracje i nowe zależności (`requirements.txt`) są w PR.
- Zadanie w Jirze jest w **Gotowe**.

## Typy zgłoszeń w Jirze

| Typ | Do czego | Przykład |
| --- | --- | --- |
| Epik | duży obszar produktu | Blackjack, Wyścigi konne |
| Story | funkcja z perspektywy gracza | „Jako gracz chcę obstawić zwycięzcę wyścigu” |
| Zadanie | praca techniczna | Konfiguracja Docker Compose |
| Subtask | część większego zadania | Model konia, endpoint kursów |

Gałąź zakładamy dla Story, Zadania lub Subtaska, nigdy dla Epika.

## Wdrożenie

Na VPS trafia tylko `main` – instrukcja w [docs/docker.md](docs/docker.md#wdrożenie).
