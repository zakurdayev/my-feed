# My feed · 0.1.1

Отдельный Android-first R&D-проект: вертикальная полноэкранная лента фотографий на React 19, TypeScript, Vite и Capacitor 8. Не является частью My или Day M.

## Запуск

Требуется Node.js 22+.

```bash
npm install
npm run dev
npm test
npm run build
```

## Android

Нужны Android Studio 2025.2.1+, Android SDK 36 и совместимый JDK (рекомендуется встроенный в Android Studio JDK 21). Укажите SDK через ANDROID_HOME или android/local.properties (sdk.dir).

```bash
npm run build
npx cap sync android
npx cap open android
```

Debug APK из PowerShell:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Результат: `android/app/build/outputs/apk/debug/my-feed-0.1.apk`. Production signing не настроен. После изменения web-кода повторяйте build и sync.

Версия Android задаётся в `android/gradle.properties`: `MY_FEED_VERSION_NAME=0.1`, `MY_FEED_VERSION_CODE=2`. При следующей версии измените имя, например на `0.2`, и увеличьте целочисленный code для установки обновлений. Gradle автоматически сформирует `my-feed-0.2.apk`; отдельного переименования нет. Версия npm-пакета не управляет версией APK.

На текущей машине системный JDK 25 не подходит для Gradle 8.14.3. Успешная проверка выполнена с уже установленными инструментами (пути только для этой машины):

```powershell
$env:JAVA_HOME='C:\projects\my-life\.tools\jdk\jdk-21.0.12.1+1'
$env:ANDROID_HOME='C:\projects\my-life\.tools\android-sdk'
cd android
.\gradlew.bat assembleDebug
```

Проверка жестов и safe area на физическом Android-устройстве не выполнялась.

## Импорт JSON (0.1.1)

На главном экране: Imported feeds → + Import collection. Нативный системный file picker Android открывается стандартным `<input type="file" accept="application/json,.json">` через встроенный `BridgeWebChromeClient` Capacitor; дополнительный picker plugin и разрешение на всё хранилище не нужны. Отмена выбора ничего не меняет; тот же файл можно выбрать повторно.

Пример файла: `examples/remote-test.json` (5 удалённых фотографий). Перенесите его в Downloads устройства и выберите через Import collection. Изображения при импорте не запрашиваются. Откройте карточку, включите Debug и проверьте `source: remote`, `loaded`, `natural`; проверьте свайпы, ошибку/Retry, возврат назад, повторный запуск приложения, повторный импорт и Remove collection.

Contract: `{ version: 1, collection: { id, title }, items: [{ id, type: "image", title?, mediaUrl, width?, height?, metadata? }] }`. Validation/normalization находится в `src/import/collections.ts`: обязательные непустые поля, уникальные item id; ошибочные items и дубликаты пропускаются с подсчётом. Первый валидный item с данным id сохраняется. Отсутствующий title нормализуется в пустую строку; некорректные необязательные размеры/metadata отбрасываются. Разрешены абсолютные HTTPS media URL без credentials. Неподдерживаемая версия, сломанная структура и отсутствие валидных items отклоняют весь файл. `collection.id = models` зарезервирован.

Хранилище: `src/import/storage.ts`, официальный `@capacitor/preferences` (Android SharedPreferences; web fallback — localStorage). Хранятся только нормализованные данные и URL под ключом `my-feed.imported-collections.v1`, без файлов изображений. Запись завершается до обновления UI; при ошибке записи текущий список сохраняется. Совпадающий collection.id заменяет imported collection. Remove collection удаляет только imported feed. После удаления приложения данные удаляются. Preferences предназначен для небольших тестовых коллекций.

`DiscoveryFeed` и `ImageMedia` общие для обеих категорий; локальная Models не изменена. Настройки Debug и тестовой ошибки остаются в памяти.

## Архитектура и проверка

`src/feed/DiscoveryFeed.tsx` — generic-компонент, независимый от Models: snap, IntersectionObserver, activeIndex, контекст previous/current/next и окно загрузки от −1 до +2. `renderItem` задаёт предметное представление. `ImageMedia` обеспечивает loading/error/retry и сохраняет уже загруженные изображения в DOM без собственного cache manager. Новые src следует передавать с новым React key.

Mock items: `src/data/mockModels.ts`. Семь локальных фотографий: `public/media/images`. Имена вымышленные и не идентифицируют людей на фотографиях. Происхождение фотографий — `public/media/images/SOURCES.md`; приложение не обращается к источнику во время работы.

На стартовом экране нажмите Models. Свайпайте вверх/вниз; на клавиатуре доступны стрелки. Debug включается на стартовом экране и поверх ленты. Показывает индекс (с 1), activeIndex (с 0), id, distance, loaded/error, natural size и online. Test broken image заменяет URL третьей карточки: проверьте ошибку, Retry и переход к четвёртой карточке. Назад возвращает к коллекциям, аппаратная кнопка Android также обработана. Настройки хранятся только в памяти.

Проверьте на устройстве: размер карточки при изменении системных панелей/ориентации, быстрые свайпы, возврат к загруженной карточке, отсутствие белых вспышек. Автотесты покрывают окно загрузки, смену active item, отложенный src, retry и сохранение загруженного DOM; они не заменяют проверку жестов в WebView.

Scope 0.1.1: локальная Models и импорт конечных image-feed коллекций из JSON. Без scraping, backend, видео, аудио, Save, Service Worker и offline-first. Все посещённые изображения сохраняются в DOM: подходит для маленьких тестовых коллекций. Доступность удалённых URL и запреты hotlink зависят от источника; ошибка изображения обрабатывается существующим ImageMedia.
