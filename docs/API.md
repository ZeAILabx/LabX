# LABX — REST API Specification

All sensitive business logic operations execute through the Flask REST API.

Standard Response Format:
```json
{
  "success": true,
  "data": {}
}
```

Error Response Format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "error_code"
}
```

---

## Authentication Header

Send Supabase JWT in request header:
```
Authorization: Bearer <access_token>
```

---

## Endpoint Matrix

| Blueprint | Method | Endpoint | Auth Required | Description |
|-----------|--------|----------|---------------|-------------|
| Auth | POST | `/api/auth/register` | No | Register new founder |
| Auth | POST | `/api/auth/login` | No | Authenticate user |
| Auth | GET | `/api/auth/me` | Yes | Get current user profile |
| Assessment | GET | `/api/assessment/status` | Founder | Check assessment completion |
| Assessment | POST | `/api/assessment/submit` | Founder | Process 7-question diagnostic |
| Roadmap | GET | `/api/roadmap` | Founder | Fetch domain roadmap tree |
| Quests | GET | `/api/quests/milestone/:id` | Founder | Server-side milestone quest filter |
| Submissions | POST | `/api/submissions/quest/:id` | Founder | Submit quest work |
| Progress | GET | `/api/progress` | Founder | Fetch dashboard progress & CTA |
| Points | GET | `/api/points` | Founder | Get total points & transactions |
| Guilds | GET | `/api/guilds/me` | Founder | Fetch assigned Guild details |
| Guilds | GET/POST | `/api/guilds/messages` | Founder | Read/send guild chat messages |
| Social | GET | `/api/social/feed` | Founder | Get followed founders' feed |
| Social | GET | `/api/social/explore` | Founder | Discover platform posts |
| Social | POST | `/api/social/posts` | Founder | Create new social post |
| Social | POST | `/api/social/posts/:id/like` | Founder | Toggle like on post |
| Events | GET | `/api/events` | Yes | View showcase events/announcements |
| Admin | GET | `/api/admin/analytics` | Admin | Fetch platform analytics |
| Admin | GET | `/api/admin/verification` | Admin | Fetch pending submission queue |
| Admin | POST | `/api/admin/verification/:id/review` | Admin | Approve or reject submission |
| Admin | POST | `/api/admin/quests` | Admin | Create new quest |
| Admin | DELETE | `/api/admin/quests/:id` | Admin | Safe delete / archive quest |
| Admin | POST | `/api/admin/founders/:id/reset-assessment` | Admin | Reset founder assessment |
