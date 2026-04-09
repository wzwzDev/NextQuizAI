# 🧠 QuizUPM - AI-Powered Quiz Platform

QuizUPM is an intelligent quiz platform that leverages AI to create, manage, and deliver personalized quiz experiences. Built with Next.js, the platform offers both multiple-choice and open-ended questions, comprehensive analytics, and powerful administrative tools.

![QuizUPM Homepage](screenshots/homepage.png)
*Homepage - Welcome screen with Google authentication*

## ✨ Features

### 🎯 Core Functionality
- **AI-Generated Quizzes**: Automatic quiz creation using OpenAI integration
- **Multiple Question Types**: Support for MCQ and open-ended questions
- **Real-time Scoring**: Instant feedback and performance tracking
- **Smart Answer Validation**: Advanced similarity checking for open-ended answers
- **Topic-based Organization**: Categorized quizzes across various subjects

![Quiz Creation](screenshots/quiz-creation.png)
*Admin Quiz Creation Interface*

### 📊 Analytics & Statistics
- **Detailed Performance Metrics**: Individual and aggregate quiz statistics
- **Visual Charts**: Interactive data visualization using Recharts
- **Word Clouds**: Visual representation of quiz topics and trends
- **Historical Tracking**: Complete quiz attempt history

![Dashboard Analytics](screenshots/dashboard-analytics.png)
*User Dashboard with Performance Analytics*

### 👥 User Management
- **Role-Based Access**: Admin and regular user permissions
- **User Banning/Revoking**: Comprehensive user moderation tools
- **Online Status Tracking**: Real-time user activity monitoring
- **Session Management**: Secure authentication with NextAuth.js

![Admin Dashboard](screenshots/admin-dashboard.png)
*Admin Dashboard with User Management*

### 🎮 Interactive Quiz Experience
- **Progress Tracking**: Real-time quiz completion indicators
- **Timed Sessions**: Configurable time limits for quiz attempts
- **Immediate Feedback**: Instant answer validation and explanations
- **Responsive Design**: Optimized for desktop and mobile devices

![Quiz Playing Interface](screenshots/quiz-playing.png)
*Interactive Quiz Playing Interface*

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15.3.2](https://nextjs.org/)** - React framework with App Router
- **[React 18.3.1](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Headless component library
- **[Lucide React](https://lucide.dev/)** - Beautiful icons

### Backend & Database
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM
- **[MySQL](https://www.mysql.com/)** - Relational database
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication solution

### AI & Data Processing
- **[OpenAI API](https://openai.com/api/)** - AI-powered quiz generation
- **[PDF.js](https://mozilla.github.io/pdf.js/)** - PDF processing for content extraction
- **[String Similarity](https://www.npmjs.com/package/string-similarity)** - Answer matching algorithms

### Development & Testing
- **[Jest](https://jestjs.io/)** - Testing framework
- **[Playwright](https://playwright.dev/)** - End-to-end testing
- **[ESLint](https://eslint.org/)** - Code linting
- **[@testing-library/react](https://testing-library.com/)** - Component testing

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- MySQL database
- OpenAI API key
- Google OAuth credentials (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wzwzDev/TFM.git
   cd TFM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/quizupm"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

![Installation Success](screenshots/local-setup.png)
*Successful local development setup*

## 📱 Application Structure

### User Journey
1. **Authentication**: Google OAuth sign-in
2. **Dashboard**: Personal analytics and quiz history
3. **Quiz Selection**: Browse available quizzes by category
4. **Quiz Playing**: Interactive quiz experience
5. **Results**: Detailed performance feedback

### Admin Features
- Quiz creation and management
- User moderation tools
- System analytics
- Content approval workflow

![User Flow](screenshots/user-flow.png)
*Complete user experience flow*

## 🧪 Testing

The project includes comprehensive testing coverage:

```bash
# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend

# Run all tests
npm run test

# Run e2e tests with Playwright
npx playwright test
```

![Test Coverage](screenshots/test-coverage.png)
*Test coverage report showing 90%+ coverage*

## 📊 Project Statistics

- **Total Components**: 40+ React components
- **API Endpoints**: 15+ REST API routes
- **Database Models**: 10 Prisma models
- **Test Coverage**: 90%+ across frontend and backend
- **Supported Categories**: Mathematics, Science, History, Geography, and more

## 🔧 Configuration

### Database Schema
The application uses a comprehensive schema with the following key models:
- **User**: Authentication and profile management
- **Game**: Quiz session tracking
- **Question**: Individual quiz questions with answers
- **Quiz**: Admin-managed quiz collections
- **UserQuizAttempt**: Performance tracking

### AI Integration
- OpenAI GPT integration for question generation
- Intelligent answer similarity checking
- Automated content categorization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for AI-powered quiz generation
- Vercel for deployment platform
- The Next.js team for the amazing framework
- All contributors who helped build this platform

---

## 📸 Screenshots Gallery

### Authentication Flow
![Sign In](screenshots/signin.png)
*Google OAuth authentication*

### User Dashboard
![User Dashboard](screenshots/user-dashboard.png)
*Personal dashboard with quiz history and statistics*

### Quiz Categories
![Quiz Categories](screenshots/quiz-categories.png)
*Available quiz categories with visual icons*

### Live Quiz Session
![Quiz Session](screenshots/quiz-session.png)
*Active quiz with progress tracking*

### Results & Analytics
![Quiz Results](screenshots/quiz-results.png)
*Detailed results with performance breakdown*

### Admin Panel
![Admin Panel](screenshots/admin-panel.png)
*Administrative interface for quiz and user management*

### Mobile Responsive
![Mobile View](screenshots/mobile-view.png)
*Responsive design on mobile devices*

---

**Built with ❤️ for educational excellence**

## 🏗️ Architecture

```mermaid
flowchart TD
    User[👤 User] --> FE[🌐 Frontend Next.js/React]
    FE --> API[🔌 API Routes Next.js]
    API --> DB[🗄️ MySQL Database Prisma]
    API --> AI[🤖 OpenAI API]
    
    subgraph "Frontend Layer"
        FE --> Auth[🔐 NextAuth.js]
        FE --> UI[🎨 Radix UI + Tailwind]
        FE --> Charts[📊 Recharts]
    end
    
    subgraph "Backend Layer"
        API --> Validation[✅ Zod Validation]
        API --> Processing[⚙️ Data Processing]
    end
    
    subgraph "Data Layer"
        DB --> Models[📋 User, Quiz, Game Models]
        AI --> Generation[🧠 Quiz Generation]
    end
```

### Backend Folder Structure

```text
src/
   server/
      core/                 # auth and database bootstrap
      ai/                   # OpenAI clients and strict output adapters
      repositories/         # Prisma-only data access
      services/             # business/application logic
      question-generation/  # question parsing/generation helpers
```
