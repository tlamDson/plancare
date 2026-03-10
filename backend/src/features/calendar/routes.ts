/**
 * Calendar Routes
 */

import { Router } from "express";
import { requireUserAuth } from "../../middlewares/auth";
import { syncTripToCalendar } from "./controllers/calendar.controller";

const router = Router();

/**
 * @swagger
 * /api/trips/{tripId}/sync-calendar:
 *   post:
 *     summary: Sync trip to Google Calendar
 *     description: Queues a background job to sync the trip's itinerary to the user's Google Calendar
 *     tags: [Calendar]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Sync job queued
 *       400:
 *         description: Google not connected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 */
router.post(
  "/trips/:tripId/sync-calendar",
  requireUserAuth,
  syncTripToCalendar,
);

export default router;
