export async function sendDiscordWebhook(action, type, data, adminData, oldData = null) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL no está configurado, omitiendo webhook')
    return
  }

  try {
    const actionLabels = {
      create: 'Creada',
      update: 'Modificada',
      delete: 'Eliminada',
      unban: 'Desbaneada',
      unmute: 'Desmuteada'
    }

    const typeLabels = {
      ban: 'Ban',
      mute: 'Mute'
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

    const formatDuration = (minutes) => {
      if (!minutes || minutes === 0) return 'Permanente'
      if (minutes < 60) return `${minutes} minutos`
      if (minutes < 1440) return `${Math.floor(minutes / 60)} horas`
      return `${Math.floor(minutes / 1440)} días`
    }

    const formatDate = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const embed = {
      title: `${typeLabel} ${actionLabel}`,
      color: color,
      timestamp: new Date().toISOString(),
      fields: []
    }

    embed.fields.push({
      name: '👤 Jugador',
      value: data.playerName || 'Desconocido',
      inline: true
    })

    embed.fields.push({
      name: '🆔 SteamID',
      value: data.playerSteamId || 'N/A',
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
      name: '👨‍💼 Administrador',
      value: adminData.name || 'Root',
      inline: true
    })

    if (adminData.steamId) {
      embed.fields.push({
        name: '🆔 Admin SteamID',
        value: adminData.steamId,
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
      value: formatDuration(data.duration),
      inline: true
    })

    if (data.ends) {
      embed.fields.push({
        name: '📅 Expira',
        value: formatDate(data.ends),
        inline: true
      })
    }

    if (type === 'mute' && data.type) {
      embed.fields.push({
        name: '🔇 Tipo',
        value: data.type,
        inline: true
      })
    }

    embed.fields.push({
      name: '📊 Estado',
      value: data.status || 'ACTIVE',
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
        changes.push(`**Duración:** ${formatDuration(oldData.duration)} → ${formatDuration(data.duration)}`)
      }
      
      if (oldData.status !== data.status) {
        changes.push(`**Estado:** ${oldData.status} → ${data.status}`)
      }
      
      if (type === 'mute' && oldData.type !== data.type) {
        changes.push(`**Tipo:** ${oldData.type} → ${data.type}`)
      }

      if (changes.length > 0) {
        embed.fields.push({
          name: '🔄 Cambios Realizados',
          value: changes.join('\n'),
          inline: false
        })
      }
    }

    embed.footer = {
      text: `CrisisiGamer • ${new Date().toLocaleDateString('es-AR')}`
    }

    const payload = {
      embeds: [embed]
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error(`Error enviando webhook a Discord: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error al enviar webhook a Discord:', error)
  }
}