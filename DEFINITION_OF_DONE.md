# Definition of Done

Historyjka (Story) jest **Gotowa** dopiero wtedy, gdy spełnia wszystkie sześć warunków. Sub-task jest gotowy, gdy spełnia warunki 2–4 i 6. Każdy warunek sprawdza się konkretną czynnością.

| # | Warunek | Jak sprawdzić |
| --- | --- | --- |
| 1 | **Kryteria akceptacji spełnione.** Każde kryterium z opisu historyjki w Jirze działa tak, jak je zapisano. | Recenzent przed zatwierdzeniem PR przechodzi kryteria według sekcji „Jak sprawdzić” w opisie PR. *Approve* oznacza, że działają, a nie tylko, że kod wygląda dobrze. |
| 2 | **Kod jest w `main` przez PR.** 1 zatwierdzenie, zielone checki `backend`, `frontend` i `jira-key`, rozwiązane wątki, scalenie przez *Rebase and merge*. Gałąź, tytuł PR i każdy commit zawierają `SCRUM-xx`. | Strona PR na GitHubie: status *Merged*, wszystkie checki zielone. |
| 3 | **Logika ma testy automatyczne.** Wymagane dla backendu (modele, serwisy, endpointy), silnika gier i botów oraz kodu frontu z logiką (klient API, hooki, obliczenia). Kod zmieniający saldo zawsze ma test transakcji (brak salda poniżej 0, brak podwójnej wypłaty). Sam wygląd ekranu, konfiguracja i dokumentacja testów nie wymagają. | Testy z PR przechodzą w CI (`python manage.py test`, `npm test`); recenzent sprawdza, czy nowa logika ma test. |
| 4 | **Projekt wstaje od zera.** Migracje i nowe zależności są w tym samym PR, `makemigrations --check` nie widzi zmian. | Świeży klon + `docker compose up --build` uruchamia aplikację bez błędów. |
| 5 | **Działa na serwerze deweloperskim.** Po scaleniu automatyczny deploy kończy się na zielono, a stopka strony i `GET /api/health` pokazują skrót commita z `main`. | Otwarcie strony na serwerze i sprawdzenie funkcji z historyjki. |
| 6 | **Bez sekretów, z aktualną dokumentacją.** Żadnych haseł, kluczy ani plików `.env` w repo, Jirze i czacie. Nowe endpointy są widoczne w `/api/docs/`, nowe zmienne w `.env.example`, zmiany w uruchamianiu opisane w `docs/`. | Przegląd diffu w PR; `/api/docs/` po wdrożeniu. |

Warunek 5 obowiązuje od chwili, gdy działa automatyczny deploy (SCRUM-26). Wcześniej sprawdzamy funkcję lokalnie.

Zmiany w tym dokumencie wprowadzamy przez PR, zgodnie z zasadami decyzji technicznych z [TEAM_CONTRACT.md](TEAM_CONTRACT.md).
