# Развёртывание на Ubuntu

ChelTum — Telegram-бот на Node.js и TypeScript. Для размещения на Ubuntu-сервере нужны Git и Node.js 20 или новее с npm. Токен бота можно получить у [@BotFather](https://t.me/BotFather).

Бот использует long polling, поэтому домен, Nginx и открытый входящий порт не требуются. Серверу нужен исходящий доступ к интернету. Не запускайте несколько копий бота с одним токеном одновременно.

## Установка и сборка

Подключитесь к серверу по SSH и выполните:

```bash
sudo apt update
sudo apt install -y git curl ca-certificates

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v

git clone https://github.com/Vpride2000/ChelTum.git
cd ChelTum
npm ci
npm run build
```

## Запуск как службы systemd

Так бот будет работать после выхода из SSH и автоматически перезапускаться при сбое.

1. Создайте файл с токеном:

   ```bash
   sudo nano /etc/cheltum.env
   ```

   Добавьте строку, заменив значение на токен от BotFather:

   ```text
   TELEGRAM_BOT_TOKEN=вставьте_сюда_токен
   ```

   Сохраните файл и ограничьте к нему доступ:

   ```bash
   sudo chmod 600 /etc/cheltum.env
   ```

2. Узнайте имя пользователя и полный путь к проекту:

   ```bash
   whoami
   pwd
   ```

   Создайте файл службы:

   ```bash
   sudo nano /etc/systemd/system/cheltum.service
   ```

   Вставьте конфигурацию, заменив `ubuntu` на имя пользователя из `whoami`, а `/home/ubuntu/ChelTum` — на путь к проекту из `pwd`:

   ```ini
   [Unit]
   Description=ChelTum Telegram bot
   After=network-online.target
   Wants=network-online.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/ChelTum
   EnvironmentFile=/etc/cheltum.env
   ExecStart=/usr/bin/node /home/ubuntu/ChelTum/dist/bot.js
   Restart=on-failure
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

3. Включите автозапуск и запустите службу:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now cheltum
   sudo systemctl status cheltum
   ```

Просмотр журнала:

```bash
sudo journalctl -u cheltum -f
```

## Обновление

После изменений в репозитории обновите и перезапустите бота:

```bash
cd /путь/к/ChelTum
git pull
npm ci
npm run build
sudo systemctl restart cheltum
```

Не публикуйте токен и не добавляйте его в Git.
