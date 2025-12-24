# Development Guide
This guide will help you set up the development environment for SimplePanel-CS2.

## 📋 Prerequisites
- **Node.js** (v20.9.0 or higher)
- **pnpm** (or npm/yarn)
- **Git**
- **MySQL/MariaDB** database
- Access to your CS2 server's SimpleAdmin database

## 🛠️ Development Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/wiruwiru/SimplePanel-CS2.git
   cd SimplePanel-CS2
   ```

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

4. **Set up the database**:
   The database tables will be automatically created on first startup if your database credentials are configured correctly. Alternatively, you can manually run the SQL script located in `scripts/create-tables.sql` on your database.

5. **Run the development server**:
   ```bash
   pnpm dev
   ```
   Or using npm:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🏗️ Building for Production
To build the application for production:

```bash
pnpm build
```

Or using npm:
```bash
npm run build
```

The built files will be in the `build` directory.

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

## 📄 License
This project is licensed under a **Modified MIT License with Commercial and Attribution Restrictions**.

### Important Notes for Contributors:
- By contributing to this project, you agree that your contributions will be licensed under the same license
- **Commercial use is prohibited** without explicit permission from the author
- **Attribution is mandatory** - all distributions must maintain visible credits to WiruWiru
- Modified versions must clearly acknowledge the original author

For full license details, see [LICENSE](../LICENSE) file.

### Commercial License
To obtain a commercial license or use this software for commercial purposes, please contact the author at: [https://github.com/wiruwiru](https://github.com/wiruwiru)