# PickSides 🔥

> TikTok-style debate app where AI argues both sides and you pick the winner

**Version 0.0.4** - Complete Internationalization & Management! Multi-language support, debate overview home screen, and enhanced AI consistency.

## ✨ Features

### 🎯 Core Experience
- **TikTok-Style Navigation**: Swipe up/down through debate rounds, left/right between debates
- **Multi-AI Debates**: OpenAI, Anthropic Claude, and Google Gemini create balanced arguments
- **3-Round Structure**: Opening statements, rebuttals, and closing arguments
- **TL;DR Summaries**: Quick overview of each side's key points
- **Multi-Language Support**: Full English/Romanian localization with proper AI responses

### ❤️ Heart-Button Voting System
- **Explicit Heart Voting**: Clear ♡ and ❤️ buttons for intentional voting
- **Vote Editing**: Tap filled hearts to unvote, change votes anytime
- **Split → Tap → Enlarged → Vote Flow**: Tap sections to enlarge, then vote with hearts
- **Vote Review**: "View My Votes" to see round-by-round choices
- **Pre/Post-Vote States**: Confirmation screen with "Vote Again" option
- **Auto-Advance**: Smooth progression after each round vote

### 🎨 Design & UX  
- **Dark Glassmorphism UI**: Modern, sleek interface with blur effects
- **Debate Overview Home Screen**: Grid-based layout with visual progress indicators
- **Prominent Topic Header**: Large, readable debate questions with subtle shadows
- **Bottom Navigation Bar**: Emoji-based navigation with language toggle and home button
- **Heart-Button Interface**: Intuitive ♡/❤️ voting with edit capability
- **Debate Management**: Delete debates with confirmation dialogs
- **Mobile-First**: Responsive design optimized for touch

### 🌐 Internationalization
- **Language Toggle**: Switch between English and Romanian instantly
- **AI Language Consistency**: All models respond in selected language
- **Complete Localization**: UI, prompts, and error messages fully translated
- **Persistent Language Settings**: Remembers your language preference

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account and project
- AI API keys (OpenAI, Anthropic, Google)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/snedea/PickSides.git
   cd PickSides
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure OpenAI API**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## 🎮 How to Use

### Navigation
- **Vertical Swipes**: Navigate between rounds (1 → 2 → 3 → Voting)
- **Horizontal Swipes**: Navigate between debates (1/5 ↔ 2/5 ↔ ... ↔ 5/5)
- **Click Navigation**: Use bottom dots to jump to specific rounds
- **Down Arrow**: Click to advance through rounds

### Voting & Interaction
- **Heart-Button Voting**: Tap ♡ to vote, tap ❤️ to unvote or change vote
- **Enlarged Reading Mode**: Tap Pro/Con sections to view full arguments
- **Round-by-Round Voting**: Vote on each round individually (1, 2, 3)
- **Vote Confirmation**: Review votes before finalizing with "Confirm Vote"
- **Vote Management**: "View My Votes" and "Vote Again" options
- **Visual Feedback**: Heart pulse animations and smooth transitions

### Database Integration
- **Persistent Storage**: All debates saved to Supabase PostgreSQL
- **Vote Tracking**: Round-by-round and final votes stored locally and in database
- **Real-time Updates**: Dynamic debate creation and management
- **UUID-based IDs**: Proper database relationships and data integrity
- **Clean Empty States**: Graceful handling when no debates exist

## 🛠 Technical Stack

- **Frontend**: Next.js 14, React 18
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Styling**: CSS Modules with modern glassmorphism design
- **AI Integration**: OpenAI GPT-4o-mini, Anthropic Claude, Google Gemini
- **Internationalization**: React Context with English/Romanian support
- **Navigation**: Custom touch/swipe handling
- **Responsive**: Mobile-first with progressive enhancement

## 📱 Mobile Experience

PickSides is designed mobile-first with:
- Large, accessible touch targets
- Smooth gesture recognition
- Optimized typography for small screens
- Minimal cognitive load with clear visual hierarchy
- One-handed operation support

## 🔧 Development

### Project Structure
```
app/
├── components/           # React components
│   ├── DebateCard.js    # Single round display
│   ├── VotingCard.js    # Voting interface
│   └── SwipeDebateContainer.js  # Main navigation logic
├── data/
│   └── sampleDebates.js # Pre-loaded debate content
├── api/
│   └── debate/
│       └── route.js     # OpenAI integration endpoint
└── globals.css          # Base styles
```

### Key Components
- **SwipeDebateContainer**: Handles all navigation, gestures, and state
- **DebateCard**: Displays Pro/Con arguments with TL;DR summaries  
- **DebateOverview**: Grid-based home screen with visual progress indicators
- **DebateTile**: Individual debate cards with status and delete functionality
- **LanguageContext**: Manages internationalization and translations
- **BottomNavBar**: Emoji-based navigation with language toggle

### API Endpoints
- `POST /api/debate` - Generate new debates from topics with language support
- `GET /api/debates` - Fetch saved debates from database
- `DELETE /api/debates/[id]` - Delete individual debates
- `POST /api/vote` - Record user votes
- Integrates with OpenAI, Anthropic, and Google AI models
- Returns structured 3-round debate format with persistent storage

## 🎯 Roadmap

- [ ] User-submitted debate topics
- [ ] Social sharing of votes/debates
- [ ] Debate statistics and analytics
- [ ] Dark/light theme toggle
- [ ] Accessibility enhancements
- [ ] PWA support for mobile installation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- Powered by OpenAI GPT-4o-mini
- Inspired by TikTok's intuitive navigation patterns

---

**Ready to pick sides?** 🔥 Start swiping and let the debates begin!