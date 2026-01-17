# JU-AMS Database Query Documentation

## Table of Contents
1. [Database Overview](#database-overview)
2. [Database Schema](#database-schema)
3. [Database Structure](#database-structure)
4. [Users Table](#users-table)
5. [Activities Table](#activities-table)
6. [Applications Table](#applications-table)
7. [Notifications Table](#notifications-table)
8. [Attendance Table](#attendance-table)
9. [Common Queries](#common-queries)
10. [Storage Keys](#storage-keys)

---

## Database Overview

**Database Name:** `JU_AMS`

**Note:** This system currently uses `localStorage` for data persistence. The queries below represent the equivalent SQL operations that would be used if this were a traditional database system (MySQL/PostgreSQL).

---

## Database Schema

### Create Database

```sql
CREATE DATABASE IF NOT EXISTS JU_AMS 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE JU_AMS;
```

---

## Database Structure

The JU_AMS database consists of 5 main tables with the following relationships:

```
┌─────────────┐
│    users    │ (Primary Table)
└──────┬──────┘
       │
       ├─────────────────────────────────────────┐
       │                                         │
┌──────▼──────────┐                    ┌─────────▼──────────┐
│   activities    │                    │  applications      │
│ (coordinatorId) │                    │ (studentId,        │
└──────┬──────────┘                    │  activityId)       │
       │                               └─────────┬──────────┘
       │                                         │
       │                               ┌─────────▼──────────┐
       │                               │   attendance       │
       │                               │ (activityId,       │
       │                               │  studentId,        │
       │                               │  applicationId)    │
       │                               └────────────────────┘
       │
┌──────▼──────────┐
│ notifications   │
│ (recipientId)   │
└─────────────────┘
```

### Table Relationships

1. **users** → **activities** (One-to-Many)
   - A coordinator can create multiple activities
   - Foreign Key: `activities.coordinatorId` → `users.id`

2. **users** → **applications** (One-to-Many)
   - A student can submit multiple applications
   - Foreign Key: `applications.studentId` → `users.id`

3. **activities** → **applications** (One-to-Many)
   - An activity can have multiple applications
   - Foreign Key: `applications.activityId` → `activities.id`

4. **activities** → **attendance** (One-to-Many)
   - An activity can have multiple attendance records
   - Foreign Key: `attendance.activityId` → `activities.id`

5. **applications** → **attendance** (One-to-One)
   - Each attendance record is linked to an application
   - Foreign Key: `attendance.applicationId` → `applications.id`

6. **users** → **notifications** (One-to-Many)
   - A user can receive multiple notifications
   - Foreign Key: `notifications.recipientId` → `users.id`

---

## Complete Database Schema

---

## Users Table

### Schema

```sql
USE JU_AMS;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('student', 'coordinator', 'admin') NOT NULL,
    studentId VARCHAR(255),
    avatar TEXT,
    department VARCHAR(255),
    joinedAt DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    passwordHash VARCHAR(255) NOT NULL,
    passwordVersion INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### Queries

#### 1. Get All Users
```sql
USE JU_AMS;

SELECT id, name, email, role, studentId, avatar, department, joinedAt, status 
FROM users 
WHERE role != 'admin' OR id = 'u5';
```

#### 2. Get User by ID
```sql
USE JU_AMS;

SELECT id, name, email, role, studentId, avatar, department, joinedAt, status 
FROM users 
WHERE id = ?;
```

#### 3. Get User by Email (Login)
```sql
USE JU_AMS;

SELECT * FROM users 
WHERE email = ? AND passwordHash = ? AND status = 'active';
```

#### 4. Create New User (Student Registration)
```sql
USE JU_AMS;

INSERT INTO users (id, name, email, role, studentId, department, joinedAt, status, passwordHash, passwordVersion)
VALUES (?, ?, ?, 'student', ?, 'Undergraduate', CURDATE(), 'active', ?, 1);
```

#### 5. Create Coordinator
```sql
USE JU_AMS;

INSERT INTO users (id, name, email, role, department, joinedAt, status, passwordHash, passwordVersion)
VALUES (?, ?, ?, 'coordinator', ?, CURDATE(), 'active', ?, 1);
```

#### 6. Update User Profile
```sql
USE JU_AMS;

UPDATE users 
SET name = ?, 
    email = ?, 
    department = ?, 
    studentId = ?, 
    avatar = ?,
    updatedAt = CURRENT_TIMESTAMP
WHERE id = ?;
```

#### 7. Update Password
```sql
USE JU_AMS;

UPDATE users 
SET passwordHash = ?, 
    passwordVersion = passwordVersion + 1,
    updatedAt = CURRENT_TIMESTAMP
WHERE id = ? AND passwordHash = ?;
```

#### 8. Delete User (Cannot delete admin)
```sql
USE JU_AMS;

DELETE FROM users 
WHERE id = ? AND role != 'admin';
```

#### 9. Toggle User Status
```sql
USE JU_AMS;

UPDATE users 
SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END,
    updatedAt = CURRENT_TIMESTAMP
WHERE id = ?;
```

#### 10. Get User by Role
```sql
USE JU_AMS;

SELECT id, name, email, role, studentId, avatar, department, joinedAt, status 
FROM users 
WHERE role = ? AND status = 'active';
```

#### 11. Ensure Admin User Exists
```sql
USE JU_AMS;

INSERT INTO users (id, name, email, role, department, joinedAt, status, passwordHash, passwordVersion)
VALUES ('u5', 'ENG- Jamiia', 'Jamiia@jazeeraUniversity.edu.so', 'admin', 'Systems', '2019-11-02', 'active', ?, 0)
ON DUPLICATE KEY UPDATE 
    role = 'admin',
    email = 'Jamiia@jazeeraUniversity.edu.so';
```

---

## Activities Table

### Schema

```sql
USE JU_AMS;

CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('workshop', 'seminar', 'training', 'extracurricular') NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    enrolled INT DEFAULT 0,
    coordinatorId VARCHAR(255) NOT NULL,
    coordinatorName VARCHAR(255) NOT NULL,
    status ENUM('upcoming', 'ongoing', 'completed') DEFAULT 'upcoming',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coordinatorId) REFERENCES users(id)
);

CREATE INDEX idx_activities_coordinatorId ON activities(coordinatorId);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_category ON activities(category);
```

### Queries

#### 1. Get All Activities
```sql
USE JU_AMS;

SELECT * FROM activities 
ORDER BY date ASC, time ASC;
```

#### 2. Get Activity by ID
```sql
USE JU_AMS;

SELECT * FROM activities 
WHERE id = ?;
```

#### 3. Get Activities by Coordinator
```sql
USE JU_AMS;

SELECT * FROM activities 
WHERE coordinatorId = ? OR coordinatorName = ?
ORDER BY date ASC;
```

#### 4. Get Activities by Status
```sql
USE JU_AMS;

SELECT * FROM activities 
WHERE status = ?
ORDER BY date ASC;
```

#### 5. Get Activities by Category
```sql
USE JU_AMS;

SELECT * FROM activities 
WHERE category = ?
ORDER BY date ASC;
```

#### 6. Create Activity
```sql
USE JU_AMS;

INSERT INTO activities (id, title, description, category, date, time, location, capacity, enrolled, coordinatorId, coordinatorName, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'upcoming');
```

#### 7. Update Activity
```sql
USE JU_AMS;

UPDATE activities 
SET title = COALESCE(?, title),
    description = COALESCE(?, description),
    category = COALESCE(?, category),
    date = COALESCE(?, date),
    time = COALESCE(?, time),
    location = COALESCE(?, location),
    capacity = COALESCE(?, capacity),
    enrolled = COALESCE(?, enrolled),
    status = COALESCE(?, status),
    updatedAt = CURRENT_TIMESTAMP
WHERE id = ?;
```

#### 8. Delete Activity
```sql
USE JU_AMS;

DELETE FROM activities 
WHERE id = ?;

-- Also delete related applications
DELETE FROM applications WHERE activityId = ?;
```

#### 9. Increment Enrolled Count
```sql
USE JU_AMS;

UPDATE activities 
SET enrolled = enrolled + 1,
    updatedAt = CURRENT_TIMESTAMP
WHERE id = ? AND enrolled < capacity;
```

#### 10. Decrement Enrolled Count
```sql
USE JU_AMS;

UPDATE activities 
SET enrolled = GREATEST(enrolled - 1, 0),
    updatedAt = CURRENT_TIMESTAMP
WHERE id = ?;
```

---

## Applications Table

### Schema

```sql
USE JU_AMS;

CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(255) PRIMARY KEY,
    studentId VARCHAR(255) NOT NULL,
    studentName VARCHAR(255) NOT NULL,
    activityId VARCHAR(255) NOT NULL,
    activityTitle VARCHAR(255) NOT NULL,
    appliedAt DATE NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (activityId) REFERENCES activities(id),
    UNIQUE KEY unique_application (studentId, activityId)
);

CREATE INDEX idx_applications_studentId ON applications(studentId);
CREATE INDEX idx_applications_activityId ON applications(activityId);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_appliedAt ON applications(appliedAt);
```

### Queries

#### 1. Get All Applications
```sql
USE JU_AMS;

SELECT * FROM applications 
ORDER BY appliedAt DESC;
```

#### 2. Get Application by ID
```sql
USE JU_AMS;

SELECT * FROM applications 
WHERE id = ?;
```

#### 3. Get Applications by Student
```sql
USE JU_AMS;

SELECT * FROM applications 
WHERE studentId = ?
ORDER BY appliedAt DESC;
```

#### 4. Get Applications by Activity
```sql
USE JU_AMS;

SELECT * FROM applications 
WHERE activityId = ?
ORDER BY appliedAt DESC;
```

#### 5. Get Applications by Status
```sql
USE JU_AMS;

SELECT * FROM applications 
WHERE status = ?
ORDER BY appliedAt DESC;
```

#### 6. Get Approved Applications by Activity
```sql
USE JU_AMS;

SELECT * FROM applications 
WHERE activityId = ? AND status = 'approved'
ORDER BY appliedAt DESC;
```

#### 7. Get Pending Applications by Activity
```sql
USE JU_AMS;

SELECT * FROM applications 
WHERE activityId = ? AND status = 'pending'
ORDER BY appliedAt DESC;
```

#### 8. Check if Student Already Applied
```sql
USE JU_AMS;

SELECT COUNT(*) FROM applications 
WHERE studentId = ? AND activityId = ?;
```

#### 9. Create Application
```sql
USE JU_AMS;

INSERT INTO applications (id, studentId, studentName, activityId, activityTitle, appliedAt, status)
VALUES (?, ?, ?, ?, ?, CURDATE(), 'pending');
```

#### 10. Update Application Status
```sql
USE JU_AMS;

UPDATE applications 
SET status = ?,
    notes = ?,
    updatedAt = CURRENT_TIMESTAMP
WHERE id = ?;
```

#### 11. Get Application Count by Status for Activity
```sql
USE JU_AMS;

SELECT status, COUNT(*) as count 
FROM applications 
WHERE activityId = ?
GROUP BY status;
```

#### 12. Check Activity Capacity
```sql
USE JU_AMS;

SELECT 
    a.capacity,
    COUNT(CASE WHEN app.status = 'approved' THEN 1 END) as enrolled
FROM activities a
LEFT JOIN applications app ON a.id = app.activityId
WHERE a.id = ?
GROUP BY a.id, a.capacity;
```

---

## Notifications Table

### Schema

```sql
USE JU_AMS;

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('approval', 'rejection', 'announcement', 'reminder') NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    createdAt DATE NOT NULL,
    senderRole ENUM('student', 'coordinator', 'admin'),
    recipientId VARCHAR(255),
    createdAt_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipientId) REFERENCES users(id)
);

CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_createdAt ON notifications(createdAt);
CREATE INDEX idx_notifications_recipientId ON notifications(recipientId);
CREATE INDEX idx_notifications_type ON notifications(type);
```

### Queries

#### 1. Get All Notifications
```sql
USE JU_AMS;

SELECT * FROM notifications 
ORDER BY createdAt DESC, createdAt_timestamp DESC;
```

#### 2. Get Unread Notifications
```sql
USE JU_AMS;

SELECT * FROM notifications 
WHERE read = FALSE
ORDER BY createdAt DESC;
```

#### 3. Get Unread Notifications Count
```sql
USE JU_AMS;

SELECT COUNT(*) FROM notifications 
WHERE read = FALSE;
```

#### 4. Get Notifications by Type
```sql
USE JU_AMS;

SELECT * FROM notifications 
WHERE type = ?
ORDER BY createdAt DESC;
```

#### 5. Create Notification
```sql
USE JU_AMS;

INSERT INTO notifications (id, title, message, type, read, createdAt, senderRole, recipientId)
VALUES (?, ?, ?, ?, FALSE, CURDATE(), ?, ?);
```

#### 6. Mark Notification as Read
```sql
USE JU_AMS;

UPDATE notifications 
SET read = TRUE
WHERE id = ?;
```

#### 7. Mark All Notifications as Read
```sql
USE JU_AMS;

UPDATE notifications 
SET read = TRUE
WHERE read = FALSE;
```

#### 8. Delete Notification
```sql
USE JU_AMS;

DELETE FROM notifications 
WHERE id = ?;
```

---

## Attendance Table

### Schema

```sql
USE JU_AMS;

CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(255) PRIMARY KEY,
    activityId VARCHAR(255) NOT NULL,
    studentId VARCHAR(255) NOT NULL,
    studentName VARCHAR(255) NOT NULL,
    applicationId VARCHAR(255) NOT NULL,
    status ENUM('present', 'absent') NOT NULL,
    markedAt DATE NOT NULL,
    markedBy VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activityId) REFERENCES activities(id),
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (applicationId) REFERENCES applications(id),
    FOREIGN KEY (markedBy) REFERENCES users(id),
    UNIQUE KEY unique_attendance (activityId, studentId)
);

CREATE INDEX idx_attendance_activityId ON attendance(activityId);
CREATE INDEX idx_attendance_studentId ON attendance(studentId);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_markedAt ON attendance(markedAt);
```

### Queries

#### 1. Get All Attendance Records
```sql
USE JU_AMS;

SELECT * FROM attendance 
ORDER BY markedAt DESC;
```

#### 2. Get Attendance by Activity
```sql
USE JU_AMS;

SELECT * FROM attendance 
WHERE activityId = ?
ORDER BY studentName ASC;
```

#### 3. Get Attendance by Student
```sql
USE JU_AMS;

SELECT * FROM attendance 
WHERE studentId = ?
ORDER BY markedAt DESC;
```

#### 4. Get Attendance by Status
```sql
USE JU_AMS;

SELECT * FROM attendance 
WHERE activityId = ? AND status = ?;
```

#### 5. Get Attendance Statistics for Activity
```sql
USE JU_AMS;

SELECT 
    status,
    COUNT(*) as count
FROM attendance 
WHERE activityId = ?
GROUP BY status;
```

#### 6. Mark Attendance (Insert or Update)
```sql
USE JU_AMS;

INSERT INTO attendance (id, activityId, studentId, studentName, applicationId, status, markedAt, markedBy)
VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    markedAt = VALUES(markedAt),
    markedBy = VALUES(markedBy),
    updatedAt = CURRENT_TIMESTAMP;
```

#### 7. Batch Mark Attendance
```sql
USE JU_AMS;

INSERT INTO attendance (id, activityId, studentId, studentName, applicationId, status, markedAt, markedBy)
VALUES 
    (?, ?, ?, ?, ?, ?, CURDATE(), ?),
    (?, ?, ?, ?, ?, ?, CURDATE(), ?),
    ...
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    markedAt = VALUES(markedAt),
    markedBy = VALUES(markedBy),
    updatedAt = CURRENT_TIMESTAMP;
```

#### 8. Get Attendance with Student Details
```sql
USE JU_AMS;

SELECT 
    a.*,
    u.name as student_name,
    u.email as student_email,
    u.studentId as student_id
FROM attendance a
JOIN users u ON a.studentId = u.id
WHERE a.activityId = ?
ORDER BY a.studentName ASC;
```

---

## Common Queries

### Complex Joins

#### 1. Get Activity with Application Count
```sql
USE JU_AMS;

SELECT 
    a.*,
    COUNT(CASE WHEN app.status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN app.status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN app.status = 'rejected' THEN 1 END) as rejected_count
FROM activities a
LEFT JOIN applications app ON a.id = app.activityId
WHERE a.id = ?
GROUP BY a.id;
```

#### 2. Get Student Applications with Activity Details
```sql
USE JU_AMS;

SELECT 
    app.*,
    a.date,
    a.time,
    a.location,
    a.status as activity_status,
    a.coordinatorName
FROM applications app
JOIN activities a ON app.activityId = a.id
WHERE app.studentId = ?
ORDER BY app.appliedAt DESC;
```

#### 3. Get Coordinator Dashboard Stats
```sql
USE JU_AMS;

SELECT 
    COUNT(DISTINCT a.id) as total_activities,
    COUNT(DISTINCT CASE WHEN app.status = 'pending' THEN app.id END) as pending_applications,
    SUM(a.enrolled) as total_enrolled,
    COUNT(DISTINCT CASE WHEN app.status = 'approved' THEN app.id END) as approved_students
FROM activities a
LEFT JOIN applications app ON a.id = app.activityId
WHERE a.coordinatorId = ? OR a.coordinatorName = ?;
```

#### 4. Get Activity with Attendance Summary
```sql
USE JU_AMS;

SELECT 
    a.*,
    COUNT(CASE WHEN att.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN att.status = 'absent' THEN 1 END) as absent_count,
    COUNT(att.id) as total_attendance
FROM activities a
LEFT JOIN attendance att ON a.id = att.activityId
WHERE a.id = ?
GROUP BY a.id;
```

#### 5. Get Student Dashboard Stats
```sql
USE JU_AMS;

SELECT 
    COUNT(DISTINCT app.id) as total_applications,
    COUNT(DISTINCT CASE WHEN app.status = 'approved' THEN app.id END) as approved_applications,
    COUNT(DISTINCT CASE WHEN app.status = 'pending' THEN app.id END) as pending_applications,
    COUNT(DISTINCT CASE WHEN notif.read = FALSE THEN notif.id END) as unread_notifications
FROM users u
LEFT JOIN applications app ON u.id = app.studentId
LEFT JOIN notifications notif ON u.id = notif.recipientId
WHERE u.id = ?;
```

---

## Storage Keys

Since this system uses `localStorage`, the following keys are used:

### LocalStorage Keys
- `ju-ams-users` - Stores all users data
- `ju-ams-session` - Stores current logged-in user session
- `ju-ams-activities` - Stores all activities
- `ju-ams-applications` - Stores all applications
- `ju-ams-notifications` - Stores all notifications
- `ju-ams-attendance` - Stores all attendance records

### Example Data Structure in LocalStorage

```json
{
  "ju-ams-users": [
    {
      "id": "u5",
      "name": "ENG- Jamiia",
      "email": "Jamiia@jazeeraUniversity.edu.so",
      "role": "admin",
      "department": "Systems",
      "joinedAt": "2019-11-02",
      "status": "active",
      "passwordHash": "...",
      "passwordVersion": 0
    }
  ],
  "ju-ams-activities": [
    {
      "id": "activity-123",
      "title": "Web Development Workshop",
      "description": "...",
      "category": "workshop",
      "date": "2024-02-15",
      "time": "10:00 AM",
      "location": "Computer Lab A",
      "capacity": 30,
      "enrolled": 18,
      "coordinatorId": "coord-1",
      "coordinatorName": "Dr. Sarah Ahmed",
      "status": "upcoming"
    }
  ],
  "ju-ams-applications": [],
  "ju-ams-notifications": [],
  "ju-ams-attendance": []
}
```

---

## Migration to Real Database

If migrating to a real database (MySQL, PostgreSQL, etc.), you would:

1. Create the tables using the schemas above
2. Set up proper foreign key constraints
3. Create indexes for performance
4. Replace localStorage operations with actual SQL queries
5. Add transaction support for complex operations
6. Implement proper connection pooling
7. Add backup and recovery mechanisms

---

## Notes

- All timestamps are stored as ISO date strings in localStorage
- IDs are generated using: `{type}-{timestamp}-{random}`
- Password hashing is done client-side (not recommended for production)
- All operations are synchronous with localStorage
- No transactions are supported (localStorage limitation)
- Data is stored as JSON strings in localStorage

---

**Last Updated:** 2024
**Version:** 1.0.0

