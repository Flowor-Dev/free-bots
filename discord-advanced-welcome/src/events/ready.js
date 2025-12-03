import { Events, REST, Routes } from 'discord.js';
import { initializeDatabase } from '../utils/database.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Bot ready! Logged in as ${client.user.tag}`);
    
    await initializeDatabase();
    
    client.user.setActivity('Welcome System', { type: 'WATCHING' });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    const commands = [
      {
        name: 'joingraph',
        description: 'Show daily join graph',
        options: [
          {
            name: 'range',
            type: 4,
            description: 'Number of days to show in the graph',
            required: false,
            choices: [
              { name: '7 Days', value: 7 },
              { name: '14 Days', value: 14 },
              { name: '30 Days', value: 30 }
            ]
          }
        ]
      }
    ];

    try {
      console.log('Registering slash commands...');

      const guildId = process.env.GUILD_ID;
      
      if (guildId) {
        try {
          const guild = await client.guilds.fetch(guildId, { cache: true });
          if (guild) {
            await rest.put(
              Routes.applicationGuildCommands(client.user.id, guildId),
              { body: commands }
            );
            console.log(`Slash commands successfully registered to "${guild.name}" server`);
          }
        } catch (guildError) {
          console.warn(`Bot not found in server with ID "${guildId}" or access denied`);
          console.log('Registering global commands...');
          
          try {
            await rest.put(
              Routes.applicationCommands(client.user.id),
              { body: commands }
            );
            console.log('Global slash commands successfully registered');
            console.log('Note: Commands may take up to 1 hour to appear');
          } catch (globalError) {
            console.error('Failed to register global commands:', globalError.message);
          }
        }
      } else {
        await rest.put(
          Routes.applicationCommands(client.user.id),
          { body: commands }
        );
        console.log('Global slash commands successfully registered');
        console.log('Note: Commands may take up to 1 hour to appear');
      }
    } catch (error) {
      if (error.code === 50001) {
        console.error('Error registering commands: Bot does not have access to the server');
        console.log('Solution: Add the bot to the server or check GUILD_ID in .env file');
      } else {
        console.error('Error registering commands:', error.message);
      }
    }
  }
};

