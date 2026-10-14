# WholesaleTrack Database Schema & API Reference

This document outlines the simplified database schema, remote procedure calls (RPCs), and automated database triggers in Supabase for **WholesaleTrack**.

WholesaleTrack is an internal tool for a single distributor's staff team. There are no customer accounts, no user roles, and no profiles table. Any authenticated user is a staff member. Customers only look up their orders via the public order tracking function.

---

## 1. Tables & Columns

### 1.1 `customers`
Distributor customer accounts and business contacts.
- **`id`** (`uuid`, Primary Key, default `gen_random_uuid()`)
- **`name`** (`text`, not null)
- **`phone`** (`text`)
- **`business_name`** (`text`)
- **`address`** (`text`)

### 1.2 `suppliers`
Wholesale vendors and inventory suppliers.
- **`id`** (`uuid`, Primary Key, default `gen_random_uuid()`)
- **`name`** (`text`, not null)
- **`phone`** (`text`)
- **`email`** (`text`)
- **`address`** (`text`)

### 1.3 `products`
Wholesale catalog items with stock tracking.
- **`id`** (`uuid`, Primary Key, default `gen_random_uuid()`)
- **`name`** (`text`, not null)
- **`sku`** (`text`, unique, not null)
- **`category`** (`text`)
- **`unit`** (`text`, e.g. `'box'`, `'case'`, `'kg'`, `'bag'`)
- **`unit_price`** (`numeric`, not null)
- **`stock_quantity`** (`integer`, not null, default `0`)
- **`reorder_level`** (`integer`, not null, default `10`)
- **`supplier_id`** (`uuid`, references `suppliers(id)` on delete set null)
- **`is_active`** (`boolean`, not null, default `true`)

### 1.4 `orders`
Wholesale orders and fulfillment status.
- **`id`** (`uuid`, Primary Key, default `gen_random_uuid()`)
- **`order_number`** (`text`, unique, not null)
- **`customer_id`** (`uuid`, not null, references `customers(id)` on delete restrict)
- **`status`** (`text`, not null, default `'pending'`, check: `'pending' | 'confirmed' | 'packed' | 'dispatched' | 'delivered' | 'cancelled'`)
- **`total_amount`** (`numeric`, not null, default `0`)
- **`delivery_address`** (`text`)
- **`driver_name`** (`text`)
- **`notes`** (`text`)
- **`created_at`** (`timestamptz`, default `now()`)

### 1.5 `order_items`
Individual items within an order.
- **`id`** (`uuid`, Primary Key, default `gen_random_uuid()`)
- **`order_id`** (`uuid`, not null, references `orders(id)` on delete cascade)
- **`product_id`** (`uuid`, not null, references `products(id)` on delete restrict)
- **`quantity`** (`integer`, not null)
- **`unit_price`** (`numeric`, not null)

### 1.6 `stock_movements`
Audit log of all stock increases (intake) and decreases (fulfillment / cancellations).
- **`id`** (`uuid`, Primary Key, default `gen_random_uuid()`)
- **`product_id`** (`uuid`, not null, references `products(id)` on delete restrict)
- **`type`** (`text`, not null, check: `'in' | 'out'`)
- **`quantity`** (`integer`, not null)
- **`supplier_id`** (`uuid`, references `suppliers(id)` on delete set null)
- **`order_id`** (`uuid`, references `orders(id)` on delete set null)
- **`note`** (`text`)
- **`created_at`** (`timestamptz`, default `now()`)

### 1.7 `order_status_history`
Timeline of order status transitions.
- **`id`** (`uuid`, Primary Key, default `gen_random_uuid()`)
- **`order_id`** (`uuid`, not null, references `orders(id)` on delete cascade)
- **`status`** (`text`, not null)
- **`created_at`** (`timestamptz`, default `now()`)

---

## 2. Remote Procedure Calls (RPCs)

### 2.1 `create_order`
Creates an order with items and atomically deducts inventory stock.
- **Parameters**:
  - `p_customer_id`: `uuid` (references `customers.id`)
  - `p_items`: `jsonb` array of `[{"product_id": "uuid", "quantity": integer}]`
  - `p_address`: `text` (delivery address)
  - `p_notes`: `text` (optional order notes)
- **Returns**: `uuid` (the newly created order id)
- **Behavior**:
  - Verifies stock for each product; raises error (e.g., `"Not enough stock for <Product Name>"`) if insufficient.
  - Inserts `orders` record and related `order_items`.
  - Atomically deducts product stock and records `'out'` movement in `stock_movements`.

### 2.2 `receive_stock`
Records incoming inventory intake.
- **Parameters**:
  - `p_product_id`: `uuid`
  - `p_quantity`: `integer` (greater than 0)
  - `p_supplier_id`: `uuid` (optional)
  - `p_note`: `text` (optional intake note)
- **Returns**: `void`
- **Behavior**:
  - Increments `products.stock_quantity`.
  - Inserts a row into `stock_movements` with `type = 'in'`.

### 2.3 `track_order`
Public endpoint to track order status without logging in.
- **Parameters**:
  - `p_order_number`: `text`
  - `p_phone`: `text`
- **Security**: Public (`security definer`, callable by unauthenticated users)
- **Returns**: JSON object:
  ```json
  {
    "order_number": "WT-1001",
    "status": "dispatched",
    "created_at": "2026-10-14T20:00:00Z",
    "total_amount": 38000,
    "driver_name": "Jean Paul",
    "customer_name": "Kigali Market Store",
    "items": [
      { "product": "Sunflower Oil 5L", "quantity": 2, "unit_price": 19000 }
    ],
    "history": [
      { "status": "pending", "at": "2026-10-14T20:00:00Z" },
      { "status": "confirmed", "at": "2026-10-14T20:15:00Z" },
      { "status": "dispatched", "at": "2026-10-14T21:00:00Z" }
    ]
  }
  ```
  Returns `null` if no matching order is found.

---

## 3. Automated Database Triggers (Frontend Must NOT Duplicate)

1. **`order_status_history` Trigger**:
   - Triggers on order insertion and status change. Automatically appends a row to `order_status_history`.
   - **Frontend rule**: Never insert into `order_status_history` manually.

2. **`on_order_cancelled_restore_stock` Trigger**:
   - Triggers when an order's status changes to `'cancelled'`.
   - Automatically returns quantities to `products.stock_quantity` and logs the return in `stock_movements`.
   - **Frontend rule**: Never insert into `stock_movements` manually.
