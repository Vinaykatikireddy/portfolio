# FRAS - React Frontend

Face Recognition Attendance System - React + TypeScript + Tailwind CSS

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   └── Camera.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   ├── AddStudent.tsx
│   │   ├── EditStudent.tsx
│   │   ├── TakeAttendance.tsx
│   │   ├── Profile.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Layout.tsx
│   ├── services/
│   │   └── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Configuration

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:3000
```

### API Proxy

Vite is configured to proxy API requests to the backend. See `vite.config.ts` for proxy rules.

## Features

### Implemented Pages

1. **Login** - User authentication
2. **Register** - New user registration  
3. **Dashboard** - Overview with stats (Present Today, Total Students, Avg Attendance, Classes Today)
4. **Students** - View, search, edit, delete students with image preview
5. **Add Student** - Form with all fields + camera capture for photos
6. **Edit Student** - Dedicated edit page (also available as modal in Students page)
7. **Take Attendance** - Class selection + camera for face recognition (placeholder for ML integration)
8. **Check Attendance** - Search student attendance by date range
9. **Profile** - User profile + change password

### UI Components

- **Button** - Variants: primary, success, danger, secondary; Sizes: sm, md, lg
- **Input** - With label, error states, helper text
- **Modal** - Reusable modal with header, footer, size options
- **Sidebar** - Navigation sidebar with active state
- **Navbar** - Responsive navbar with mobile menu
- **Camera** - WebRTC camera with capture, toggle, preview, delete

### Design System

- **Colors**: Navy blue (#111f4d, #1a2e6c), Gold (#f5a623, #e09112)
- **Gradients**: Custom FRAS gradient backgrounds
- **Typography**: Segoe UI font family
- **Animations**: Fade-in-up, modal slide, hover effects
- **Responsive**: Mobile-first with breakpoints

## API Integration

The API client (`src/services/api.ts`) provides:

- Axios instance with base URL configuration
- Request interceptor for auth token
- Response interceptor for 401 handling (auto-logout)
- Organized API modules:
  - `authApi` - login, register, changePassword
  - `studentApi` - search, create, update, delete
  - `attendanceApi` - submit, getByStudent, getToday
  - `dashboardApi` - getStats

## Backend Requirements

The React frontend expects the following backend endpoints:

```
POST   /auth/login              - User login
POST   /auth/register           - User registration
POST   /change-password         - Change password
GET    /students/{search}       - Search students
POST   /students                - Create student (multipart/form-data)
POST   /update-students         - Update student (multipart/form-data)
DELETE /students/{regid}        - Delete student
POST   /attendance              - Submit attendance
GET    /attendance/today        - Get today's attendance
GET    /api/dashboard           - Dashboard statistics
```

## Camera Component

The `Camera` component provides:

- WebRTC camera access
- Front/rear camera toggle
- Photo capture with mirroring
- Image preview with delete
- Multiple image support
- Ref-based API (open, close, getImages, clearImages)

Usage example:

```tsx
const cameraRef = useRef<CameraHandle>(null)

<Camera 
  ref={cameraRef} 
  onImagesChange={(images) => console.log(images)} 
/>

<button onClick={() => cameraRef.current?.open()}>Open Camera</button>
```

## Next Steps

To complete the face recognition integration:

1. Integrate face recognition ML model (e.g., face-api.js, AWS Rekognition)
2. Implement real-time face matching in TakeAttendance page
3. Add backend endpoints for face embedding generation
4. Implement image upload to Supabase storage
5. Add attendance analytics and reports
6. Implement bulk operations (import/export students)

## Collaboration

This project is set up for team collaboration:

- TypeScript for type safety and better DX
- Consistent code style with ESLint
- Component-based architecture
- Clear separation of concerns
- Reusable UI components

To contribute:

1. Create feature branch
2. Make changes
3. Run `npm run build` to ensure no errors
4. Create pull request

## License

MIT