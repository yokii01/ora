# ORAs 🌌

A premium, production-ready full-stack intelligent operating system built with React, Vite, and Tailwind CSS. 

ORAs features an Apple-native inspired design system, smooth 60fps animations, glassmorphism UI elements, and a suite of fully functional productivity modules designed to behave like a futuristic OS.

## 🚀 Features

- **Habito Analytics**: Advanced habit tracking with a GitHub-style yearly consistency heatmap, 30-day streak analysis, and ambient artwork for meditation tracking.
- **Routo Map Engine**: A highly robust map interface (V3.0) with dynamic 6-layer fallbacks, OpenStreetMap integration, and strict real-device GPS tracking.
- **ORAs Assistant**: A proactive OS-level AI capable of interacting with the file system, parsing CRUD operations for native apps, and handling UI-based file uploads.
- **Notes Editor**: A professional Rich Text Reader/Editor built on Quill with advanced typography formatting and syntax highlighting.
- **Vault Manager**: Secure and encrypted credential management for passwords and secure notes.
- **Finance Tracker**: Visualize and manage transactions and budgeting.
- **Calendar & Events**: Comprehensive day/week/month planner.
- **Scanner Integration**: Robust document scanning utilizing device cameras and Tesseract OCR.

## 📦 Installation

To get the project running locally, simply clone the repository and install the dependencies:

```bash
git clone https://github.com/yokii01/ora.git
cd ora
npm install
```

## 🔐 Environment Variables

Copy the `.env.example` file to `.env` in the root of your project:

```bash
cp .env.example .env
```

Ensure the following critical environment variables are correctly configured:
- `VITE_BASE44_APP_ID`: Your unique backend application identifier.
- `VITE_BASE44_APP_BASE_URL`: The URL of your API backend.

(Refer to `.env.example` for additional AI and provider-generated OAuth URLs).

## 🛠️ Local Development

Start the Vite development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## 🏗️ Build & Run

To create a production-optimized build:

```bash
npm run build
```

This will generate a `dist` directory. You can preview the production build locally using:

```bash
npm run preview
```

## 🌍 Deployment

This repository is strictly configured to be GitHub Pages ready. Because the application utilizes Vite, deploying to GitHub Pages is seamless.

1. Ensure your `vite.config.js` is properly configured with `base: '/ora/'` (already handled in production mode).
2. Commit and push your code to your GitHub repository's `main` branch.
3. In your GitHub repository, navigate to **Settings > Pages**.
4. Set the Source to **GitHub Actions**.
5. GitHub will automatically detect the Vite build process and deploy your site to `https://yokii01.github.io/ora/`.

*(If deploying manually to another service like Vercel or Netlify, simply point the build command to `npm run build` and output directory to `dist`).*

## 📜 License

This project is proprietary and confidential.
