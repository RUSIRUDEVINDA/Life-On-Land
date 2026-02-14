# Postman Testing Guide for Life-On-Land Backend

## Server Configuration
- **Base URL**: `http://localhost:5001`
- **Port**: `5001` (default, or check your `.env` file for `PORT` variable)

---

## Authentication Endpoints

### 1. Register User
**POST** `http://localhost:5001/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "Password123",
  "role": "ADMIN"
}
```

**Notes:**
- Password must be at least 8 characters with uppercase, lowercase, and number
- Role can be `"ADMIN"` or `"RANGER"` (defaults to `"RANGER"` if not provided)
- Name must be 2-50 characters, letters/spaces/hyphens/apostrophes only
- Email must be valid format

**Response:** Returns user object and token

---

### 2. Login
**POST** `http://localhost:5001/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

**Response:** Returns user object and token (stored in cookie or returned in response)

**Save the token** from the response for authenticated requests!

---

### 3. Logout
**POST** `http://localhost:5001/api/auth/logout`

**Headers:**
```
Content-Type: application/json
```

**Body:** Empty or `{}`

---

## Protected Areas Endpoints

### 4. Get All Protected Areas (Public)
**GET** `http://localhost:5001/api/areas`

**Headers:**
```
Content-Type: application/json
```

**No authentication required**

---

### 5. Get Protected Area by ID (Public)
**GET** `http://localhost:5001/api/areas/{id}`

**Example:**
```
GET http://localhost:5001/api/areas/507f1f77bcf86cd799439011
```

**Headers:**
```
Content-Type: application/json
```

**No authentication required**

---

### 6. Create Protected Area (Admin Only)
**POST** `http://localhost:5001/api/areas`

**Headers:**
```
Content-Type: application/json
x-role: ADMIN
```

**Body (JSON):**
```json
{
  "name": "Yala National Park",
  "type": "NATIONAL_PARK",
  "district": "Hambantota",
  "description": "Famous for leopards and elephants",
  "areaSize": 978.8,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [81.0, 6.3],
      [81.5, 6.3],
      [81.5, 6.8],
      [81.0, 6.8],
      [81.0, 6.3]
    ]]
  }
}
```

**Notes:**
- `type` must be one of: `"NATIONAL_PARK"`, `"FOREST_RESERVE"`, `"SAFARI_AREA"`
- `areaSize` must be a positive number
- `geometry` must be a valid GeoJSON Polygon (first and last coordinates must match)
- Coordinates are `[longitude, latitude]` format

**Alternative Sample:**
```json
{
  "name": "Sinharaja Forest Reserve",
  "type": "FOREST_RESERVE",
  "district": "Ratnapura",
  "description": "UNESCO World Heritage Site",
  "areaSize": 111.87,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [80.4, 6.35],
      [80.5, 6.35],
      [80.5, 6.45],
      [80.4, 6.45],
      [80.4, 6.35]
    ]]
  }
}
```

---

### 7. Update Protected Area (Admin Only)
**PUT** `http://localhost:5001/api/areas/{id}`

**Example:**
```
PUT http://localhost:5001/api/areas/507f1f77bcf86cd799439011
```

**Headers:**
```
Content-Type: application/json
x-role: ADMIN
```

**Body (JSON)** - All fields optional:
```json
{
  "name": "Updated Park Name",
  "description": "Updated description",
  "areaSize": 1000.5
}
```

---

### 8. Delete Protected Area (Admin Only)
**DELETE** `http://localhost:5001/api/areas/{id}`

**Example:**
```
DELETE http://localhost:5001/api/areas/507f1f77bcf86cd799439011
```

**Headers:**
```
Content-Type: application/json
x-role: ADMIN
```

---

## Zone Endpoints

### 9. Get Zones by Protected Area (Public)
**GET** `http://localhost:5001/api/areas/{id}/zones`

**Example:**
```
GET http://localhost:5001/api/areas/507f1f77bcf86cd799439011/zones
```

**Headers:**
```
Content-Type: application/json
```

**No authentication required**

---

### 10. Create Zone for Protected Area (Admin Only)
**POST** `http://localhost:5001/api/areas/{id}/zones`

**Example:**
```
POST http://localhost:5001/api/areas/507f1f77bcf86cd799439011/zones
```

**Headers:**
```
Content-Type: application/json
x-role: ADMIN
```

**Body (JSON):**
```json
{
  "name": "Core Zone A",
  "zoneType": "CORE",
  "areaSize": 150.5,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [81.1, 6.4],
      [81.2, 6.4],
      [81.2, 6.5],
      [81.1, 6.5],
      [81.1, 6.4]
    ]]
  }
}
```

**Notes:**
- `zoneType` must be one of: `"CORE"`, `"BUFFER"`, `"EDGE"`, `"CORRIDOR"`
- `areaSize` must be a positive number
- `geometry` must be a valid GeoJSON Polygon
- The zone must be within the protected area's bounds (validation may vary)

**Alternative Samples:**
```json
{
  "name": "Buffer Zone North",
  "zoneType": "BUFFER",
  "areaSize": 75.2,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [81.0, 6.3],
      [81.1, 6.3],
      [81.1, 6.4],
      [81.0, 6.4],
      [81.0, 6.3]
    ]]
  }
}
```

---

### 11. Update Zone (Admin Only)
**PUT** `http://localhost:5001/api/zones/{zoneId}`

**Example:**
```
PUT http://localhost:5001/api/zones/507f1f77bcf86cd799439012
```

**Headers:**
```
Content-Type: application/json
x-role: ADMIN
```

**Body (JSON)** - All fields optional:
```json
{
  "name": "Updated Zone Name",
  "zoneType": "BUFFER",
  "areaSize": 200.0
}
```

---

### 12. Delete Zone (Admin Only)
**DELETE** `http://localhost:5001/api/zones/{zoneId}`

**Example:**
```
DELETE http://localhost:5001/api/zones/507f1f77bcf86cd799439012
```

**Headers:**
```
Content-Type: application/json
x-role: ADMIN
```

---

## Testing Workflow

### Step 1: Test Server Connection
1. **GET** `http://localhost:5001/`
   - Should return: `"API is running"`

### Step 2: Register/Login
1. **POST** `http://localhost:5001/api/auth/register`
   - Use the sample data above
   - Save the token from response

2. **POST** `http://localhost:5001/api/auth/login`
   - Use the same credentials
   - Save the token

### Step 3: Test Protected Areas (Public Endpoints)
1. **GET** `http://localhost:5001/api/areas`
   - Should return list (may be empty initially)

### Step 4: Test Protected Areas (Admin Endpoints)
1. **POST** `http://localhost:5001/api/areas`
   - Add `x-role: ADMIN` header
   - Use sample protected area data
   - Save the `_id` from response

2. **GET** `http://localhost:5001/api/areas/{id}`
   - Use the saved `_id`

3. **PUT** `http://localhost:5001/api/areas/{id}`
   - Update with `x-role: ADMIN` header

### Step 5: Test Zones
1. **POST** `http://localhost:5001/api/areas/{protectedAreaId}/zones`
   - Use the protected area `_id` from Step 4
   - Add `x-role: ADMIN` header
   - Use sample zone data
   - Save the zone `_id` from response

2. **GET** `http://localhost:5001/api/areas/{protectedAreaId}/zones`
   - Should return the created zone

3. **PUT** `http://localhost:5001/api/zones/{zoneId}`
   - Update with `x-role: ADMIN` header

---

## Important Notes

1. **Authentication**: The current implementation uses `x-role` header for authorization. Make sure to include `x-role: ADMIN` for admin-only endpoints.

2. **GeoJSON Format**: 
   - Coordinates are `[longitude, latitude]` (not lat, lng)
   - First and last coordinate in a ring must be identical (closed polygon)
   - Minimum 4 coordinates required per ring

3. **Error Responses**: 
   - `400` - Bad Request (validation errors)
   - `401` - Unauthorized (missing/invalid token)
   - `403` - Forbidden (insufficient permissions)
   - `404` - Not Found
   - `500` - Server Error

4. **Environment Variables** (check your `.env` file):
   - `PORT` - Server port (default: 5001)
   - `MONGO_URI` - MongoDB connection string
   - `JWT_SECRET` - Secret for JWT tokens
   - `JWT_EXPIRES_IN` - Token expiration (default: 7d)

---

## Quick Test Data

### User Registration
```json
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "Admin123",
  "role": "ADMIN"
}
```

### Protected Area
```json
{
  "name": "Test National Park",
  "type": "NATIONAL_PARK",
  "district": "Test District",
  "description": "A test protected area",
  "areaSize": 500.0,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [80.0, 6.0],
      [80.1, 6.0],
      [80.1, 6.1],
      [80.0, 6.1],
      [80.0, 6.0]
    ]]
  }
}
```

### Zone
```json
{
  "name": "Test Core Zone",
  "zoneType": "CORE",
  "areaSize": 100.0,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [80.05, 6.05],
      [80.08, 6.05],
      [80.08, 6.08],
      [80.05, 6.08],
      [80.05, 6.05]
    ]]
  }
}
```

