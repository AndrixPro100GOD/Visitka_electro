# Интекс-Электро — сайт-визитка

Одностраничный сайт компании **Интекс-Электро** (тёмная тема) для публикации на **GitHub Pages**.

## Структура

```
index.html          — главная страница
css/styles.css      — стили
js/main.js          — меню, FAQ, форма
assets/img/         — логотип, продукция, партнёры, карта
favicon.ico         — иконка сайта
```

## Локальный просмотр

Откройте `index.html` в браузере или поднимите простой сервер:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

## GitHub Pages

1. Создайте репозиторий и запушьте ветку `main` (или `gh-pages`).
2. Settings → Pages → Source: **Deploy from a branch**.
3. Branch: `main` / folder: `/ (root)`.
4. Сайт будет доступен по адресу `https://<user>.github.io/<repo>/`.

Папка `References_pdf/` в репозиторий не попадает (см. `.gitignore`).

## Контакты (из макета)

- Тел.: +7 (904) 386-65-90, +7 (343) 271-22-99  
- Email: oooIntexelectro@mail.ru  
- Екатеринбург, ул. Ясная, 31, оф. 107  
