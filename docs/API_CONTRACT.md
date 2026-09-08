# Proposed API Contract

This file defines the first backend interface planned for the screening-stage vertical slice. It is a contract/design target, not a claim that the backend is already deployed.

## Parking facilities

### `GET /api/parkings`
Returns facility summaries used by map/list views.

### `GET /api/parkings/:parkingId`
Returns capacity, availability, EV/PWD resources and current facility state.

## Vehicle events

### `POST /api/events`

Example request:

```json
{
  "parkingId": "vijay-nagar",
  "event": "ENTRY",
  "vehicleNumber": "MP09AB4821",
  "vehicleType": "EV",
  "timestamp": "2026-09-08T16:00:00Z",
  "confidence": 0.97
}
```

Expected processing:

1. Validate parking ID and event type.
2. Reject/ignore impossible duplicate state transitions.
3. Reconcile event against active reservation/vehicle state.
4. Persist the event.
5. Update facility resource state atomically.
6. Return the resulting facility state.

## Bookings

### `POST /api/bookings`
Creates a booking against a specific facility resource.

### `PATCH /api/bookings/:bookingId/cancel`
Cancels a booking and releases the exact reserved resource.

## Owner summary

### `GET /api/owner/:parkingId/summary`
Returns facility-level occupancy, entries/exits, active vehicles, EV/PWD utilisation and transaction summary.

## State invariants

- Availability must never be below 0 or above total capacity.
- A vehicle cannot exit unless it is currently active inside the facility.
- The same slot cannot be assigned to two active vehicles.
- `Reserved -> Occupied` check-in must not decrement capacity twice.
