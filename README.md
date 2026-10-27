# Projekt-Zespolowy-26-27-UG

> **Nazwa produktu:** ZeroRisk

Symulator gier hazardowych, w którym gra się wyłącznie wirtualną walutą, bez prawdziwych pieniędzy.

## Problem

Gry hazardowe na prawdziwe pieniądze wiążą się z dużym ryzykiem finansowym i mogą prowadzić do uzależnienia. Do tego wiele serwisów hazardowych działa w Polsce nielegalnie, a korzystanie z nich naraża gracza na odpowiedzialność prawną i utratę środków. Osoby, które lubią sam przebieg i emocje takiej gry, nie mają obecnie bezpiecznej i legalnej alternatywy.

## Użytkownik

Osoba, która lubi gry hazardowe, ale nie chce wydawać na nie prawdziwych pieniędzy ani ryzykować kłopotów prawnych. Chce grać dla rozrywki, ćwiczyć strategię i rywalizować bez konsekwencji finansowych.

## Trzy najważniejsze funkcje

1. **Boty AI jako przeciwnicy.** Użytkownik gra z botami sterowanymi przez AI, więc do rozgrywki nie potrzebuje innych graczy.
2. **Symulacja wyścigów konnych.** Użytkownik obstawia wirtualną walutą wyścigi, których przebieg i wynik generuje symulacja.
3. **Gry karciane.** Użytkownik może zagrać m.in. w blackjacka i makao.

## Uruchomienie

Wystarczy Docker:

```bash
docker compose up --build
```

Aplikacja będzie pod <http://localhost:8000/admin/>. Polecenia deweloperskie i wdrożenie na VPS: [docs/docker.md](docs/docker.md). Zasady pracy z Gitem i Jirą: [CONTRIBUTING.md](CONTRIBUTING.md).

## Zespół i role

| Osoba                 | Role                                 |
| --------------------- | ------------------------------------ |
| Patryk Matysiewicz    | Lider / Product Owner, Developer, Infrastruktura     |
| Fabian Staszkiewicz   | Developer, QA, Infrastruktura        |
| Dominik Serafin       | Developer, QA        |

| Rola                  | Właściciel           |
| --------------------- | -------------------- |
| Lider / Product Owner | Patryk Matysiewicz   |
| Developer             | Patryk Matysiewicz, Fabian Staszkiewicz, Dominik Serafin |
| QA                    | Fabian Staszkiewicz, Dominik Serafin  |
| Infrastruktura        | Patryk Matysiewicz, Fabian Staszkiewicz  |
