export async function createAdmin(data) {
  const response = await fetch('/api/admin/admins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al crear administrador')
  }

  return await response.json()
}

export async function updateAdmin(data) {
  const response = await fetch('/api/admin/admins', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al actualizar administrador')
  }

  return await response.json()
}

export async function deleteAdmin(steamId) {
  const response = await fetch(`/api/admin/admins?steamId=${steamId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al eliminar administrador')
  }

  return await response.json()
}