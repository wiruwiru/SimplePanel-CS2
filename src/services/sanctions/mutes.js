export async function createMute(data) {
  const response = await fetch('/api/admin/sanctions/mutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerSteamId: data.steamId,
      playerName: data.playerName || null,
      reason: data.reason,
      duration: parseInt(data.duration) || 0,
      type: data.type || 'GAG',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear mute');
  }

  return await response.json();
}

export async function updateMute(id, data) {
  const response = await fetch('/api/admin/sanctions/mutes', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      playerSteamId: data.steamId,
      reason: data.reason,
      duration: data.duration !== undefined ? parseInt(data.duration) : undefined,
      status: data.status,
      type: data.type,
      unmuteReason: data.unmuteReason,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar mute');
  }

  return await response.json();
}

export async function deleteMute(id) {
  const response = await fetch(`/api/admin/sanctions/mutes?id=${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar mute');
  }

  return await response.json();
}

export async function unmuteMute(id, unmuteReason) {
  return updateMute(id, { status: 'UNMUTED', unmuteReason });
}