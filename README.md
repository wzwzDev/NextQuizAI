<<<<<<< HEAD
# 🧠 QuizUPM - AI-Powered Quiz Platform

QuizUPM is an intelligent quiz platform that leverages AI to create, manage, and deliver personalized quiz experiences. Built with Next.js, the platform offers both multiple-choice and open-ended questions, comprehensive analytics, and powerful administrative tools.

![Homepage](https://github.com/user-attachments/assets/homepage.png)
=======
# 🧠 Quizzzz - AI-Powered Quiz Platform

QuizUPM is an intelligent quiz platform that leverages AI to create, manage, and deliver personalized quiz experiences. Built with Next.js, the platform offers both multiple-choice and open-ended questions, comprehensive analytics, and powerful administrative tools.

![QuizUPM Homepage](screenshots/homepage.png)
>>>>>>> a4cdc80b08738f3dd7d3a644d18414d1d88cddc7
*Homepage - Welcome screen with Google authentication*

## ✨ Features

### 🎯 Core Functionality
- **AI-Generated Quizzes**: Automatic quiz creation using OpenAI integration
- **Multiple Question Types**: Support for MCQ and open-ended questions
- **Real-time Scoring**: Instant feedback and performance tracking
- **Smart Answer Validation**: Advanced similarity checking for open-ended answers
- **Topic-based Organization**: Categorized quizzes across various subjects

<<<<<<< HEAD
![Quiz Creation](https://github.com/user-attachments/assets/quiz-creation-interface.png)
=======
![Quiz Creation](screenshots/quiz-creation.png)
>>>>>>> a4cdc80b08738f3dd7d3a644d18414d1d88cddc7
*Admin Quiz Creation Interface*

### 📊 Analytics & Statistics
- **Detailed Performance Metrics**: Individual and aggregate quiz statistics
- **Visual Charts**: Interactive data visualization using Recharts
- **Word Clouds**: Visual representation of quiz topics and trends
- **Historical Tracking**: Complete quiz attempt history

<<<<<<< HEAD
![Dashboard Analytics](https://github.com/user-attachments/assets/dashboard-analytics.png)
=======
![Dashboard Analytics](screenshots/dashboard-analytics.png)
>>>>>>> a4cdc80b08738f3dd7d3a644d18414d1d88cddc7
*User Dashboard with Performance Analytics*

### 👥 User Management
- **Role-Based Access**: Admin and regular user permissions
- **User Banning/Revoking**: Comprehensive user moderation tools
- **Online Status Tracking**: Real-time user activity monitoring
- **Session Management**: Secure authentication with NextAuth.js

<<<<<<< HEAD
![Admin Dashboard](https://github.com/user-attachments/assets/admin-dashboard.png)
=======
![Admin Dashboard](screenshots/admin-dashboard.png)
>>>>>>> a4cdc80b08738f3dd7d3a644d18414d1d88cddc7
*Admin Dashboard with User Management*

### 🎮 Interactive Quiz Experience
- **Progress Tracking**: Real-time quiz completion indicators
- **Timed Sessions**: Configurable time limits for quiz attempts
- **Immediate Feedback**: Instant answer validation and explanations
- **Responsive Design**: Optimized for desktop and mobile devices

<<<<<<< HEAD
![Quiz Playing Interface](https://github.com/user-attachments/assets/quiz-playing.png)
=======
![Quiz Playing Interface](screenshots/quiz-playing.png)
>>>>>>> a4cdc80b08738f3dd7d3a644d18414d1d88cddc7
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

<<<<<<< HEAD
![Installation Success](https://github.com/user-attachments/assets/local-setup.png)
=======
![Installation Success](screenshots/local-setup.png)
>>>>>>> a4cdc80b08738f3dd7d3a644d18414d1d88cddc7
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

<<<<<<< HEAD
![User Flow](https://github.com/user-attachments/assets/user-flow.png)
=======
![User Flow](screenshots/user-flow.png)
>>>>>>> a4cdc80b08738f3dd7d3a644d18414d1d88cddc7
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

<<<<<<< HEAD
![Test Coverage](https://github.com/user-attachments/assets/test-coverage.png)
=======
![Test Coverage](screenshots/test-coverage.png)
>>>>>>> a4cdc80b08738f3dd7d3a644d18414d1d88cddc7
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

<<<<<<< HEAD
### 🏠 Homepage & Authentication
![Homepage](https://github.com/user-attachments/assets/homepage-welcome-screen.png)
*Welcome screen with Google OAuth authentication*

### 📊 User Dashboard
![User Dashboard](https://github.com/user-attachments/assets/user-dashboard-main.png)
*Main dashboard with Hot Topics word cloud and Recent Activity feed*

### 📈 Personal Analytics
![User Statistics](https://github.com/user-attachments/assets/user-stats-analytics.png)
*Detailed personal performance analytics with charts and quiz history*

### 🎯 Quiz Creation & Management
![Quiz Creation](https://github.com/user-attachments/assets/quiz-creation-form.png)
*AI-powered quiz creation interface with topic and question settings*

### 📝 Interactive Quiz Experience
![MCQ Quiz](https://github.com/user-attachments/assets/quiz-mcq-interface.png)
*Multiple choice question interface with progress tracking*

![Open-ended Quiz](https://github.com/user-attachments/assets/quiz-open-ended-interface.png)
*Open-ended question interface for text-based answers*

### 🏆 Quiz Results & Performance
![Quiz Results](https://github.com/user-attachments/assets/quiz-results-completion.png)
*Quiz completion screen with immediate feedback*

![Performance Summary](https://github.com/user-attachments/assets/quiz-performance-summary.png)
*Detailed performance breakdown with accuracy metrics*

### 🎮 Available Quizzes
![Quiz Selection](https://github.com/user-attachments/assets/available-quizzes-grid.png)
*Grid of available quizzes with category and difficulty filters*

### 👨‍💼 Admin Dashboard
![Admin Upload](https://github.com/user-attachments/assets/admin-quiz-upload.png)
*Admin interface for uploading and creating new quizzes*

![Quiz Review](https://github.com/user-attachments/assets/admin-quiz-review.png)
*Quiz review and approval interface for administrators*

![Quiz Statistics](https://github.com/user-attachments/assets/admin-quiz-statistics.png)
*Administrative quiz performance overview and statistics*

### 👥 User Management
![User Management](https://github.com/user-attachments/assets/admin-user-management.png)
*Administrative user management with ban/unban capabilities*
=======
### Authentication Flow
![Sign In](screenshots/SignIn.png)
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
>>>>>>> a4cdc80b08738f3dd7d3a644d18414d1d88cddc7

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
