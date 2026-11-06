# Docker – uruchomienie lokalne i na VPS

Cała aplikacja działa w Docker Compose. Lokalnie nie trzeba instalować Pythona ani PostgreSQL – wystarczy Docker.

| Plik | Do czego |
| --- | --- |
| `compose.yaml` | Wspólna część: PostgreSQL i backend (Django). |
| `compose.override.yaml` | Dev. Compose dokłada go sam przy `docker compose up`: `runserver` (port 8000), serwer Vite (port 5173), kod podmontowany z dysku, lokalne hasła. |
| `compose.prod.yaml` | Produkcja: gunicorn, frontend (nginx) na portach 80 i 443 (HTTPS), restart po awarii, rotacja logów, sekrety z `.env`. |
| `backend/Dockerfile` | Obraz backendu (Python 3.13, Django 5.2 LTS). |
| `frontend/Dockerfile` | Obraz produkcyjny frontu: Node buduje React, nginx serwuje `dist/` i przekazuje `/api/`, `/admin/` i `/static/` do Django (`frontend/nginx/default.conf.template`). |
| `.env.prod.example` | Wzór pliku `.env` dla VPS. |
| `.env.example` | Lista wszystkich zmiennych z opisem. Wszystkie zakomentowane, więc skopiowanie go do `.env` lokalnie niczego nie przełącza. |

## Lokalnie

Potrzebny jest Docker Desktop (Windows, macOS) albo Docker Engine z pluginem `compose` (Linux). Podman z `podman-compose` też działa.

```bash
git clone https://github.com/PMStudio-Patryk-Matysiewicz/Projekt-Zespolowy-26-27-UG.git
cd Projekt-Zespolowy-26-27-UG
docker compose up --build
```

Aplikacja: <http://localhost:5173/> (React; `/api`, `/admin` i `/static` przekazuje do Django). Bezpośrednio do backendu: <http://localhost:8000/admin/>, stan i wersja: <http://localhost:8000/api/health>, dokumentacja API: <http://localhost:8000/api/docs/>. Plik `.env` nie jest potrzebny.

Katalogi `backend/` i `frontend/` są podmontowane do kontenerów, więc oba serwery przeładowują się same po zapisaniu pliku. Migracje wykonują się przy każdym starcie backendu. Kontener frontu przy starcie robi `npm ci` (ok. 20–30 s) i trzyma własne `node_modules` dla Linuksa, niezależne od Twojego lokalnego.

Jeśli wolisz uruchamiać front poza Dockerem (`cd frontend`, `npm install`, `npm run dev`), zatrzymaj kontener: `docker compose stop frontend`, bo oba używają portu 5173.

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
| `FRONTEND_PORT` | Port 5173 jest zajęty, np. `FRONTEND_PORT=5174`. |

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

**2. Porty 80 i 443 w Azure.** W portalu: maszyna wirtualna → *Networking* → *Add inbound port rule* → porty `80,443`, protokół TCP. Bez tego strona nie będzie widoczna z internetu, mimo że kontenery działają. Port 80 tylko przekierowuje na HTTPS i jest potrzebny certbotowi.

**3. Nazwa domeny w Azure.** Maszyna wirtualna → *Overview* → *DNS name* → *Configure*, wpisz etykietę (np. `zerorisk`). Powstanie domena `zerorisk.<region>.cloudapp.azure.com`; to ona trafia do `DOMAIN` w `.env`.

**4. Kod i `.env`:**

```bash
git clone --config core.sharedRepository=group \
  https://github.com/PMStudio-Patryk-Matysiewicz/Projekt-Zespolowy-26-27-UG.git /srv/projekt/zerorisk
cd /srv/projekt/zerorisk
cp .env.prod.example .env
chmod 660 .env
nano .env    # uzupełnij klucz, hasło do bazy i domenę
```

Klucz i hasło wygenerujesz poleceniem `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`.

Każda osoba poza tą, która sklonowała repo, musi raz oznaczyć katalog jako zaufany, inaczej `git` odmówi pracy w cudzym repozytorium:

```bash
git config --global --add safe.directory /srv/projekt/zerorisk
```

**5. Certyfikat HTTPS (Let's Encrypt).** Bez niego kontener `frontend` nie wystartuje, więc ten krok robimy przed pierwszym wdrożeniem. Certbot działa na hoście w trybie *standalone*: na czas wystawienia i odnowienia zatrzymuje kontener `frontend`, żeby zająć port 80 (kilka sekund przerwy co ok. 60 dni).

```bash
sudo apt-get install -y certbot
DOMAIN=zerorisk.westeurope.cloudapp.azure.com   # Twoja domena z kroku 3
sudo certbot certonly --standalone -d "$DOMAIN" \
  --agree-tos --no-eff-email -m <e-mail-do-powiadomień> \
  --pre-hook "cd /srv/projekt/zerorisk && docker compose stop frontend" \
  --post-hook "cd /srv/projekt/zerorisk && docker compose start frontend"
sudo certbot renew --dry-run    # test odnowienia
```

Certbot zapamiętuje hooki w `/etc/letsencrypt/renewal/` i odnawia certyfikat sam (`systemctl list-timers certbot.timer`). Kontener czyta certyfikaty z `/etc/letsencrypt` hosta. HTTP przekierowuje na HTTPS, a Django przy `DJANGO_DEBUG=0` wysyła ciasteczka sesji i CSRF tylko po HTTPS.

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
