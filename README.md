# WholesaleTrack

WholesaleTrack is a lightweight internal tool for a single wholesale distributor's team. Staff manage customers, suppliers, product stock, and order fulfillment. Customers can track their own orders publicly — no login required.

There are no customer accounts, no user roles, and no admin panel. Any authenticated user is a staff member.

---

## Pages

### `/` — Track order (public)

A calm, centred page any customer can use. Enter the order number from the invoice and the phone number on file, then press "Track order". The result shows the order's current status, a five-step horizontal progress bar (Pending → Confirmed → Packed → Dispatched → Delivered) with timestamps, the driver name once assigned, and a line-by-line breakdown of items and totals. Cancelled orders show a clear cancelled state instead of the progress bar.

All data is loaded through the `track_order` Supabase RPC — this page never reads any table directly and works without a session.

A small "Staff login →" link in the top corner points to `/login`.

### `/login` — Staff sign-in

Email and password sign-in for staff. Logged-in users who visit `/login` are automatically sent to `/orders`. Unauthenticated users who try to reach any other staff route are redirected here.

### `/orders` — Order list

The main fulfillment view. Shows:
- A one-line summary: number of pending orders, orders placed today, and products low on stock.
- A "New order" button.
- Status filter tabs (All, Pending, Confirmed, Packed, Dispatched, Delivered, Cancelled).
- A search box (order number or customer name).
- A table of all orders, newest first, with order number, customer, date, total, and status badge. Clicking a row opens the order detail page.

**New order modal**: choose a customer from a searchable dropdown (or add a new customer inline without leaving the modal), set or edit the delivery address, pick products with quantities limited to available stock, and see a live grand total. Submitting calls the `create_order` RPC, which atomically deducts stock. If the RPC returns an error (e.g. insufficient stock), the form stays open with the error displayed.

### `/orders/:id` — Order detail

Full view of a single order:
- Status with a horizontal progress tracker and timestamps per step.
- Customer name, delivery address, notes, and driver name.
- Line items table with unit price, quantity, and line total.
- Status actions: advance the status step by step (Pending → Confirmed → Packed → Dispatched → Delivered). Dispatching requires a driver name.
- A cancel button (with confirmation). Cancellation triggers a database trigger that restores stock automatically — the frontend never writes to `stock_movements` directly.
- A print/invoice button that renders a clean, printer-friendly invoice view.

### `/products` — Product catalog

Two tabs:

**Catalog tab**: a searchable, filterable table of all products showing name, SKU, category, unit, price (in RWF), current stock, reorder level, and supplier. Low-stock products (stock ≤ reorder level) are highlighted. Staff can add or edit a product, toggle it active/inactive, and receive stock via a "Receive stock" modal that calls the `receive_stock` RPC.

**Stock history tab**: a full audit log of all stock movements (`in` for intake, `out` for fulfillment or cancellation reversals), with product name, type, quantity, associated supplier or order, note, and date.

### `/customers` — Customer directory

A searchable table of wholesale customer contacts (name, business name, phone, address). Staff can add or edit a customer. Delete is not available — customers are linked to orders.

### `/suppliers` — Supplier directory

A searchable table of vendors and inventory suppliers (name, phone, email, address). Staff can add, edit, or delete a supplier. Deletion is blocked if the supplier is linked to any product or stock record; a clear error message is shown.

---

## How to run

### Prerequisites

- Node.js v18 or higher
- npm
- A Supabase project with the schema described in [`docs/schema.md`](./docs/schema.md) applied

### 1. Clone and install

```bash
npm install
```

### 2. Set environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are found in your Supabase project under **Settings → API**.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

- `/` — public order tracking (no login needed)
- `/login` — staff sign-in
- `/orders` — staff land here after signing in

### 4. Build for production

```bash
npm run build
```

The output goes to `dist/`. Serve it with any static host (Vercel, Netlify, Nginx, etc.). Make sure the hosting platform is configured to serve `index.html` for all routes (SPA routing).

---

## Database

The schema, RPCs, and trigger descriptions are in [`docs/schema.md`](./docs/schema.md).

Key points:

- **`create_order` RPC** — atomically creates an order and deducts stock. Call this; never write to `orders` + `order_items` manually.
- **`receive_stock` RPC** — increments product stock and logs the movement. Call this; never write to `stock_movements` directly.
- **`track_order` RPC** — public, callable by unauthenticated users. Returns order details and history, or `null` if no match.
- **Triggers** — `order_status_history` is populated automatically on every status change. `stock_movements` for cancellations is handled by the `on_order_cancelled_restore_stock` trigger. The frontend never writes to these tables directly.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL, Auth, RPCs, Triggers) |

---

## Environment variables reference

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) API key |
