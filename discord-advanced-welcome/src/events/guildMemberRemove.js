import { Events, EmbedBuilder } from 'discord.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const guild = member.guild;
    const logChannelId = process.env.LOG_CHANNEL_ID;

    if (logChannelId) {
      try {
        const logChannel = await guild.channels.fetch(logChannelId, { cache: true });
        if (!logChannel) return;

        const userTag = member.user.tag;
        const memberCount = guild.memberCount.toLocaleString();
        
        const logEmbed = new EmbedBuilder()
          .setTitle('👋 Member Left')
          .setDescription(`**${userTag}** left the server.`)
          .addFields(
            { name: '👤 User', value: `${userTag} (${member.user.id})`, inline: true },
            { name: '👥 Remaining Members', value: memberCount, inline: true }
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setColor(0xff6b6b)
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      } catch (error) {
        console.error('Error sending leave log message:', error);
      }
    }
  }
};

