# Docker – uruchomienie lokalne i na VPS

Cała aplikacja działa w Docker Compose. Lokalnie nie trzeba instalować Pythona ani PostgreSQL – wystarczy Docker.

| Plik | Do czego |
| --- | --- |
| `compose.yaml` | Wspólna część: PostgreSQL i backend (Django). |
| `compose.override.yaml` | Dev. Compose dokłada go sam przy `docker compose up`: `runserver`, kod podmontowany z dysku, port 8000, lokalne hasła. |
| `compose.prod.yaml` | Produkcja: gunicorn, nginx na porcie 80, restart po awarii, rotacja logów, sekrety z `.env`. |
| `backend/Dockerfile` | Obraz backendu (Python 3.13, Django 5.2 LTS). |
| `nginx/` | Reverse proxy przed Django. Później będzie też serwować zbudowany frontend. |
| `.env.prod.example` | Wzór pliku `.env` dla VPS. |

## Lokalnie

Potrzebny jest Docker Desktop (Windows, macOS) albo Docker Engine z pluginem `compose` (Linux). Podman z `podman-compose` też działa.

```bash
git clone https://github.com/PMStudio-Patryk-Matysiewicz/Projekt-Zespolowy-26-27-UG.git
cd Projekt-Zespolowy-26-27-UG
docker compose up --build
```

Aplikacja: <http://localhost:8000/admin/>, stan i wersja: <http://localhost:8000/api/health>, dokumentacja API: <http://localhost:8000/api/docs/>. Plik `.env` nie jest potrzebny.

Katalog `backend/` jest podmontowany do kontenera, więc serwer przeładowuje się sam po zapisaniu pliku. Migracje wykonują się przy każdym starcie backendu.

### Częste polecenia

```bash
docker compose up -d --build        # start w tle
docker compose logs -f backend      # logi Django
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py startapp wallet
docker compose exec db psql -U zerorisk   # konsola bazy
docker compose down                 # stop (dane w bazie zostają)
docker compose down -v              # stop i usunięcie bazy
```

Nowa biblioteka Pythona: dopisz ją do `backend/requirements.txt`, uruchom `docker compose up -d --build` i commitnij `requirements.txt`. Pozostali po `git pull` robią to samo `up --build`.

### Lokalny `.env` (tylko w razie potrzeby)

W katalogu głównym repo możesz utworzyć `.env` z tymi zmiennymi – nic więcej tam nie wpisuj, w szczególności nie kopiuj `.env.prod.example`, bo przełączy Compose na produkcję.

| Zmienna | Kiedy |
| --- | --- |
| `LOCAL_UID`, `LOCAL_GID` | Pliki tworzone w kontenerze (migracje, `startapp`) dostają tego właściciela. Domyślnie 1000. Na Docker Desktop nic nie trzeba. Linux: wpisz wynik `id -u` i `id -g`, jeśli jest inny niż 1000. Rootless podman: `0` i `0` (root w kontenerze to Twój użytkownik na hoście). |
| `BACKEND_PORT` | Port 8000 jest zajęty, np. `BACKEND_PORT=8001`. |

## VPS

Serwer: Ubuntu 24.04, 2 rdzenie, ~840 MB RAM i 2 GB swapu (już skonfigurowany). Aplikacja leży w `/srv/projekt/zerorisk` – katalog `/srv/projekt` należy do grupy `projekt`, więc wdrażać może każdy z zespołu.

### Jednorazowa konfiguracja

**1. Docker** (osoba z `sudo`), według [oficjalnej instrukcji](https://docs.docker.com/engine/install/ubuntu/):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Dostęp do Dockera bez sudo dla całego zespołu (działa po ponownym zalogowaniu).
# Uwaga: grupa docker daje w praktyce uprawnienia roota.
for u in patryk fabian dominik; do sudo usermod -aG docker "$u"; done
```

**2. Port 80 w Azure.** W portalu: maszyna wirtualna → *Networking* → *Add inbound port rule* → port `80`, protokół TCP. Bez tego strona nie będzie widoczna z internetu, mimo że kontenery działają.

**3. Kod i `.env`:**

```bash
git clone --config core.sharedRepository=group \
  https://github.com/PMStudio-Patryk-Matysiewicz/Projekt-Zespolowy-26-27-UG.git /srv/projekt/zerorisk
cd /srv/projekt/zerorisk
cp .env.prod.example .env
chmod 660 .env
nano .env    # uzupełnij klucz, hasło do bazy i adres serwera
```

Klucz i hasło wygenerujesz poleceniem `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`.

Każda osoba poza tą, która sklonowała repo, musi raz oznaczyć katalog jako zaufany, inaczej `git` odmówi pracy w cudzym repozytorium:

```bash
git config --global --add safe.directory /srv/projekt/zerorisk
```

### Wdrożenie

```bash
cd /srv/projekt/zerorisk
git pull
docker compose up -d --build
```

`COMPOSE_FILE` z `.env` sprawia, że na serwerze `docker compose` używa `compose.yaml` + `compose.prod.yaml` – nie trzeba podawać `-f`. Pierwsze budowanie trwa kilka minut, kolejne są szybkie, bo zależności są w osobnej warstwie obrazu.

Pierwsze konto administratora:

```bash
docker compose exec backend python manage.py createsuperuser
```

### Utrzymanie

```bash
docker compose ps                     # stan kontenerów
docker compose logs -f --tail=100     # logi wszystkich usług
docker compose exec db pg_dump -U zerorisk zerorisk > backup-$(date +%F).sql   # kopia bazy
docker image prune -f                 # usunięcie starych obrazów po wdrożeniach
```

Kontenery wstają same po restarcie serwera (`restart: unless-stopped`).

## Do zrobienia później

- **HTTPS** – potrzebna nazwa domeny. Na Azure można za darmo ustawić etykietę DNS maszyny (`<nazwa>.<region>.cloudapp.azure.com`) i wystawić dla niej certyfikat Let's Encrypt. Po włączeniu HTTPS dopisać do `.env` adresy `https://`, a w ustawieniach Django włączyć `SESSION_COOKIE_SECURE` i `CSRF_COOKIE_SECURE`.
- **Frontend (React + Vite)** – lokalnie osobny serwis z serwerem Vite. Na produkcji wieloetapowy obraz nginx: najpierw `npm run build`, potem nginx serwuje pliki z `dist/`, a do Django przekazuje tylko `/api/`, `/admin/` i `/static/`. Przy ~840 MB RAM budowanie frontendu na VPS może być wolne – wtedy lepiej budować obrazy w GitHub Actions i na serwerze tylko je pobierać.
