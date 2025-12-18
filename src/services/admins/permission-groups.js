export async function createPermissionGroup(data) {
  const response = await fetch('/api/admin/admins/permission-groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al crear grupo de permisos')
  }

  return await response.json()
}

export async function updatePermissionGroup(id, data) {
  const response = await fetch(`/api/admin/admins/permission-groups?id=${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al actualizar grupo de permisos')
  }

  return await response.json()
}

export async function deletePermissionGroup(id) {
  const response = await fetch(`/api/admin/admins/permission-groups?id=${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al eliminar grupo de permisos')
  }

  return await response.json()
}