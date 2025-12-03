import { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { createJoinGraph, deleteGraphFile } from './utils/graph.js';
import { getJoinData } from './utils/database.js';
import dayjs from 'dayjs';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.TOKEN) {
  console.error('Error: TOKEN is not set in .env file');
  console.error('Please create a .env file with your Discord bot token:');
  console.error('TOKEN=your_bot_token_here');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

const eventsPath = path.join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = await import(`file://${filePath}`);
  
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'joingraph') {
    await interaction.deferReply();

    try {
      const range = interaction.options.getInteger('range') || 7;
      
      if (![7, 14, 30].includes(range)) {
        return await interaction.editReply({
          content: '❌ Invalid range! You can only select 7, 14, or 30 days.'
        });
      }

      const graphPath = await createJoinGraph(range);
      
      if (graphPath) {
        const attachment = new AttachmentBuilder(graphPath, { name: 'joingraph.png' });

        const embed = new EmbedBuilder()
          .setTitle(`📊 Daily Joins - Last ${range} Days`)
          .setDescription(`Join graph for the last ${range} days`)
          .setImage('attachment://joingraph.png')
          .setColor(0x1f6feb)
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed],
          files: [attachment]
        });

        setTimeout(async () => {
          await deleteGraphFile(graphPath);
        }, 5000);
      } else {
        const data = await getJoinData(range);
        const description = data.length === 0
          ? `Join data for the last ${range} days:\n\nNo data available yet.`
          : `Join data for the last ${range} days:\n\n${data.map(row => 
              `📅 ${dayjs(row.date).format('MM/DD/YYYY')}: **${row.count}** joins`
            ).join('\n')}`;

        const embed = new EmbedBuilder()
          .setTitle(`📊 Daily Joins - Last ${range} Days`)
          .setDescription(description)
          .setColor(0x1f6feb)
          .setFooter({ text: 'Graph module not installed. Data shown in table format.' })
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed]
        });
      }

    } catch (error) {
      console.error('Error creating graph:', error);
      await interaction.editReply({
        content: '❌ An error occurred while creating the graph.'
      });
    }
  }
});

client.login(process.env.TOKEN);

