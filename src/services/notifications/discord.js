import { convertBigIntToString } from "@/utils/api-helpers"

/**
 * @param {string} action - Action performed: 'create', 'update', 'delete', 'unban', 'unmute'
 * @param {string} type - Type of sanction: 'ban' or 'mute'
 * @param {object} data - Current sanction data
 * @param {object} adminData - Admin data who performs the action
 * @param {object|null} oldData - Previous data (only for 'update' actions)
 */
export async function sendDiscordWebhook(action, type, data, adminData, oldData = null) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not configured, skipping webhook')
    return
  }

  try {
    const actionLabels = {
      create: 'creado',
      update: 'modificado',
      delete: 'eliminado',
      unban: 'desbaneado',
      unmute: 'desmuteado'
    }

    const typeLabels = {
      ban: 'Baneo',
      mute: 'Muteo'
    }

    const actionLabel = actionLabels[action] || action
    const typeLabel = typeLabels[type] || type

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
    const playerName = data.playerName || 'Desconocido'
    const adminName = adminData.name || 'Root'
    
    embed.fields.push({
      name: '👤 Jugador',
      value: playerSteamUrl ? `[${playerName}](${playerSteamUrl})` : playerName,
      inline: true
    })

    embed.fields.push({
      name: '🆔 SteamID',
      value: String(data.playerSteamId || 'N/A'),
      inline: true
    })

    if (type === 'ban' && data.playerIp) {
      embed.fields.push({
        name: '🌐 IP',
        value: data.playerIp,
        inline: true
      })
    }

    embed.fields.push({
      name: '📝 Razón',
      value: data.reason || 'Sin razón especificada',
      inline: false
    })

    embed.fields.push({
      name: '⏱️ Duración',
      value: formatDuration(Number(data.duration)),
      inline: false
    })

    if (data.ends) {
      embed.fields.push({
        name: '📅 Expira',
        value: formatDate(data.ends),
        inline: false
      })
    }

    if (type === 'mute' && data.type) {
      embed.fields.push({
        name: '🔇 Tipo',
        value: data.type,
        inline: false
      })
    }

    embed.fields.push({
      name: '👨‍💼 Administrador',
      value: adminSteamUrl ? `[${adminName}](${adminSteamUrl})` : adminName,
      inline: true
    })

    embed.fields.push({
      name: '🆔 ID de Sanción',
      value: String(data.id || 'N/A'),
      inline: true
    })

    if (action === 'update' && oldData) {
      const changes = []
      
      if (oldData.reason !== data.reason) {
        changes.push(`**Razón:** "${oldData.reason}" → "${data.reason}"`)
      }
      
      if (oldData.duration !== data.duration) {
        changes.push(`**Duración:** ${formatDuration(Number(oldData.duration))} → ${formatDuration(Number(data.duration))}`)
      }
      
      if (oldData.status !== data.status) {
        changes.push(`**Estado:** ${oldData.status} → ${data.status}`)
      }
      
      if (type === 'mute' && oldData.type !== data.type) {
        changes.push(`**Tipo:** ${oldData.type} → ${data.type}`)
      }

      if (changes.length > 0) {
        embed.fields.push({
          name: '🔄 Cambios realizados',
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