# Life-On-Land
Life On Land is a Poaching alert and wildlife movement tracking app. This is a university project for Application Frameworks module.

# Protected Areas & Zones API

Backend module for Protected Areas & Zones Management in a wildlife anti-poaching web system.

## Architecture

- **Routes**: [src/routes/](src/routes/) - Express route definitions
- **Controllers**: [src/controllers/](src/controllers/) - Request handlers with validation
- **Services**: [src/services/](src/services/) - Business logic
- **Models**: [src/models/](src/models/) - Mongoose schemas
- **Middleware**: [src/middleware/](src/middleware/) - Authorization & error handling
- **Utils**: [src/utils/](src/utils/) - GeoJSON validation

## Setup

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies: `npm install`
3. Ensure MongoDB is running on `mongodb://127.0.0.1:27017`
4. Start server: `npm run start` (or `npm run dev`)
5. Check health: `curl http://localhost:3000/health`

## Authentication (Role-based)

Use request header `x-role` with one of:
- `ADMIN` - Full write/read access
- `RANGER` - Read-only access (default)

## Endpoints

### Protected Areas

- `GET /api/protected-areas`
- `POST /api/protected-areas` (ADMIN, OFFICER)
- `GET /api/protected-areas/:id`
- `PUT /api/protected-areas/:id` (ADMIN, OFFICER)
- `DELETE /api/protected-areas/:id` (soft delete)

### Zones

- `GET /api/protected-areas/:id/zones`
- `POST /api/protected-areas/:id/zones` (ADMIN, OFFICER)
- `PUT /api/zones/:zoneId` (ADMIN, OFFICER)
- `DELETE /api/zones/:zoneId` (soft delete)

## Request Body Examples

### Create Protected Area

```json
{
  "name": "Yala National Park",
  "type": "NATIONAL_PARK",
  "district": "Hambantota",
  "description": "Popular wildlife park",
  "areaSize": 978.8,
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [81.45, 6.25],
        [81.55, 6.25],
        [81.55, 6.35],
        [81.45, 6.35],
        [81.45, 6.25]
      ]
    ]
  }
}
```

### Update Protected Area (partial)

```json
{
  "description": "Updated description",
  "areaSize": 980.1
}
```

### Create Zone

```json
{
  "name": "Core Zone 1",
  "zoneType": "CORE",
  "areaSize": 120.5,
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [81.47, 6.27],
        [81.52, 6.27],
        [81.52, 6.32],
        [81.47, 6.32],
        [81.47, 6.27]
      ]
    ]
  }
}
```

### Update Zone (partial)

```json
{
  "zoneType": "BUFFER",
  "areaSize": 140.0
}
```

## Postman Collection

Import the following requests with header `x-role: ADMIN` for write operations.

### Test Health Check
```
GET http://localhost:3000/health
```

### List Protected Areas
```
GET http://localhost:3000/api/protected-areas
```

### Create Protected Area
```
POST http://localhost:3000/api/protected-areas
x-role: ADMIN
Content-Type: application/json
```

### Get Protected Area
```
GET http://localhost:3000/api/protected-areas/:id
```

### Update Protected Area
```
PUT http://localhost:3000/api/protected-areas/:id
x-role: ADMIN
```

### Delete Protected Area (soft)
```
DELETE http://localhost:3000/api/protected-areas/:id
x-role: ADMIN
```

### List Zones for Area
```
GET http://localhost:3000/api/protected-areas/:id/zones
```

### Create Zone
```
POST http://localhost:3000/api/protected-areas/:id/zones
x-role: ADMIN
```

### Update Zone
```
PUT http://localhost:3000/api/zones/:zoneId
x-role: ADMIN
```

### Delete Zone (soft)
```
DELETE http://localhost:3000/api/zones/:zoneId
x-role: ADMIN
```

## Technical Details

- **Soft Delete**: Records marked DELETED but preserved in database
- **GeoJSON**: All geometries validated as Polygon type with closed rings
- **Timestamps**: All records include createdAt & updatedAt
- **Status Filter**: Active queries only return status: ACTIVE records
- **Error Handling**: Standardized JSON error responses with HTTP codes
