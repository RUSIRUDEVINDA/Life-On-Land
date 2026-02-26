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
- 🔒 **RBAC Security**: Granular Role-Based Access Control (ADMIN, OFFICER, RANGER).
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
```

### 4. Launch
```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

---

## 🔑 API Documentation

### 🛡️ Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register a new user | Public |
| `POST` | `/login` | Authenticate and get JWT | Public |
| `POST` | `/logout` | Invalidate current session | Public |

### 👤 User Management (`/api/users`)
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List all users (Filters: `role`, `page`, `limit`) | ADMIN, RANGER |
| `GET` | `/:id` | Get specific user profile | ANY |
| `PUT` | `/:id` | Full user update | ADMIN, RANGER |
| `PATCH` | `/:id` | Partial user update | ADMIN, RANGER |
| `DELETE` | `/:id` | Terminate user account | ADMIN |

### 🐾 Animal Registry (`/api/animals`)
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List animals (Paginated + Filter by `species`, `status`, `protectedAreaId`) | ADMIN, RANGER |
| `POST` | `/` | Register new animal (Tag ID required) | ADMIN |
| `GET` | `/:tagId` | Retrieve detailed animal profile | ADMIN, RANGER |
| `GET` | `/:tagId/movements` | Specific animal movement history | ADMIN, RANGER |
| `PUT` | `/:tagId` | Full profile replacement | ADMIN |
| `PATCH` | `/:tagId` | Partial profile update | ADMIN |
| `DELETE` | `/:tagId` | Remove animal record | ADMIN |

### 📡 Movement Tracking (`/api/movements`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Ingest movement data (IoT/Manual) | Public (IoT) |
| `GET` | `/` | Search movement logs | JWT |
| `GET` | `/summary` | Latest location snapshot for all animals | JWT |
| `GET` | `/:tagId` | Historical movements by Tag ID | JWT |

### 🛡️ Patrol Operations (`/api/patrols`)
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Schedule new patrol | ADMIN |
| `GET` | `/` | List patrols (Filters: `rangerId`, `status`, `from`, `to`) | ADMIN, RANGER |
| `GET` | `/:id` | Get specific patrol details | ADMIN, RANGER |
| `PUT` | `/:id` | Full patrol update | ADMIN |
| `PATCH` | `/:id` | Partial patrol update | ADMIN |
| `DELETE` | `/:id` | Cancel/Remove patrol | ADMIN |
| `POST` | `/:id/check-ins` | Record ranger check-in | RANGER |
| `GET` | `/:id/check-ins` | View patrol check-in history | ADMIN, RANGER |
| `PUT` | `/:id/check-ins/:cid` | Correct check-in log (Full) | RANGER |
| `PATCH` | `/:id/check-ins/:cid` | Correct check-in log (Partial) | RANGER |
| `DELETE` | `/:id/check-ins/:cid` | Remove check-in record | RANGER |

### 🚨 Incident Reporting (`/api/incidents`)
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Report threat (POACHING, LOGGING, etc.) | ANY |
| `GET` | `/` | Query incidents (Filters: `type`, `status`, `severity`, `date`) | ADMIN, RANGER/OFFICER |
| `GET` | `/:id` | Get full investigation report | ADMIN, RANGER/OFFICER |
| `PUT` | `/:id` | Update status/severity | ADMIN, RANGER/OFFICER |
| `DELETE` | `/:id` | Soft delete record | ADMIN |

### 🔔 Smart Alerts (`/api/alerts`)
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List triggered alerts | ADMIN |
| `PATCH` | `/:id` | Acknowledge or Resolve alert | ADMIN |

### 🗺️ Conservation Geometry (`/api/protected-areas` & `/api/zones`)
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/protected-areas` | List conservation areas | Public |
| `POST` | `/protected-areas` | Create new area boundary | ADMIN |
| `GET` | `/protected-areas/:id` | Get area details | Public |
| `PUT` | `/protected-areas/:id` | Update area metadata | ADMIN |
| `DELETE` | `/protected-areas/:id` | Remove protected area | ADMIN |
| `GET` | `/protected-areas/:id/zones` | List zones in specific area | Public |
| `POST` | `/protected-areas/:id/zones` | Create zone (Risk Level) | ADMIN |
| `PUT` | `/api/zones/:id` | Update zone properties | ADMIN |
| `DELETE` | `/api/zones/:id` | Remove zone permanently | ADMIN |

### 📊 Risk Intelligence (`/api/risk-map`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Generate area-based risk heatmap data | JWT |

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB & Mongoose ODM
- **Security**: JWT, Bcrypt, Role-Based Access Control
- **Validation**: Custom Validators
- **Documentation**: Mermaid.js, Markdown

---
**Life-On-Land** - *Empowering wildlife protection through engineering.*
