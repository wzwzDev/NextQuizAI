# 📸 Screenshot Guide for QuizUPM

This guide will help you capture the necessary screenshots to complete the README documentation.

## Required Screenshots

### 1. **homepage.png** - Landing Page
- **URL**: `http://localhost:3000/`
- **Description**: The welcome screen with the QuizUPM logo and Google sign-in button
- **What to capture**: Full page showing the centered welcome card
- **Notes**: Make sure user is logged out to see the landing page

### 2. **signin.png** - Authentication Flow
- **URL**: `http://localhost:3000/auth/signin`
- **Description**: Google OAuth authentication page
- **What to capture**: Sign-in interface with Google authentication options

### 3. **user-dashboard.png** - User Dashboard
- **URL**: `http://localhost:3000/dashboard`
- **Description**: Main user dashboard with statistics and quiz options
- **What to capture**: Full dashboard view with recent quiz history, statistics cards, and navigation

### 4. **quiz-categories.png** - Quiz Categories
- **URL**: `http://localhost:3000/quiz` or dashboard quiz selection
- **Description**: Available quiz categories with icons
- **What to capture**: Grid of quiz categories (Mathematics, Science, History, etc.) with their respective icons

### 5. **quiz-creation.png** - Admin Quiz Creation
- **URL**: `http://localhost:3000/admin` (requires admin privileges)
- **Description**: Admin interface for creating and uploading quizzes
- **What to capture**: Quiz upload/creation form with all available options

### 6. **admin-dashboard.png** - Admin Dashboard
- **URL**: `http://localhost:3000/admin`
- **Description**: Administrative panel with user management and quiz review tools
- **What to capture**: Full admin dashboard showing all administrative features

### 7. **quiz-playing.png** - Interactive Quiz Session
- **URL**: `http://localhost:3000/play/mcq/[gameId]` or `http://localhost:3000/play/open-ended/[gameId]`
- **Description**: Active quiz session showing questions and answer options
- **What to capture**: Quiz interface with question, options (for MCQ), progress bar, and timer

### 8. **quiz-session.png** - Live Quiz with Progress
- **URL**: During an active quiz session
- **Description**: Quiz in progress showing question counter and progress indicators
- **What to capture**: Focus on progress tracking elements and question navigation

### 9. **quiz-results.png** - Results & Performance
- **URL**: `http://localhost:3000/statistics/[gameId]`
- **Description**: Detailed quiz results with performance breakdown
- **What to capture**: Results page showing score, correct/incorrect answers, and performance metrics

### 10. **dashboard-analytics.png** - Analytics Dashboard
- **URL**: `http://localhost:3000/dashboard` or `http://localhost:3000/mystats`
- **Description**: User's personal analytics and statistics
- **What to capture**: Charts, graphs, and statistical data about user performance

### 11. **admin-panel.png** - Administrative Interface
- **URL**: `http://localhost:3000/admin`
- **Description**: Complete admin panel with all management tools
- **What to capture**: User management, quiz approval, and system statistics

### 12. **mobile-view.png** - Mobile Responsive Design
- **URL**: Any page on mobile/responsive view
- **Description**: Application displayed on mobile device or browser responsive mode
- **What to capture**: Mobile-optimized interface showing responsive design

### 13. **test-coverage.png** - Test Coverage Report
- **File**: Open `coverage-frontend/lcov-report/index.html` and `coverage-backend/lcov-report/index.html`
- **Description**: Test coverage statistics
- **What to capture**: Coverage percentage and detailed report

### 14. **local-setup.png** - Development Environment
- **URL**: `http://localhost:3000` after successful setup
- **Description**: Successfully running application in development mode
- **What to capture**: Browser showing the running application with dev tools open (optional)

### 15. **user-flow.png** - Complete User Experience
- **Description**: Composite image or flowchart showing the complete user journey
- **What to capture**: Multiple screenshots combined or a user flow diagram

## Screenshot Guidelines

### Technical Requirements
- **Resolution**: Minimum 1920x1080 for desktop views
- **Format**: PNG format preferred for crisp text and UI elements
- **Browser**: Use Chrome or Edge for consistent rendering
- **Zoom Level**: 100% browser zoom for accurate representation

### Composition Tips
- Ensure all text is readable
- Include browser UI for context (address bar, etc.)
- Capture full page content when possible
- Use clean, populated data (not empty states)
- Show realistic user scenarios

### Data Preparation
Before taking screenshots:
1. **Create sample user accounts** (regular user and admin)
2. **Generate sample quizzes** with various categories
3. **Complete sample quiz attempts** to show realistic data
4. **Populate statistics** with meaningful numbers
5. **Test all user flows** to ensure functionality

### Privacy Considerations
- Use dummy data for all screenshots
- Avoid real email addresses or personal information
- Use placeholder names and content
- Ensure no sensitive API keys are visible

## File Naming Convention
- Use lowercase with hyphens for consistency
- Follow the exact names specified above
- Save all screenshots in the `/screenshots/` directory
- Maintain consistent file extensions (.png)

## Verification Checklist
- [ ] All 15 screenshots captured
- [ ] Files properly named and placed in `/screenshots/` directory
- [ ] Screenshots show realistic, populated data
- [ ] All major features of the application are represented
- [ ] Mobile responsiveness is demonstrated
- [ ] Admin and user perspectives are both covered
- [ ] Test coverage reports are included

## Additional Notes
- If certain features require specific setup (like admin privileges), document the setup process
- Consider creating animated GIFs for complex user interactions
- Ensure screenshots represent the current state of the application
- Update screenshots when significant UI changes are made

---

**Once all screenshots are captured, the README will provide a comprehensive visual overview of the QuizUPM platform!**