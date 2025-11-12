export async function createBan(data) {
  const response = await fetch('/api/admin/sanctions/bans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerSteamId: data.steamId,
      playerIp: data.ip || null,
      playerName: data.playerName || null,
      reason: data.reason,
      duration: parseInt(data.duration) || 0,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear ban');
  }

  return await response.json();
}

export async function updateBan(id, data) {
  const response = await fetch('/api/admin/sanctions/bans', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      reason: data.reason,
      duration: data.duration !== undefined ? parseInt(data.duration) : undefined,
      status: data.status,
      unbanReason: data.unbanReason,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar ban');
  }

  return await response.json();
}

export async function deleteBan(id) {
  const response = await fetch(`/api/admin/sanctions/bans?id=${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar ban');
  }

  return await response.json();
}

export async function unbanBan(id, unbanReason) {
  return updateBan(id, { status: 'UNBANNED', unbanReason });
}