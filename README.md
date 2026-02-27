# Life-On-Land 🦁🐘

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)

Life-On-Land is a state-of-the-art **Poaching Alert and Wildlife Movement Tracking** system designed to protect biodiversity. It provides a highly scalable backend for real-time wildlife monitoring, ranger coordination, and proactive threat detection.

---

## ✨ Key Features

- 🛰️ **Real-time GPS Tracking**: High-throughput ingestion of animal movement data via IoT devices.
- 🚨 **Automated Alert System**: Immediate notification triggers for poaching incidents and boundary breaches.
- 🛡️ **Advanced Patrol Management**: Dynamic scheduling, geo-fenced check-ins, and digital logbooks for rangers.
- 📈 **Risk Mapping**: Heatmap-based risk assessment utilizing historical incident and movement data.
- 🔒 **RBAC Security**: Granular Role-Based Access Control (ADMIN, RANGER).
- 🧬 **Data Integrity**: Robust validation and sanitization for all incoming data streams.

---

## 🏗️ System Architecture

The system utilizes a **Layered Architecture** with a **Service-Repository Pattern**, maximizing decoupling and maintainability.

### Request-Response Flow

```mermaid
graph TD
    A[Client / IoT Node] -->|REST Request| B[Express Router]
    B -->|Security Guard| C[Auth & Role Middleware]
    C -->|Schema Constraint| D[Express-Validator]
    D -->|Logic Gateway| E[Controller]
    E -->|Business Processor| F[Service Layer]
    F -->|Persistence Adapter| G[Repository Layer]
    G -->|Object Mapping| H[Mongoose Schema]
    H -->|Query| I[(MongoDB)]

    I -.->|Documents| H
    H -.->|JSON Data| G
    G -.->|Entities| F
    F -.->|Result Set| E
    E -.->|Response| A
```

### Component Hierarchy

- `config/`: System orchestration & DB connectivity.
- `routes/`: API topology and routing logic.
- `controllers/`: Request handling and response shaping.
- `services/`: Core business logic and inter-module coordination.
- `repositories/`: Optimized data access layer.
- `models/`: Strictly typed Mongoose schemas.
- `middleware/`: Security, Authorization, and Centralized Logging.
- `validators/`: Strict input validation rules.
- `utils/`: For helper functions

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18.x+
- **MongoDB**: v6.0+ (Local or Atlas)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/RUSIRUDEVINDA/Life-On-Land.git
cd Life-On-Land/backend

# Install dependencies
npm install
```

### 3. Setup Environment

Rename `.env.example` to `.env` and fill in your credentials:

```env
PORT=5001
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_complex_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
API_URL=http://localhost:5001/api
```

### 4. Launch

```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

---

## System Architecture Diagram

<img width="2596" height="1248" alt="diagram-export-2-27-2026-12_50_46-PM" src="https://github.com/user-attachments/assets/f5d58676-1727-4ada-b0a2-3e71bca40ab0" />

## 🔑 API Documentation

### 🛡️ Authentication (`/api/auth`)

| Endpoint                  | Description                                | Auth Required | Roles  |
| :------------------------ | :----------------------------------------- | :------------ | :----- |
| `POST /api/auth/register` | Register a new user                        | No            | Public |
| `POST /api/auth/login`    | Authenticate and obtain access credentials | No            | Public |
| `POST /api/auth/logout`   | Invalidate current session                 | Yes           | Public |

### 👤 User Management (`/api/users`)

| Endpoint                | Description                                                        | Auth Required | Roles               |
| :---------------------- | :----------------------------------------------------------------- | :------------ | :------------------ |
| `GET /api/users`        | List all users (Filters: `name`, `email`, `role`, `page`, `limit`) | Yes           | ADMIN, RANGER       |
| `GET /api/users/:id`    | Get specific user profile                                          | Yes           | ANY (Authenticated) |
| `PUT /api/users/:id`    | Full user update                                                   | Yes           | ANY (Owner/Admin)   |
| `PATCH /api/users/:id`  | Partial user update                                                | Yes           | ANY (Owner/Admin)   |
| `DELETE /api/users/:id` | Terminate user account                                             | Yes           | ADMIN               |

### �️ Conservation Geometry (`/api/protected-areas`)

| Endpoint                              | Description                 | Auth Required | Roles  |
| :------------------------------------ | :-------------------------- | :------------ | :----- |
| `GET /api/protected-areas`            | List conservation areas     | No            | Public |
| `POST /api/protected-areas`           | Create new area boundary    | Yes           | ADMIN  |
| `GET /api/protected-areas/:id`        | Get area details            | No            | Public |
| `PUT /api/protected-areas/:id`        | Update area metadata        | Yes           | ADMIN  |
| `DELETE /api/protected-areas/:id`     | Remove protected area       | Yes           | ADMIN  |
| `GET /api/protected-areas/:id/zones`  | List zones in specific area | No            | Public |
| `POST /api/protected-areas/:id/zones` | Create zone (Risk Level)    | Yes           | ADMIN  |

### � Zone Management (`/api/zones`)

| Endpoint                | Description             | Auth Required | Roles |
| :---------------------- | :---------------------- | :------------ | :---- |
| `PUT /api/zones/:id`    | Update zone properties  | Yes           | ADMIN |
| `DELETE /api/zones/:id` | Remove zone permanently | Yes           | ADMIN |

### � Animal Registry (`/api/animals`)

| Endpoint                     | Description                                                    | Auth Required | Roles         |
| :--------------------------- | :------------------------------------------------------------- | :------------ | :------------ |
| `GET /api/animals`           | List animals (Paginated + Filter by `species`, `status`, etc.) | Yes           | ADMIN, RANGER |
| `POST /api/animals`          | Register new animal (Tag ID required)                          | Yes           | ADMIN         |
| `GET /api/animals/:tagId`    | Retrieve detailed animal profile                               | Yes           | ADMIN, RANGER |
| `PUT /api/animals/:tagId`    | Full update                                      | Yes           | ADMIN         |
| `PATCH /api/animals/:tagId`  | Partial update                                         | Yes           | ADMIN         |
| `DELETE /api/animals/:tagId` | Remove animal record                                           | Yes           | ADMIN         |

### 📡 Movement Tracking (`/api/movements`)

| Endpoint                     | Description                              | Auth Required | Roles         |
| :--------------------------- | :--------------------------------------- | :------------ | :------------ |
| `GET /api/movements`         | Search movement logs                     | Yes           | ADMIN, RANGER |
| `GET /api/movements/summary` | Latest location snapshot for all animals | Yes           | ADMIN, RANGER |
| `GET /api/movements/:tagId`  | Historical movements by Tag ID           | Yes           | ADMIN, RANGER |

### 🚨 Incident Reporting (`/api/incidents`)

| Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- |
| `POST /api/incidents` | Report threat (POACHING, LOGGING, etc.) | No | Public/Guest |
| `GET /api/incidents` | Query incidents (Filters: `type`, `status`, `severity`, `date`) | Yes | ADMIN, RANGER |
| `GET /api/incidents/:id` | Get full investigation report | Yes | ADMIN, RANGER |
| `PUT /api/incidents/:id` | Update Full Incident | Yes | ADMIN, RANGER |
| `PATCH /api/incidents/:tagId`  | Partial update Incident | Yes | ADMIN, RANGER |                                
| `DELETE /api/incidents/:id` | Remove record | Yes | ADMIN |

### � Risk Intelligence (`/api/risk-map`)

| Endpoint            | Description                           | Auth Required | Roles         |
| :------------------ | :------------------------------------ | :------------ | :------------ |
| `GET /api/risk-map` | Generate area-based risk heatmap data | Yes           | ADMIN, RANGER |

### �️ Patrol Operations (`/api/patrols`)

| Endpoint                                 | Description                                                           | Auth Required | Roles         |
| :--------------------------------------- | :-------------------------------------------------------------------- | :------------ | :------------ |
| `POST /api/patrols`                      | Schedule new patrol                                                   | Yes           | ADMIN         |
| `GET /api/patrols`                       | List patrols (Filters: `rangerId`, `status`, `from`, `to`, `zoneIds`) | Yes           | ADMIN, RANGER |
| `GET /api/patrols/:id`                   | Get specific patrol details                                           | Yes           | ADMIN, RANGER |
| `PUT /api/patrols/:id`                   | Full patrol update (Replace)                                          | Yes           | ADMIN         |
| `PATCH /api/patrols/:id`                 | Partial patrol update                                                 | Yes           | ADMIN         |
| `DELETE /api/patrols/:id`                | Cancel/Remove patrol                                                  | Yes           | ADMIN         |
| `POST /api/patrols/:id/check-ins`        | Record ranger check-in                                                | Yes           | RANGER        |
| `GET /api/patrols/:id/check-ins`         | View patrol check-in history                                          | Yes           | ADMIN, RANGER |
| `PUT /api/patrols/:id/check-ins/:cid`    | Correct check-in log (Full)                                           | Yes           | RANGER        |
| `PATCH /api/patrols/:id/check-ins/:cid`  | Correct check-in log (Partial)                                        | Yes           | RANGER        |
| `DELETE /api/patrols/:id/check-ins/:cid` | Remove check-in record                                                | Yes           | RANGER        |

### � Smart Alerts (`/api/alerts`)

| Endpoint                | Description                  | Auth Required | Roles |
| :---------------------- | :--------------------------- | :------------ | :---- |
| `GET /api/alerts`       | List triggered alerts        | Yes           | ADMIN |
| `PATCH /api/alerts/:id` | Acknowledge or Resolve alert | Yes           | ADMIN |

---

## Request Response Examples

### � User Management (Get Profile)

**GET** `/api/users/:id`

```json
// Response (200 OK)
{
  "user": {
    "_id": "698b1b1ac6196fdd3f397bac",
    "name": "Head Ranger",
    "email": "admin@lifeonland.com",
    "role": "ADMIN",
    "createdAt": "2026-02-20T10:00:00.000Z",
    "updatedAt": "2026-02-20T10:00:00.000Z",
    "__v": 0
  }
}
```

### �️ Conservation Geometry (Create Area)

**POST** `/api/protected-areas`

```json
// Request
{
    "name": "Sinharaja Forest Reserve",
    "type": "FOREST_RESERVE",
    "district": "Ratnapura",
    "areaSize": 88.4,
    "geometry": {
        "type": "Polygon",
        "coordinates": [[[80.4, 6.3], [80.5, 6.3], [80.5, 6.4], [80.4, 6.4], [80.4, 6.3]]]
    },
    "description": "UNESCO World Heritage Site."
}

// Response (201 Created)
{
    "data": {
        "name": "Sinharaja Forest Reserve",
        "type": "FOREST_RESERVE",
        "district": "Ratnapura",
        "areaSize": 88.4,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[80.4, 6.3], [80.5, 6.3], [80.5, 6.4], [80.4, 6.4], [80.4, 6.3]]],
            "_id": "69975c61d112d1320744ef21"
        },
        "description": "UNESCO World Heritage Site.",
        "status": "ACTIVE",
        "_id": "69975c61d112d1320744ef20",
        "createdAt": "2026-02-20T08:00:00.000Z",
        "updatedAt": "2026-02-20T08:00:00.000Z",
        "__v": 0
    }
}
```

### 🐾 Animal Registry (Register Animal)

**POST** `/api/animals`

```json
// Request
{
    "tagId": "T0001",
    "protectedAreaId": "69975c61d112d1320744ef20",
    "zoneId": "69976248d112d1320744ef41",
    "species": "Asian Elephant",
    "sex": "MALE",
    "ageClass": "ADULT",
    "description": "Large bull elephant with distinctive tusk.",
    "endemicToSriLanka": true
}

// Response (201 Created)
{
    "message": "Animal created successfully",
    "animal": {
        "tagId": "T0001",
        "protectedAreaId": "69975c61d112d1320744ef20",
        "protectedAreaName": "Sinharaja Forest Reserve",
        "zoneId": "69976248d112d1320744ef41",
        "zoneName": "Core Zone A",
        "species": "Asian Elephant",
        "description": "Large bull elephant with distinctive tusk.",
        "endemicToSriLanka": true,
        "sex": "MALE",
        "ageClass": "ADULT",
        "status": "ACTIVE",
        "_id": "69a1c4b293a12883034f6f05",
        "createdAt": "2026-02-27T16:10:00.500Z",
        "updatedAt": "2026-02-27T16:10:00.500Z",
        "__v": 0
    }
}
```

### 🛰️ Movement Tracking (Query History)

**GET** `/api/movements/:tagId`

```json
// Response Example (Array of logs)
[
  {
    "_id": "69a2c2c3d4e5f6a7b8c9d0e1",
    "tagId": "AFR-001",
    "lat": 6.312,
    "lng": 81.015,
    "timestamp": "2026-02-27T18:15:00.000Z",
    "speed": 5.2,
    "sourceType": "GPS",
    "zoneId": "69976248d112d1320744ef41",
    "protectedAreaId": "69975c61d112d1320744ef20",
    "createdAt": "2026-02-27T18:15:05.100Z",
    "updatedAt": "2026-02-27T18:15:05.100Z",
    "__v": 0
  }
]
```

### 🚨 Incident Reporting (Submit Threat)

**POST** `/api/incidents`

```json
// Request
{
    "type": "POACHING",
    "description": "Gunshots heard near river boundary.",
    "zoneId": "69976248d112d1320744ef41",
    "protectedAreaId": "69975c61d112d1320744ef20",
    "incidentDate": "2026-02-27T17:30:00.000Z",
    "severity": "CRITICAL"
}

// Response (201 Created)
{
    "success": true,
    "message": "Incident created successfully",
    "data": {
        "_id": "69a1c9d293a12883034f6fb2",
        "type": "POACHING",
        "description": "Gunshots heard near river boundary.",
        "zoneId": {
            "_id": "69976248d112d1320744ef41",
            "name": "Core Zone A"
        },
        "protectedAreaId": {
            "_id": "69975c61d112d1320744ef20",
            "name": "Sinharaja Forest Reserve"
        },
        "status": "UNVERIFIED",
        "severity": "CRITICAL",
        "incidentDate": "2026-02-27T17:30:00.000Z",
        "reportedBy": {
            "_id": "698b1b1ac6196fdd3f397bac",
            "username": "head_ranger",
            "fullName": "Head Ranger"
        },
        "isDeleted": false,
        "createdAt": "2026-02-27T17:45:00.123Z",
        "updatedAt": "2026-02-27T17:45:00.123Z",
        "__v": 0
    }
}
```

### �️ Patrol Management (Create Mission)

**POST** `/api/patrols`

```json
// Request
{
    "alertId": "69a1b98c5f93a7b599c594c9",
    "assignedRangerIds": ["698b1b1ac6196fdd3f397bac"],
    "plannedStart": "2026-02-27T08:00:00.000Z",
    "plannedEnd": "2026-02-28T17:00:00.000Z",
    "notes": "Emergency poaching response."
}

// Response (201 Created)
{
    "message": "Patrol created successfully",
    "patrol": {
        "title": "[Sinharaja] CRITICAL: POACHING detected",
        "protectedAreaId": "69975c61d112d1320744ef20",
        "exactLocation": {
            "lat": 6.31,
            "lng": 81.01
        },
        "zoneIds": ["69976248d112d1320744ef41"],
        "plannedStart": "2026-02-27T08:00:00.000Z",
        "plannedEnd": "2026-02-28T17:00:00.000Z",
        "assignedRangerIds": ["698b1b1ac6196fdd3f397bac"],
        "status": "PLANNED",
        "notes": "Emergency poaching response.",
        "checkIns": [],
        "_id": "69a1ba2f93a12883034f6dfd",
        "createdAt": "2026-02-27T15:37:19.299Z",
        "updatedAt": "2026-02-27T15:37:19.299Z",
        "__v": 0
    }
}
```

### 📍 Ranger Check-In

**POST** `/api/patrols/:id/check-ins`

```json
// Request
{
    "location": { "lat": 6.315, "lng": 81.022 },
    "note": "Suspect tracks found near the river boundary.",
    "zoneId": "69976248d112d1320744ef41"
}

// Response (201 Created)
{
    "message": "Check-in added successfully",
    "patrol": {
        "_id": "69a1ba2f93a12883034f6dfd",
        "status": "IN_PROGRESS",
        "checkIns": [
            {
                "location": { "lat": 6.315, "lng": 81.022 },
                "note": "Suspect tracks found near the river boundary.",
                "zoneId": "69976248d112d1320744ef41",
                "timestamp": "2026-02-27T15:45:00.299Z",
                "_id": "69a1bb2093a12883034f6e10"
            }
        ],
        "updatedAt": "2026-02-27T15:45:00.299Z"
    }
}
```

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB & Mongoose ODM
- **Security**: JWT, Bcrypt, Role-Based Access Control
- **Validation**: Custom Validators
- **Documentation**: Mermaid.js, Markdown

---

**Life-On-Land** - _Empowering wildlife protection through engineering._
