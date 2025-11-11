export async function createServerGroup(data) {
  const response = await fetch('/api/admin/admins/server-groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al crear grupo de servidores')
  }

  return await response.json()
}

export async function updateServerGroup(id, data) {
  const response = await fetch(`/api/admin/admins/server-groups?id=${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al actualizar grupo de servidores')
  }

  return await response.json()
}

export async function deleteServerGroup(id) {
  const response = await fetch(`/api/admin/admins/server-groups?id=${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al eliminar grupo de servidores')
  }

  return await response.json()
}