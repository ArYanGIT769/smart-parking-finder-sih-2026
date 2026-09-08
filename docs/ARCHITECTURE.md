# SPF Technical Architecture

## Current working prototype

The deployed frontend uses one shared parking state so map availability, parking cards, booking/cancellation and Owner Dashboard remain synchronized per parking facility.

```mermaid
flowchart TD
  GPS[Browser Geolocation] --> UI[React Client]
  MAP[Leaflet + OSM] --> UI
  UI --> STATE[Central Parking State]
  STATE --> BOOK[Bookings / QR / Cancellation]
  STATE --> OWNER[Owner Dashboard]
  STATE --> SIM[Demo Entry/Exit Engine]
  STATE --> STORE[localStorage]
```

## Screening target architecture

```mermaid
flowchart LR
  CAM[Entry / Exit Camera] --> CV[YOLO Inference]
  CV --> EDGE[Event / Reconciliation Layer]
  EDGE --> API[Node.js REST / WebSocket API]
  API --> DB[(Parking + Event Database)]
  API --> WEB[SPF Web App]
  WEB --> DRIVER[Driver]
  WEB --> OWNER[Parking Operator]
```

## Event lifecycle

1. Camera/video frame is passed through vehicle detection.
2. Detection is converted into an ENTRY/EXIT event with parking ID and timestamp.
3. Reconciliation layer validates the event against active vehicles/reservations.
4. Backend persists the event and updates occupancy atomically.
5. Client receives the new facility state and updates map/card/dashboard.

## Reservation-aware occupancy state

```text
Available -> Reserved -> Occupied -> Available
Available -------------> Occupied -> Available  (walk-in)
Reserved --------------> Available             (cancel/expiry)
```

This prevents the same capacity from being decremented once on reservation and again on check-in.
