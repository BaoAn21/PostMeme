# PostMeme

A Postman-like API client. The browser only ever talks to this Rails app;
Rails makes the actual HTTP request to the target API, which is how it
avoids CORS entirely (see `app/services/http_executor.rb`).

## Local development

```bash
bin/setup          # bundle install + create/migrate the dev database
bin/rails server   # http://localhost:3000
```

Ruby version: see `.ruby-version`. Database: SQLite, no separate server needed.

Inspect the database:

```bash
bin/rails console    # poke at data as Ruby objects (Collection, Folder, ApiRequest)
bin/rails dbconsole   # raw SQLite CLI, pointed at the right file automatically
```

## Deploying to a company machine (offline, via a saved image)

This ships the app as a single Docker image file, so the company machine
never needs network access to a registry or to this machine — just the
image file and the Rails master key, copied over by hand.

### 1. Build and export the image (on this machine)

```bash
cd /home/sim/Work/postmeme
docker build -t postmeme:latest .
docker save postmeme:latest | gzip > postmeme.tar.gz
```

Expect roughly 100-200MB compressed.

**Check CPU architecture first.** This machine builds `linux/amd64` images
(`uname -m` → `x86_64`). If the company machine is ARM (Apple Silicon, an
ARM server — `uname -m` there prints `aarch64` or `arm64`), the image won't
run as-is; cross-build instead:

```bash
docker buildx build --platform linux/arm64 -t postmeme:latest . --load
```

### 2. Copy the image and the master key over

```bash
scp postmeme.tar.gz config/master.key youruser@company-machine:/path/to/deploy/
```

A USB stick works just as well if there's no network path between the two
machines — `docker load` doesn't care how the file arrived.

`config/master.key` decrypts `config/credentials.yml.enc` (Rails' secrets
file). It is intentionally **not** committed to git and not included in the
Docker build context (see `.gitignore` / `.dockerignore`) — it must always
travel out-of-band like this, never baked into the image or pushed to a repo.

### 3. On the company machine: load and run

```bash
docker load < postmeme.tar.gz
# → Loaded image: postmeme:latest

docker volume create postmeme_storage

docker run -d \
  -p 127.0.0.1:3000:80 \
  -v postmeme_storage:/rails/storage \
  -e RAILS_MASTER_KEY=$(cat master.key) \
  --name postmeme \
  --restart unless-stopped \
  postmeme:latest
```

- `-v postmeme_storage:/rails/storage` persists the SQLite database across
  container restarts and rebuilds — without it, every `docker run` starts
  with an empty database.
- The entrypoint (`bin/docker-entrypoint`) runs `db:prepare` automatically
  on boot, so there's no manual migration step on first run.
- `-p 127.0.0.1:3000:80` binds to localhost only. See **Security note**
  below before changing this to expose the app on the network.

Visit `http://localhost:3000` (or `http://company-machine:3000` if bound
more broadly) and the app should be up.

### Day-to-day operations

```bash
docker logs -f postmeme                       # tail logs
docker restart postmeme                       # restart
docker exec -it postmeme bin/rails console    # poke at data live
docker exec -it postmeme bin/rails dbconsole  # raw SQL
```

### Shipping an update later

Repeat the same loop; the named volume persists independently of the
container, so replacing the container never touches saved data:

```bash
# on this machine
docker build -t postmeme:latest .
docker save postmeme:latest | gzip > postmeme.tar.gz
scp postmeme.tar.gz youruser@company-machine:/path/to/deploy/

# on the company machine
docker load < postmeme.tar.gz
docker stop postmeme && docker rm postmeme
docker run -d -p 127.0.0.1:3000:80 -v postmeme_storage:/rails/storage \
  -e RAILS_MASTER_KEY=$(cat master.key) --name postmeme --restart unless-stopped \
  postmeme:latest
```

## Security note: this app can reach internal services (SSRF)

`HttpExecutor` makes outbound requests to whatever URL the browser sends it,
server-side — that's the whole point (bypassing CORS), but it also means
anyone who can reach this app's port can use it to probe hosts on the
company network, including internal-only services and cloud metadata
endpoints (e.g. `169.254.169.254`). Keep the port bound to `127.0.0.1`
unless you've deliberately decided other machines should be able to use it,
and never expose it to the public internet without adding an allowlist or
denylist on the target host in `HttpExecutor`.
