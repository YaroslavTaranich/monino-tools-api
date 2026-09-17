# Changelog

Все заметные изменения API публикуются в этом файле. Формат основан на
[Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии следуют SemVer.

## [1.1.0](https://github.com/YaroslavTaranich/monino-tools-api/compare/v1.0.2...v1.1.0) (2026-09-17)


### Новые возможности

* decouple gallery from legacy image column ([91d2783](https://github.com/YaroslavTaranich/monino-tools-api/commit/91d2783fb9179c7cf3f6b613cacbdeca40c0eb1a))
* decouple gallery from legacy image column ([94c1777](https://github.com/YaroslavTaranich/monino-tools-api/commit/94c1777dd450f040e7da3b53651cfd64d1172c36))

## [1.0.2](https://github.com/YaroslavTaranich/monino-tools-api/compare/v1.0.1...v1.0.2) (2026-09-16)


### CI

* automate versioned releases ([734e958](https://github.com/YaroslavTaranich/monino-tools-api/commit/734e95855aca3c29079de7798cc1d018d38ce41f))

## [1.0.1] — 2026-09-11

- Исправлена проверка соответствия Git-тега версии пакета в CI.

## [1.0.0] — 2026-09-11

- Зафиксирован первый стабильный API каталога аренды.
- Добавлены миграции, cookie-авторизация одного администратора, типы инструментов,
  сопутствующие позиции и галерея фотографий.
- Добавлена безопасная очистка потерянных изображений.
