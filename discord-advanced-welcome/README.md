Advanced Welcome + Join Graph Bot

A simple Discord bot that creates welcome images for users joining the server and tracks daily join statistics.

Features

Creates modern welcome images using Canvas

Saves daily join data to SQLite

Creates join graphs for the last 7/14/30 days

Sends join/leave logs to a separate channel

Sends graphs via /joingraph command

Installation
Requirements

Node.js 18+

A Discord bot token

Steps

1) Install dependencies:

npm install

2) Fill in .env:

TOKEN=BOT_TOKEN
GUILD_ID=GUILD_ID
WELCOME_CHANNEL_ID=CHANNEL_ID
LOG_CHANNEL_ID=CHANNEL_ID
GRAPH_CHANNEL_ID=CHANNEL_ID


3) Start the bot:

npm start

Folder Structure
advanced-welcome-bot/
  src/
    events/
      guildMemberAdd.js
      guildMemberRemove.js
      ready.js
    utils/
      canvas.js
      graph.js
      database.js
    bot.js
  database.sqlite
  package.json
  .env
  README.md

Commands
/joingraph

Displays the daily join graph.

Parameter:

range: 7 | 14 | 30

Example:

/joingraph range:14

Technologies

discord.js v14

sqlite3

canvas (optional)

chartjs-node-canvas

dayjs
