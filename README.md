# SimplePanel-CS2
SimplePanel-CS2 is a web-based administration panel designed to manage bans, mutes, and administrative tasks for Counter-Strike 2 servers.

## 🚀 Features
- **🖥️ Server list**: View your server's details from Steam API.
- **🎮 Ban Management**: View, create, edit, and remove bans with full permission control.
- **🔇 Mute Management**: View, create, edit, and remove mutes with full permission control.
- **👥 Admin Management**: Create, edit, and manage administrators with granular permissions.
- **🔐 Permission System**: Flexible permission groups with hierarchical access control.
- **🔍 Player Search**: Search players through connection logs and history.
- **💬 Chat Logs**: View player chat messages (requires SimpleAdmin_ChatLogs module).
- **🌐 Multi-language Support**: Create custom language files or use the included ones (English, Spanish, Portuguese BR/PT). Language files are located in `public/lang/`.
- **🎨 Theme Customization**: Create custom themes or use the included ones (Default, Blue). Theme files are located in `public/themes/`.
- **🔑 Steam Authentication**: Secure login via Steam OpenID.

## 📋 Requirements
### Server Dependencies
Before installing SimplePanel-CS2, ensure you have the following dependencies installed on your CS2 server:
- **[CounterStrikeSharp](https://github.com/roflmuffin/CounterStrikeSharp)** (Minimum API Version: 342)
- **[Metamod:Source](https://www.sourcemm.net/downloads.php/?branch=master)**
- **[SimpleAdmin](https://github.com/daffyyyy/CS2-SimpleAdmin)**

#### SimpleAdmin Dependencies
SimpleAdmin requires the following additional plugins:
- **PlayerSettings** - Required by MenuManagerCS2
- **AnyBaseLibCS2** - Required by PlayerSettings
- **MenuManagerCS2**
- **MySQL database**

#### Chat Logs Support
To enable chat logs functionality, you need to install the following SimpleAdmin module:
- **[SimpleAdmin_ChatLogs](https://github.com/wiruwiru/SimpleAdmin_ChatLogs)**

### Application Dependencies
The panel itself requires:
- **Node.js** (v20.9.0 or higher)
- **pnpm** (or npm/yarn)
- **MySQL/MariaDB** database
- Access to your CS2 server's SimpleAdmin database

## 🛠️ Installation
1. **Download the latest release**:
   - Go to the [Releases page](https://github.com/wiruwiru/SimplePanel-CS2/releases)
   - Download the latest `SimplePanel-v*.zip` file
   - Extract it to your desired location

2. **Install dependencies**:
   ```bash
   pnpm install
   ```
   Or using npm:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory with your database and Steam authentication settings.

   #### Generating SESSION_SECRET
   You need to generate a secure random string for the `SESSION_SECRET` environment variable. Use one of the following methods:
   **Windows (Node.js)**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   **Linux/Mac**:
   ```bash
   openssl rand -base64 32
   ```

   #### Obtaining STEAM_API_KEY
   To get your Steam API key:
   1. Visit [https://steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
   2. Log in with your Steam account
   3. Register a new API key by providing a domain name.
   4. Copy the generated API key and add it to your `.env` file as `STEAM_API_KEY`

4. **Start the application**:
   ```bash
   pnpm start
   ```
   Or using npm:
   ```bash
   npm start
   ```

   The database tables will be automatically created on first startup if your database credentials are configured correctly.

> **Note**: If you want to modify or contribute to the project, see [DEVELOPMENT.md](./DEVELOPMENT.md) for development setup instructions.

## 📖 Available Permissions
### Administrative Access
* `@web/root` - Full access to all functionalities
* `@web/access` - Access to the administrative page
### Admin Management
* `@web/admin.create` - Create administrators
* `@web/admin.edit` - Edit any administrator
* `@web/admin.delete` - Delete any administrator
### Ban Management
* `@web/ban.view` - View ban list
* `@web/ban.add` - Add a ban
* `@web/ban.edit` - Edit any ban
* `@web/ban.edit.own` - Edit only own bans
* `@web/ban.unban` - Unban any ban
* `@web/ban.unban.own` - Unban only own bans
* `@web/ban.remove` - Remove any ban from registry
* `@web/ban.remove.own` - Remove only own bans from registry
* `@web/ban.comment.add` - Add comments to bans
* `@web/ban.comment.delete` - Delete any ban comment
* `@web/ban.comment.delete.own` - Delete only own ban comments
### Mute Management
* `@web/mute.view` - View mute list
* `@web/mute.add` - Add a mute
* `@web/mute.edit` - Edit any mute
* `@web/mute.edit.own` - Edit only own mutes
* `@web/mute.unmute` - Unmute any mute
* `@web/mute.unmute.own` - Unmute only own mutes
* `@web/mute.remove` - Remove any mute from registry
* `@web/mute.remove.own` - Remove only own mutes from registry
* `@web/mute.comment.add` - Add comments to mutes
* `@web/mute.comment.delete` - Delete any mute comment
* `@web/mute.comment.delete.own` - Delete only own mute comments
### Group Management
* `@web/group.create` - Create permission groups
* `@web/group.edit` - Edit permission groups
* `@web/group.delete` - Delete permission groups
### Player Search
* `@web/search.players` - Search players (through connection logs)
### Chat Logs
* `@web/chatlogs.view` - View messages sent by players

## 🔐 Permission Hierarchy
Permissions follow a hierarchical structure where:
- `@web/root` grants access to all functionalities
- General permissions (without `.own`) allow actions on any sanction
- `.own` permissions only allow actions on sanctions applied by the user themselves
- If a user has the general permission, they automatically have access to the `.own` permission

## 🗺️ Roadmap
### Current Version (v1.0.0)
- ✅ Ban management system
- ✅ Mute management system
- ✅ Admin management
- ✅ Permission groups
- ✅ Server groups
- ✅ Custom flags
- ✅ Player search
- ✅ Chat logs
- ✅ Multi-language
- ✅ Theme customization
- ✅ Discord notifications (webhook)
- ✅ Add comments to sanctions

### Upcoming features
- [ ] Audit log viewer
- [ ] Automated panel installation
- [ ] Responsive and style improvements
- [ ] Players can view their active penalties and history when logged in
- [ ] SimpleAdmin module that helps to easily manage penalties to make the panel more effective.

### Feature ideas
- [ ] Reports and appeals
- [ ] Ticket system

## 📄 License

This project is licensed under a **Modified MIT License with Commercial and Attribution Restrictions**.

### Key Restrictions:
- **🚫 Commercial Use Prohibited**: The software may not be used for commercial purposes without explicit permission
- **📝 Mandatory Attribution**: You must maintain visible attribution to WiruWiru in all copies and distributions
- **⚠️ No Removal of Credits**: You may not remove, obscure, or modify credits to the original author

### Commercial License
To obtain a commercial license or use this software for commercial purposes, please contact the author at: [https://github.com/wiruwiru](https://github.com/wiruwiru)

For full license details, see [LICENSE](./LICENSE) file.

## 📞 Support
- **Issues**: [GitHub Issues](https://github.com/wiruwiru/SimplePanel-CS2/issues)

---