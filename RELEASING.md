# Выпуск версии

Релизы формируются автоматически из conventional commits. Основные типы:

- `fix:` выпускает patch-версию;
- `feat:` выпускает minor-версию;
- `feat!:`, `fix!:` или footer `BREAKING CHANGE:` выпускает major-версию;
- `docs:`, `refactor:`, `perf:`, `build:`, `ci:`, `test:`, `style:`, `chore:` и `ops:` описывают остальные изменения.

После появления релизных изменений Release Please создаёт или обновляет release PR.
Его слияние обновляет `package.json`, `package-lock.json` и `CHANGELOG.md`, затем
создаёт тег `vX.Y.Z` и GitHub Release.

Workflow использует встроенный `GITHUB_TOKEN`. Если в репозитории задан secret
`RELEASE_PLEASE_TOKEN` с правами на contents и pull requests, он используется
вместо встроенного токена, чтобы созданные ботом PR и теги запускали остальные
GitHub Actions workflow.
