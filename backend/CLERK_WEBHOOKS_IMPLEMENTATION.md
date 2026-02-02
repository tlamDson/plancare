# Clerk Webhooks Implementation Plan

## 🎯 Goal

Sync Clerk user events (signup, update, delete) with your MongoDB User model automatically.

---

## Step 1: Understand Clerk Webhooks

### What they do:

- Clerk sends HTTP POST requests to your backend when user events occur
- Events: `user.created`, `user.updated`, `user.deleted`
- Contains user data (clerkUserId, email, name, avatar, etc.)

### Why you need them:

- Auto-create User in MongoDB when someone signs up
- Keep user data in sync between Clerk and your DB
- Handle user deletions properly

---

## Step 2: Set Up Webhook Endpoint in Backend

### Create the following files:

```
backend/src/
├── routes/
│   └── webhooks.routes.ts     ← Webhook routes
├── controllers/
│   └── webhooks.controller.ts ← Handle webhook events
├── middlewares/
│   └── verifyWebhook.ts       ← Verify Clerk signature
└── services/
    └── user.service.ts        ← User CRUD operations
```

### What each does:

- **webhooks.routes.ts**: Define `POST /api/webhooks/clerk`
- **webhooks.controller.ts**: Parse event, call appropriate handler
- **verifyWebhook.ts**: Verify webhook is actually from Clerk (security)
- **user.service.ts**: Create/update/delete user in MongoDB

---

## Step 3: Install Required Package

```bash
yarn add svix
```

**Why:** Svix is Clerk's webhook signature verification library

---

## Step 4: Implementation Structure

### 4.1 Webhook Route:

```
POST /api/webhooks/clerk
├─ verifyWebhook middleware (check signature)
├─ webhooksController
    ├─ Parse event type
    ├─ Switch on event.type:
    │   ├─ user.created → createUser()
    │   ├─ user.updated → updateUser()
    │   └─ user.deleted → deleteUser()
    └─ Return 200 OK
```

### 4.2 Handler Logic:

#### user.created:

- Extract: clerkUserId, email, name, avatarUrl from webhook
- Create new User document in MongoDB
- Set default preferences

#### user.updated:

- Find user by clerkUserId
- Update email, name, avatarUrl
- Save changes

#### user.deleted:

- Find user by clerkUserId
- Delete user document
- (Optional) Soft delete by adding `deletedAt` field

---

## Step 5: Security - Webhook Verification

### Why:

Anyone can POST to your endpoint - must verify it's from Clerk

### How:

1. Clerk signs each webhook with a secret
2. Your middleware verifies the signature using `svix` library
3. Reject if signature doesn't match

### You'll need:

- Webhook secret from Clerk Dashboard
- Add to `.env`: `CLERK_WEBHOOK_SECRET=whsec_xxx`

---

## Step 6: Clerk Dashboard Setup

### After coding, configure in Clerk:

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Webhooks** in sidebar
4. Click **+ Add Endpoint**
5. Enter your endpoint URL:
   - Development: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - Production: `https://api.yourdomain.com/api/webhooks/clerk`
6. Select events to subscribe:
   - ☑️ user.created
   - ☑️ user.updated
   - ☑️ user.deleted
7. Copy the **Signing Secret** → Add to `.env`

---

## Step 7: Testing Plan

### 1. Local testing with ngrok:

```bash
ngrok http 3000
```

Use the ngrok URL in Clerk webhook settings

### 2. Test user.created:

- Sign up a new user in your frontend
- Check Clerk webhook logs (in dashboard)
- Verify User created in MongoDB

### 3. Test user.updated:

- Update user profile in Clerk
- Check MongoDB for updated data

### 4. Test user.deleted:

- Delete user from Clerk dashboard
- Verify user removed from MongoDB

---

## Step 8: Error Handling

### What to handle:

- Duplicate user (user.created for existing clerkUserId)
- User not found (user.updated/deleted for non-existent user)
- Database connection errors
- Invalid webhook signature

### Best practice:

- Return 200 OK even on errors (Clerk retries otherwise)
- Log errors for debugging
- Use try-catch blocks

---

## Step 9: File Structure Summary

### Files to create:

1. `src/routes/webhooks.routes.ts` - Route definition
2. `src/controllers/webhooks.controller.ts` - Event handlers
3. `src/middlewares/verifyWebhook.ts` - Signature verification
4. `src/services/user.service.ts` - MongoDB operations
5. Update `src/index.ts` - Register webhook route

### Environment variables to add:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Step 10: Integration with Main App

In your `src/index.ts`, register the webhook route:

```typescript
import webhookRoutes from "./routes/webhooks.routes.js";

// IMPORTANT: Webhook route must use raw body (before express.json())
app.use("/api/webhooks", webhookRoutes);
app.use(express.json()); // Other routes use JSON
```

---

## 📋 Implementation Checklist:

- [x] Install `svix` package
- [x] Create webhook verification middleware
- [x] Create user service (CRUD operations)
- [x] Create webhook controller with event handlers
- [x] Create webhook routes
- [x] Add `CLERK_WEBHOOK_SECRET` to `.env`
- [x] Register webhook route in main app
- [x] Set up ngrok for local testing
- [ ] Configure webhook in Clerk Dashboard
- [ ] Test user.created event
- [ ] Test user.updated event
- [ ] Test user.deleted event
- [ ] Add error logging
- [ ] Deploy to production and update Clerk webhook URL

---

## 🚀 Quick Start

1. Install dependencies:

   ```bash
   yarn add svix
   ```

2. Add to `.env`:

   ```env
   CLERK_WEBHOOK_SECRET=your_webhook_secret_here
   ```

3. Create the files listed in Step 9

4. Start ngrok:

   ```bash
   ngrok http 3000
   ```

5. Configure webhook in Clerk Dashboard with ngrok URL

6. Test by creating a new user in your app

---

## 📚 Resources

- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks/overview)
- [Svix Documentation](https://docs.svix.com/)
- [Express.js Raw Body](https://expressjs.com/en/api.html#express.raw)
