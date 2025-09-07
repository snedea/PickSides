# PickSides 🔥

> AI debate platform where historical figures argue both sides and you pick the winner

**Version 0.0.5** - AI Persona Revolution! Historical figures debate modern topics with enhanced navigation and user experience.

## ✨ Features

### 🎯 Core Experience
- **AI Persona System**: Historical figures like Socrates, Einstein, and Ayn Rand debate modern topics
- **Multi-AI Debates**: OpenAI, Anthropic Claude, and Google Gemini embody different personalities
- **Button Navigation**: Clean, predictable navigation through visible controls (no confusing swipes)
- **3-Round Structure**: Opening statements, rebuttals, and closing arguments with persona-influenced responses
- **TL;DR Summaries**: Quick overview of each side's key points in character
- **Multi-Language Support**: Full English/Romanian localization with culturally appropriate personas

### ❤️ Heart-Button Voting System
- **Explicit Heart Voting**: Clear ♡ and ❤️ buttons for intentional voting
- **Vote Editing**: Tap filled hearts to unvote, change votes anytime
- **Split → Tap → Enlarged → Vote Flow**: Tap sections to enlarge, then vote with hearts
- **Vote Review**: "View My Votes" to see round-by-round choices
- **Pre/Post-Vote States**: Confirmation screen with "Vote Again" option
- **Auto-Advance**: Smooth progression after each round vote

### 🎨 Design & UX  
- **Dark Glassmorphism UI**: Modern, sleek interface with blur effects
- **AI Persona Display**: Clear "CHATGPT AS SOCRATES" vs "CLAUDE AS AYN RAND" labeling
- **Debate Overview Home Screen**: Grid-based layout with persona matchup previews
- **Prominent Topic Header**: Large, readable debate questions with subtle shadows  
- **Bottom Navigation Bar**: Emoji-based navigation with language toggle and home button
- **Heart-Button Interface**: Intuitive ♡/❤️ voting with edit capability
- **Button-Only Navigation**: No confusing swipes - all actions through visible controls
- **Debate Management**: Delete debates with confirmation dialogs
- **Mobile-First**: Responsive design optimized for touch

### 🎭 AI Persona System
- **7 Default Personas**: Socrates, Einstein, Ayn Rand, Shakespeare, Nietzsche, Tzara, plus Default AI
- **Custom Personas**: Add any historical figure, philosopher, or personality
- **Persistent Library**: Save custom personas for future debates
- **Persona Management**: Delete saved personas with confirmation
- **Authentic Responses**: AIs embody personality, communication style, and philosophical views
- **Multi-Language Personas**: Romanian names where appropriate (Socrates → Socrate)

### 🌐 Bilingual Cross-Language System
- **Intelligent Language Switching**: Switch between English and Romanian instantly with smart fallbacks
- **Asynchronous Generation**: Missing language content generated automatically in background
- **Real-time Notifications**: Progress indicators when new language versions are being prepared
- **Seamless UX**: Always see content immediately while enhanced versions load behind the scenes
- **AI Language Consistency**: All models respond authentically in selected language with persona voices
- **Complete Localization**: UI, prompts, personas, and error messages fully translated
- **Persistent Language Settings**: Remembers your language preference with localStorage sync

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
- **Bottom Dots**: Click to jump to specific rounds (1 → 2 → 3 → Voting)
- **Down Arrow**: Click to advance through rounds
- **Home Button**: 🏠 Navigate to debate overview grid
- **Bottom Navigation**: Language toggle 🇬🇧/🇷🇴, page numbers 📄, add debates ➕

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
- **Database**: Supabase PostgreSQL with real-time subscriptions and bilingual schema
- **Styling**: CSS Modules with modern glassmorphism design
- **AI Integration**: OpenAI GPT-4o-mini, Anthropic Claude, Google Gemini with persona system
- **Bilingual System**: Asynchronous cross-language generation with intelligent fallbacks
- **Real-time Updates**: WebSocket-style notifications for background generation progress
- **Navigation**: Button-based navigation with predictable controls
- **Responsive**: Mobile-first with progressive enhancement

## 📱 Mobile Experience

PickSides is designed mobile-first with:
- Large, accessible touch targets for buttons and hearts
- Button-based navigation (no confusing gestures)
- Optimized typography for small screens with bright white persona names
- Minimal cognitive load with clear visual hierarchy
- One-handed operation support with bottom navigation

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
- **SwipeDebateContainer**: Handles all navigation, button controls, and state
- **DebateCard**: Displays Pro/Con arguments with persona names and TL;DR summaries
- **PersonaSelector**: Dropdown for choosing AI personas with custom management  
- **DebateOverview**: Grid-based home screen with persona matchup previews
- **DebateTile**: Individual debate cards with persona vs persona display
- **LanguageContext**: Manages internationalization, translations, and persona names
- **BottomNavBar**: Emoji-based navigation with language toggle

### API Endpoints
- `POST /api/debate` - Generate new debates with persona-influenced AI responses
- `GET /api/debates` - Fetch saved debates with intelligent language fallbacks
- `GET /api/debates/[id]` - Fetch individual debates with bilingual support
- `POST /api/debate/generate-language` - Asynchronous generation of missing language content
- `DELETE /api/debates/[id]` - Delete individual debates and cleanup
- `POST /api/vote` - Record user votes with debate tracking
- Integrates with OpenAI, Anthropic, and Google AI models with persona system
- Returns structured 3-round debate format with bilingual support and persistent storage

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
- Powered by OpenAI GPT-4o-mini, Anthropic Claude, and Google Gemini
- Enhanced with asynchronous bilingual generation system

---

**Ready to pick sides?** 🔥 Choose your personas and let the debates begin!