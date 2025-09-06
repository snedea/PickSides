# PickSides 🔥

> TikTok-style debate app where AI argues both sides and you pick the winner

**Version 0.0.2** - A mobile-first debate experience with swipe navigation, gesture voting, and swift tap-to-advance interactions.

## ✨ Features

### 🎯 Core Experience
- **TikTok-Style Navigation**: Swipe up/down through debate rounds, left/right between debates
- **AI-Generated Debates**: OpenAI GPT-4o-mini creates balanced Pro/Con arguments
- **3-Round Structure**: Opening statements, rebuttals, and closing arguments
- **TL;DR Summaries**: Quick overview of each side's key points

### 📱 Interactive Voting
- **Swift Tap Navigation**: Click Pro/Con sections on rounds 1-3 to instantly advance
- **Large Voting Buttons**: Pro, Tie, Con buttons optimized for mobile
- **Gesture Voting**: Swipe ↑ for Pro, ↓ for Con, ← → for Tie
- **Auto-Advance**: Automatically moves to next debate after voting
- **Vote Tracking**: Remembers your choices across debates

### 🎨 Design & UX  
- **Dark Glassmorphism UI**: Modern, sleek interface with blur effects
- **Prominent Topic Header**: Large, readable debate questions with subtle shadows
- **Infinite Carousel**: Seamlessly loop from debate 5/5 → 1/5
- **Clickable Navigation**: Dots and arrows for precise control
- **Swift Interactions**: Tap Pro/Con sides for instant round progression
- **Mobile-First**: Responsive design optimized for touch

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

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
- **Quick Tap Navigation**: On rounds 1-3, tap any Pro or Con section to advance
- **Final Vote Buttons**: Use large Pro, Tie, or Con buttons on voting screen
- **Gesture Voting**: 
  - Swipe ↑ = Vote Pro
  - Swipe ↓ = Vote Con  
  - Swipe ← or → = Vote Tie
- **Visual Feedback**: Hover effects and flash animations for all interactions

### Sample Debates
Experience 5 pre-loaded debates on topics like:
- AI regulation and safety
- Social media platform liability
- Remote work productivity
- Free college education
- Genetic engineering ethics

## 🛠 Technical Stack

- **Frontend**: Next.js 14, React 18
- **Styling**: CSS Modules with modern glassmorphism design
- **AI Integration**: OpenAI GPT-4o-mini
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
- **VotingCard**: Large voting buttons with gesture support

### API Endpoint
- `POST /api/debate` - Generate new debates from topics
- Integrates with OpenAI GPT-4o-mini
- Returns structured 3-round debate format

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