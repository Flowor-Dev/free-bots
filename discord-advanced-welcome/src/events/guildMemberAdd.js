import { Events, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createWelcomeImage } from '../utils/canvas.js';
import { incrementJoinCount } from '../utils/database.js';
import dayjs from 'dayjs';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const guild = member.guild;
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    const logChannelId = process.env.LOG_CHANNEL_ID;
    
    const timestamp = Math.floor(Date.now() / 1000);
    const today = dayjs().format('YYYY-MM-DD');
    const memberCount = guild.memberCount.toLocaleString();
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const userTag = member.user.tag;
    const username = member.user.username;

    const promises = [];

    if (welcomeChannelId) {
      promises.push(
        (async () => {
          try {
            const welcomeChannel = await guild.channels.fetch(welcomeChannelId, { cache: true });
            if (!welcomeChannel) return;

            const imageBuffer = await createWelcomeImage({
              username,
              avatarURL,
              guildName: guild.name,
              memberCount
            });

            const welcomeEmbed = new EmbedBuilder()
              .setTitle('🎉 Welcome to the server!')
              .setDescription(
                `Hey ${member.user}, welcome to our server!\n\n` +
                `📋 Please read the rules channel to learn about server rules.\n` +
                `💬 Don't hesitate to introduce yourself to other members!\n` +
                `🎮 Have fun!`
              )
              .setColor(0x1f6feb)
              .setThumbnail(avatarURL)
              .addFields(
                { name: '👤 User', value: userTag, inline: true },
                { name: '👥 Member Count', value: `#${memberCount}`, inline: true },
                { name: '📅 Date', value: `<t:${timestamp}:F>`, inline: true }
              )
              .setFooter({ 
                text: `${guild.name} • Welcome System`, 
                iconURL: guild.iconURL() || undefined 
              })
              .setTimestamp();

            if (imageBuffer) {
              const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });
              welcomeEmbed.setImage('attachment://welcome.png');
              await welcomeChannel.send({
                embeds: [welcomeEmbed],
                files: [attachment]
              });
            } else {
              await welcomeChannel.send({ embeds: [welcomeEmbed] });
            }
          } catch (error) {
            console.error('Error sending welcome message:', error);
          }
        })()
      );
    }

    if (logChannelId) {
      promises.push(
        (async () => {
          try {
            const logChannel = await guild.channels.fetch(logChannelId, { cache: true });
            if (!logChannel) return;

            const accountAge = dayjs().diff(dayjs(member.user.createdAt), 'day');
            
            const logEmbed = new EmbedBuilder()
              .setTitle('✅ New Member Joined')
              .setDescription(`**${userTag}** joined the server!`)
              .addFields(
                { name: '👤 User', value: `${member.user} (${member.user.id})`, inline: true },
                { name: '📅 Account Age', value: `${accountAge} days`, inline: true },
                { name: '👥 Total Members', value: memberCount, inline: true }
              )
              .setThumbnail(member.user.displayAvatarURL())
              .setColor(0x58a6ff)
              .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
          } catch (error) {
            console.error('Error sending log message:', error);
          }
        })()
      );
    }

    promises.push(incrementJoinCount(today).catch(err => {
      console.error('Error incrementing join count:', err);
    }));

    await Promise.allSettled(promises);
  }
};

