# Enhanced Notification System

## Overview

The notification system has been enhanced to ensure that **managers** and **admins** receive real-time notifications when staff members update tasks or add comments.

---

## Notification Flow

### 1. **Task Status Updates by Staff**

When a staff member updates a task status (e.g., from "pending" to "in_progress" or "completed"):

#### Recipients:

- ✅ **All Admins** - Receive notification about the status change
- ✅ **Department Manager** - Manager of the same department as the staff member
- ✅ **Task Creator** - The person who originally created/assigned the task (if different from above)

#### Notification Details:

- **Type**: `task_updated`
- **Title**: "Task Status Updated"
- **Message**: "{Staff Name} updated task "{Task Title}" from {old_status} to {new_status}"
- **Link**: Direct link to the task details page
- **Sender**: Staff member who made the update

#### Example:

```
Title: Task Status Updated
Message: John Doe updated task "Complete Monthly Report" from pending to in_progress
Link: /tasks/507f1f77bcf86cd799439011
```

---

### 2. **Task Comments by Staff**

When a staff member adds a comment to a task:

#### Recipients:

- ✅ **All Admins** - Receive notification about the new comment
- ✅ **Department Manager** - Manager of the same department as the staff member
- ✅ **Task Creator** - The person who originally created/assigned the task (if different from above)

#### Notification Details:

- **Type**: `task_comment`
- **Title**: "New Comment on Task"
- **Message**: "{Staff Name} added a comment on task "{Task Title}": "{Comment preview...}"
- **Link**: Direct link to the task details page
- **Sender**: Staff member who added the comment

#### Example:

```
Title: New Comment on Task
Message: Jane Smith added a comment on task "Complete Monthly Report": "I've completed 50% of the work. Will finish by..."
Link: /tasks/507f1f77bcf86cd799439011
```

---

## Technical Implementation

### Backend Changes

#### 1. **Notification Model** (`models/Notification.js`)

Added new notification type:

```javascript
enum: [
  "task_assigned",
  "task_completed",
  "task_updated",
  "task_comment",
  "message",
  "system",
  "warning",
  "info",
];
```

#### 2. **Staff Controller** (`controllers/staffController.js`)

**Enhanced `updateTaskProgress` function:**

- Captures old status before update
- Finds all admins in the system
- Finds the manager of the staff's department
- Creates notifications for all relevant parties
- Uses `Notification.insertMany()` for efficient bulk insertion
- Prevents duplicate notifications

**Enhanced `addTaskComment` function:**

- Finds all admins in the system
- Finds the manager of the staff's department
- Creates notifications with comment preview (first 50 characters)
- Notifies task creator if different from manager/admin
- Uses `Notification.insertMany()` for efficient bulk insertion

---

## Notification Prevention Logic

To avoid duplicate notifications, the system checks:

1. **Staff vs Manager**: Manager doesn't receive notification if they are the one making the update
2. **Task Creator**: Only notified if they are different from admins/managers already notified
3. **Duplicate Check**: Uses `isAlreadyNotified` flag to prevent sending same notification twice

---

## Real-Time Updates

With the existing real-time refresh intervals:

- **Admin Dashboard**: Notifications refresh every **15 seconds**
- **Manager Dashboard**: Notifications refresh every **15 seconds**
- **Staff Dashboard**: Notifications refresh every **20 seconds**
- **Window Focus**: All dashboards refresh when user returns to the tab

---

## Notification Display

### Admin/Manager View:

Notifications appear in:

1. **Notifications Page** (`/notifications`)
2. **Dashboard Notification Panel**
3. **Header Notification Badge** (unread count)

### Notification Features:

- ✅ Real-time updates
- ✅ Unread count badge
- ✅ Click to navigate to task
- ✅ Mark as read functionality
- ✅ Sender name displayed
- ✅ Timestamp shown

---

## API Endpoints

### Get Notifications

```
GET /api/staff/notifications
GET /api/manager/notifications
GET /api/admin/notifications
```

### Mark as Read

```
PUT /api/staff/notifications/:id/read
PUT /api/manager/notifications/:id/read
PUT /api/admin/notifications/:id/read
```

### Mark All as Read

```
PUT /api/staff/notifications/read-all
PUT /api/manager/notifications/read-all
PUT /api/admin/notifications/read-all
```

---

## Database Schema

### Notification Document:

```javascript
{
  user: ObjectId,              // Recipient
  type: String,                // Notification type
  title: String,               // Notification title
  message: String,             // Notification message
  link: String,                // Link to relevant page
  sender: ObjectId,            // Who triggered the notification
  senderName: String,          // Sender's name
  isRead: Boolean,             // Read status
  isArchived: Boolean,         // Archive status
  createdAt: Date,             // Timestamp
  updatedAt: Date              // Last update
}
```

---

## Testing Checklist

- [x] Staff updates task status → Admin receives notification
- [x] Staff updates task status → Manager receives notification
- [x] Staff adds comment → Admin receives notification
- [x] Staff adds comment → Manager receives notification
- [x] Task creator receives notification (if different from admin/manager)
- [x] No duplicate notifications sent
- [x] Notifications display in real-time
- [x] Notification links navigate to correct task
- [x] Mark as read functionality works
- [x] Unread count updates correctly

---

## Future Enhancements

1. **Email Notifications**: Send email alerts for critical updates
2. **Push Notifications**: Browser push notifications for instant alerts
3. **Notification Preferences**: Allow users to customize notification settings
4. **Notification Grouping**: Group similar notifications together
5. **Sound Alerts**: Optional sound for new notifications
6. **Desktop Notifications**: System-level notifications
7. **Notification History**: Archive and search old notifications

---

_Last Updated: 2026-02-10_
_Version: 2.1 - Enhanced Notification System_
