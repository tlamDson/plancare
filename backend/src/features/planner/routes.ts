import { Router } from "express";
import {
  generateTrip,
  getTripById,
  getUserTrips,
} from "./controllers/planner.controller";
import { requireUserAuth } from "../../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Generate new trip
 *     description: Creates a trip generation job with budget validation
 *     tags: [Trips]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *                 required: true
 *     responses:
 *       202:
 *         description: Trip generation started
 *       400:
 *         description: Validation error (budget too low, invalid dates, etc.)
 *       401:
 *         description: Unauthorized
 */
router.post("/trips", requireUserAuth, generateTrip);

/**
 * @swagger
 * /api/trips/{tripId}:
 *   get:
 *     summary: Get trip by ID
 *     description: Retrieve a specific trip (for polling)
 *     tags: [Trips]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip data
 *       404:
 *         description: Trip not found
 *       403:
 *         description: Forbidden (not owner)
 */
router.get("/trips/:tripId", requireUserAuth, getTripById);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get user's trips
 *     description: Retrieve all trips for authenticated user
 *     tags: [Trips]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of trips
 */
router.get("/trips", requireUserAuth, getUserTrips);

export default router;
