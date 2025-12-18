import { convertBigIntToString } from "@/utils/api-helpers"
import { getDiscordTranslations } from "@/lib/discord-i18n"

export async function sendDiscordWebhook(action, type, data, adminData, oldData = null) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not configured, skipping webhook')
    return
  }

  try {
    const t = await getDiscordTranslations()
    
    const actionLabel = t.actions?.[action] || action
    let typeLabel = t.types?.[type] || type

    if (type === 'ban_comment') {
      typeLabel = t.types?.ban_comment || 'Ban Comment'
    } else if (type === 'mute_comment') {
      typeLabel = t.types?.mute_comment || 'Mute Comment'
    }

    const colors = {
      create: 0xdc2626,
      update: 0xf59e0b,
      delete: 0xef4444,
      unban: 0x10b981,
      unmute: 0x10b981
    }

    const color = colors[action] || 0x6b7280
    const { formatDuration, formatDate } = await import("@/utils/formatters")

    const embed = {
      title: `${typeLabel} ${actionLabel}`,
      color: color,
      timestamp: new Date().toISOString(),
      fields: []
    }

    const playerSteamUrl = data.playerSteamId ? `https://steamcommunity.com/profiles/${String(data.playerSteamId)}` : null
    const adminSteamUrl = adminData.steamId ? `https://steamcommunity.com/profiles/${String(adminData.steamId)}` : null
    const playerName = data.playerName || t.values?.unknown || 'Unknown'
    const adminName = adminData.name || t.values?.root || 'Root'
    
    embed.fields.push({
      name: t.fields?.player || '👤 Player',
      value: playerSteamUrl ? `[${playerName}](${playerSteamUrl})` : playerName,
      inline: true
    })

    embed.fields.push({
      name: t.fields?.steamid || '🆔 SteamID',
      value: String(data.playerSteamId || t.values?.not_available || 'N/A'),
      inline: true
    })

    const isComment = type === 'ban_comment' || type === 'mute_comment'
    if (!isComment) {
      if (type === 'ban' && data.playerIp) {
        embed.fields.push({
          name: t.fields?.ip || '🌐 IP',
          value: data.playerIp,
          inline: true
        })
      }

      embed.fields.push({
        name: t.fields?.reason || '📝 Reason',
        value: data.reason || t.values?.no_reason || 'No reason specified',
        inline: false
      })

      embed.fields.push({
        name: t.fields?.duration || '⏱️ Duration',
        value: formatDuration(Number(data.duration)),
        inline: false
      })

      if (data.ends) {
        embed.fields.push({
          name: t.fields?.expires || '📅 Expires',
          value: formatDate(data.ends),
          inline: false
        })
      }

      if (type === 'mute' && data.type) {
        embed.fields.push({
          name: t.fields?.type || '🔇 Type',
          value: data.type,
          inline: false
        })
      }
    }

    embed.fields.push({
      name: t.fields?.administrator || '👨‍💼 Administrator',
      value: adminSteamUrl ? `[${adminName}](${adminSteamUrl})` : adminName,
      inline: true
    })

    embed.fields.push({
      name: t.fields?.sanction_id || '🆔 Sanction ID',
      value: String(data.id || t.values?.not_available || 'N/A'),
      inline: true
    })

    if ((type === 'ban_comment' || type === 'mute_comment') && data.comment) {
      embed.fields.push({
        name: t.fields?.comment || '💬 Comment',
        value: data.comment,
        inline: false
      })
    }

    if (action === 'unban' && data.unbanReason) {
      embed.fields.push({
        name: t.fields?.unban_reason || '📝 Unban Reason',
        value: data.unbanReason,
        inline: false
      })
    }

    if (action === 'unmute' && data.unmuteReason) {
      embed.fields.push({
        name: t.fields?.unmute_reason || '📝 Unmute Reason',
        value: data.unmuteReason,
        inline: false
      })
    }

    if (action === 'update' && oldData) {
      const changes = []
      const reasonLabel = t.fields?.reason || 'Reason'
      const durationLabel = t.fields?.duration || 'Duration'
      const statusLabel = t.fields?.status || 'Status'
      const typeLabel = t.fields?.type || 'Type'
      
      if (oldData.reason !== data.reason) {
        changes.push(`**${reasonLabel}:** "${oldData.reason}" → "${data.reason}"`)
      }
      
      if (oldData.duration !== data.duration) {
        changes.push(`**${durationLabel}:** ${formatDuration(Number(oldData.duration))} → ${formatDuration(Number(data.duration))}`)
      }
      
      if (oldData.status !== data.status) {
        changes.push(`**${statusLabel}:** ${oldData.status} → ${data.status}`)
      }
      
      if (type === 'mute' && oldData.type !== data.type) {
        changes.push(`**${typeLabel}:** ${oldData.type} → ${data.type}`)
      }

      if (changes.length > 0) {
        embed.fields.push({
          name: t.fields?.changes_made || '🔄 Changes made',
          value: changes.join('\n'),
          inline: false
        })
      }
    }

    embed.footer = {
      text: `CrisisiGamer`
    }

    const payload = {
      embeds: [embed]
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(convertBigIntToString(payload))
    })

    if (!response.ok) {
      console.error(`Error sending webhook to Discord: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error sending webhook to Discord:', error)
  }
}