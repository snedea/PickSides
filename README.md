# PickSides

> **TikTok-style AI debate app with intelligent persona system and bilingual support**

<p align="center">
  <img src="https://img.shields.io/badge/version-0.0.7-green.svg" alt="Version">
  <img src="https://img.shields.io/badge/Next.js-14-blue.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/AI-OpenAI%20%7C%20Claude%20%7C%20Gemini-purple.svg" alt="AI Models">
  <img src="https://img.shields.io/badge/languages-English%20%7C%20Romanian-orange.svg" alt="Languages">
  <img src="https://img.shields.io/badge/database-PostgreSQL%20%7C%20Supabase-red.svg" alt="Database">
</p>

PickSides is a modern debate application that generates AI-powered debates between different personas on any topic. Experience engaging 3-round debates with historical figures, philosophers, or custom personalities in a TikTok-inspired interface.

## ✨ Features

### 🤖 **Database-Powered AI Persona System**
- **7 Default Personas**: Socrates, Einstein, Ayn Rand, Shakespeare, Nietzsche, Tzara, and Default AI
- **Community-Contributed Personas**: Add any historical figure with just their name
- **AI Research Pipeline**: Claude researches biographical data, GPT-4 creates personality profiles
- **Persistent Storage**: PostgreSQL database with deduplication and quality assessment
- **Authentic Responses**: AIs embody personality, communication style, and philosophical views
- **Multi-Model Support**: OpenAI GPT-4, Anthropic Claude, and Google Gemini

### 🌍 **Bilingual Support**
- **Complete Localization**: English and Romanian with natural translations
- **Smart Language Switching**: Seamless content switching with intelligent fallbacks
- **Asynchronous Generation**: Background content generation without blocking UI
- **Real-time Notifications**: Beautiful progress indicators and completion alerts

### 📱 **Modern Mobile-First Design**
- **TikTok-Style Interface**: Intuitive navigation optimized for mobile
- **Heart-Button Voting**: Clear ♡/❤️ voting interface with edit capabilities
- **Glassmorphism UI**: Dark theme with modern visual effects
- **Button-Only Navigation**: Accessible, discoverable controls without hidden gestures

### 🎯 **Enhanced User Experience**
- **3-Round Debate Structure**: Opening, Counter-argument, and Closing statements
- **TL;DR Summaries**: Quick scanning with detailed arguments available
- **Visual Progress Tracking**: 🟢🔴⚪ indicators for debate completion status
- **Vote Management**: Review, edit, and track all voting decisions

## 🚀 Quick Start

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd picksides
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup (Supabase)**
   - Create a [Supabase](https://supabase.com) project
   - Run the migration to create the persona system tables:
   ```bash
   # Using Supabase CLI
   npx supabase db push
   
   # Or manually run the SQL migration in your Supabase dashboard:
   # supabase/migrations/20241208000000_add_crowdsourced_personas.sql
   ```

4. **Environment Configuration**
   Create `.env.local` file:
   ```env
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_claude_key
   GOOGLE_API_KEY=your_gemini_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`

### Production Deployment

#### Using PM2 (Recommended)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   ```

3. **Monitor application**
   ```bash
   pm2 status
   pm2 logs picksides
   pm2 monit
   ```

The application will run on port 3002 in production mode with automatic restarts, memory management, and logging.

## 🏗 Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, CSS Modules
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **AI Models**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Process Manager**: PM2
- **Styling**: CSS Modules with Glassmorphism effects

### Component Structure
```
PickSides/
├── app/
│   ├── components/
│   │   ├── SwipeDebateContainer.js    # Main debate logic
│   │   ├── DebateCard.js              # Individual debate rounds
│   │   ├── BottomNavBar.js            # Navigation controls
│   │   ├── PersonaSelector.js         # Persona management
│   │   └── DebateOverview.js          # Home screen grid
│   ├── api/
│   │   ├── debates/                   # Debate CRUD operations
│   │   └── debate/
│   │       └── generate-language/     # Bilingual generation
│   └── contexts/
│       └── LanguageContext.js         # Language state management
├── ecosystem.config.js                # PM2 configuration
└── CLAUDE.md                         # Development documentation
```

## 🎮 Usage

### Creating Debates
1. Click the **➕** button in the bottom navigation
2. Enter your debate topic
3. Select personas for Pro and Con sides
4. Wait for AI generation (3-5 seconds)

### Navigation
- **🏠 Home**: Return to debate overview grid
- **🇬🇧/🇷🇴**: Switch between English and Romanian
- **📄**: Current debate position indicator
- **⭐**: Future features placeholder

### Voting System
1. Read through debate rounds (Opening → Counter → Closing)
2. Tap heart buttons (♡) to vote on each round
3. View final results and overall debate winner
4. Edit votes anytime by tapping filled hearts (❤️)

## 🔧 Configuration

### PM2 Configuration (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'picksides',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/picksides',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
}
```

### Database Schema
- **debates**: Topic, personas, rounds content, metadata
- **votes**: User voting decisions per round and overall
- **Bilingual structure**: Nested language objects for all content

## 🚀 Recent Updates (v0.0.6)

### Navigation Enhancement
- **Home Button Prominence**: Moved to center with green styling for better user flow
- **Improved Button Layout**: Optimized bottom navigation for one-handed operation

### Translation Improvements  
- **Better Duplicate Prevention**: Enhanced queue management prevents redundant generation requests
- **Error Recovery**: Graceful handling of translation failures with smart fallbacks
- **Performance Optimization**: Reduced initial API calls from 12 to 3

### Development Infrastructure
- **PM2 Support**: Production-ready process management with logging and auto-restart
- **Hot Reload Stability**: Enhanced dev/production mode switching
- **Build Optimization**: Better CSS module handling and development server reliability

## 🤝 Contributing

PickSides is built entirely with [Claude Code](https://claude.ai/code). The development process is documented in `CLAUDE.md` with detailed phase-by-phase improvements.

### Development Philosophy
- **Mobile-first design**: 375px viewport optimization
- **Accessibility-focused**: Large touch targets, high contrast, semantic HTML
- **Performance-optimized**: Hardware-accelerated CSS, efficient re-renders
- **AI-powered**: Multiple model support with intelligent persona system

## 📝 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **Documentation**: See `CLAUDE.md` for comprehensive development history
- **AI Models**: [OpenAI](https://openai.com) | [Anthropic](https://anthropic.com) | [Google AI](https://ai.google.dev/)
- **Database**: [Supabase](https://supabase.com)
- **Process Management**: [PM2](https://pm2.keymetrics.io/)

---

**Built with ❤️ using [Claude Code](https://claude.ai/code)**

*Experience the future of AI-powered debates with PickSides - where every argument matters and every voice is heard.*