# 🎓 OLP - Online Learning Platform Backend

A secure and scalable backend API for an Online Learning Platform built with Node.js, Express, and SQLite.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 📚 **Course Management** - CRUD operations for courses, lessons, and tests
- 👨‍🏫 **Educator System** - Educator profiles and course assignments
- 📊 **Progress Tracking** - Student progress and performance analytics
- 🎥 **Live Classes** - Real-time class management
- 💳 **Subscriptions** - Course enrollment and payment handling
- 🛡️ **Security** - Rate limiting, input validation, CORS, Helmet
- 📖 **RESTful API** - Following REST best practices

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/saivamsi4514/OLP.git
cd OLP

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Or start production server
npm start
```

## 🔧 Environment Setup

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-32-characters
FRONTEND_URL=http://localhost:3000
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register     # Register new user
POST   /api/auth/login        # User login
GET    /api/auth/profile      # Get user profile (protected)
POST   /api/auth/refresh      # Refresh JWT token
POST   /api/auth/logout       # Logout user
GET    /api/auth/verify       # Verify token
```

### Courses
```
GET    /api/courses           # Get all courses
GET    /api/courses/:id       # Get course by ID
POST   /api/courses           # Create course (protected)
PUT    /api/courses/:id       # Update course (protected)
DELETE /api/courses/:id       # Delete course (protected)
GET    /api/courses/educator/:educatorId  # Get courses by educator
GET    /api/courses/exam/:targetExam      # Get courses by exam
```

### Other Endpoints
```
GET    /health                # Health check
GET    /api/educators         # Educator management
GET    /api/lessons           # Lesson management
GET    /api/tests             # Test management
GET    /api/progress          # Progress tracking
GET    /api/subscriptions     # Subscription management
```

## 🧪 Testing

### Manual Testing with Postman/cURL

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "targetExam": "JEE",
    "preferredLanguage": "English",
    "preparationLevel": "Intermediate"
  }'
```

#### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### Create Course (with JWT token)
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Advanced Mathematics",
    "description": "Comprehensive math course for competitive exams",
    "educatorId": 1,
    "targetExam": "JEE",
    "duration": "40 hours",
    "validityPeriod": "1 year",
    "price": 4999,
    "discount": 15,
    "courseType": "Video"
  }'
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Protection against DoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers middleware
- **Error Handling**: Sanitized error responses

## 📊 Database Schema

The application uses SQLite with the following main tables:
- `Users` - User accounts and profiles
- `Courses` - Course information
- `Educators` - Educator profiles
- `Lessons` - Individual lessons
- `Tests` - Assessments and quizzes
- `Progress` - Student progress tracking
- `Subscriptions` - User enrollments

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📈 Performance & Scalability

- Connection pooling for database
- Rate limiting to prevent abuse
- Efficient query patterns
- Proper error handling
- Graceful shutdown handling

## 🐛 Common Issues

### Password Not Hashing
**Fixed**: Ensured bcrypt.hash() is properly called before storing passwords.

### JWT Secret Missing
**Fixed**: Added environment variable validation on startup.

### CORS Issues
**Fixed**: Properly configured CORS for development and production.

### Import/Export Inconsistency
**Fixed**: Standardized on CommonJS throughout the project.

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Include error logs and steps to reproduce