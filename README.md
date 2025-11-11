## Available flags

### Administrative Access
* `@web/root` - Acceso completo a todas las funcionalidades
* `@web/access` - Acceso a la página administrativa

### Admin Management
* `@web/admin.create` - Crear administradores
* `@web/admin.edit` - Editar cualquier administrador
* `@web/admin.delete` - Eliminar cualquier administrador

### Ban Management
* `@web/ban.view` - Ver lista de bans
* `@web/ban.add` - Añadir un ban
* `@web/ban.edit` - Editar cualquier baneo
* `@web/ban.edit.own` - Editar solo baneos propios
* `@web/ban.unban` - Desbanear cualquier baneo
* `@web/ban.unban.own` - Desbanear solo baneos propios
* `@web/ban.remove` - Remover cualquier baneo del registro
* `@web/ban.remove.own` - Remover solo baneos propios del registro

### Mute Management
* `@web/mute.view` - Ver la lista de muteos
* `@web/mute.add` - Añadir un mute
* `@web/mute.edit` - Editar cualquier muteo
* `@web/mute.edit.own` - Editar solo muteos propios
* `@web/mute.unmute` - Desbanear cualquier muteo
* `@web/mute.unmute.own` - Desmutear solo muteos propios
* `@web/mute.remove` - Remover cualquier muteo del registro
* `@web/mute.remove.own` - Remover solo muteos propios del registro

### Group Management
* `@web/group.create` - Crear grupos de permisos
* `@web/group.edit` - Editar grupos de permisos
* `@web/group.delete` - Eliminar grupos de permisos

### Player Search
* `@web/search.players` - Buscar jugadores (mediante los logs de conexiones)

## Permission Hierarchy
Los permisos siguen una jerarquía donde:
- `@web/root` otorga acceso a todas las funcionalidades
- Los permisos generales (sin `.own`) permiten acciones sobre cualquier sanción
- Los permisos `.own` solo permiten acciones sobre sanciones aplicadas por el propio usuario
- Si un usuario tiene el permiso general, automáticamente tiene acceso al `.own`