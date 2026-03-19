Установка APK на эмулятор
Вариант 1 — Терминал
Шаг 1. Запусти эмулятор


~/Android/Sdk/emulator/emulator -avd Medium_Phone_API_36.0 -no-snapshot-load &
Шаг 2. Подожди пока загрузится (15–20 сек), затем установи APK


adb -s emulator-5554 install -r ~/Programming/mobile/android/app/build/outputs/apk/debug/app-debug.apk
Шаг 3. Пробрось порт бэкенда


adb -s emulator-5554 reverse tcp:8000 tcp:8000
Шаг 4. Запусти приложение


adb -s emulator-5554 shell am start -n com.anirate.app/.MainActivity
Вариант 2 — Реальный телефон (USB)
Шаг 1. Подключи телефон по USB, разреши отладку

Шаг 2.


adb devices  # убедись что телефон виден
adb -s PZXCUOR4JNMRTG6H install -r ~/Programming/mobile/android/app/build/outputs/apk/debug/app-debug.apk
adb -s PZXCUOR4JNMRTG6H reverse tcp:8000 tcp:8000
adb -s PZXCUOR4JNMRTG6H shell am start -n com.anirate.app/.MainActivity
Скрипт для удобства
Можешь сохранить как deploy.sh в папке проекта:


#!/bin/bash
DEVICE=${1:-emulator-5554}
APK=~/Programming/mobile/android/app/build/outputs/apk/debug/app-debug.apk

echo "Installing on $DEVICE..."
adb -s $DEVICE install -r $APK
adb -s $DEVICE reverse tcp:8000 tcp:8000
adb -s $DEVICE shell am start -n com.anirate.app/.MainActivity
echo "Done!"
Использование:


chmod +x deploy.sh
./deploy.sh                      # для эмулятора
./deploy.sh PZXCUOR4JNMRTG6H    # для телефона