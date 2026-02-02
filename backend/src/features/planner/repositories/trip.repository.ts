import Trip, { ITrip } from "../models/Trip";
import { Types } from "mongoose";

// ============================================
// TRIP REPOSITORY (Data Access Layer)
// Separates business logic from database queries
// ============================================

export class TripRepository {
  /**
   * Create a new trip with a safe default status
   */
  async create(tripData: Partial<ITrip>): Promise<ITrip> {
    const trip = new Trip({
      ...tripData,
      status: tripData.status ?? "DRAFT",
      isAgentProcessing: tripData.isAgentProcessing ?? false,
      version: tripData.version ?? 1,
    });
    return trip.save();
  }

  /**
   * Find trip by ID
   */
  async findById(tripId: string | Types.ObjectId): Promise<ITrip | null> {
    return Trip.findById(tripId).exec();
  }

  /**
   * Find trip by agent job ID
   */
  async findByJobId(jobId: string): Promise<ITrip | null> {
    return Trip.findOne({ agentJobId: jobId }).exec();
  }

  /**
   * Find all trips for a user
   */
  async findByUserId(
    userId: string,
    options?: {
      status?: string;
      limit?: number;
      skip?: number;
      sortBy?: string;
    }
  ): Promise<ITrip[]> {
    const query: any = { userId };
    
    if (options?.status) {
      query.status = options.status;
    }
    
    let queryBuilder = Trip.find(query);
    
    if (options?.sortBy) {
      queryBuilder = queryBuilder.sort(options.sortBy);
    } else {
      queryBuilder = queryBuilder.sort({ startDate: -1 });
    }
    
    if (options?.skip) {
      queryBuilder = queryBuilder.skip(options.skip);
    }
    
    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }
    
    return queryBuilder.exec();
  }

  /**
   * Acquire agent lock (prevents concurrent modifications)
   */
  async acquireLock(tripId: string | Types.ObjectId, jobId: string): Promise<ITrip | null> {
    return Trip.findOneAndUpdate(
      { _id: tripId, isAgentProcessing: false },
      {
        isAgentProcessing: true,
        agentJobId: jobId,
        agentLockedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  /**
   * Release agent lock
   */
  async releaseLock(tripId: string | Types.ObjectId, jobId: string): Promise<ITrip | null> {
    return Trip.findOneAndUpdate(
      { _id: tripId, agentJobId: jobId },
      {
        isAgentProcessing: false,
        $unset: { agentJobId: 1, agentLockedAt: 1 },
      },
      { new: true }
    ).exec();
  }

  /**
   * Update trip status
   */
  async updateStatus(
    tripId: string | Types.ObjectId,
    status: ITrip["status"]
  ): Promise<ITrip | null> {
    return Trip.findByIdAndUpdate(
      tripId,
      { status },
      { new: true }
    ).exec();
  }

  /**
   * Update trip data (with optimistic locking)
   */
  async update(
    tripId: string | Types.ObjectId,
    updateData: Partial<ITrip>,
    currentVersion?: number
  ): Promise<ITrip | null> {
    const query: any = { _id: tripId };
    
    // Optimistic concurrency control
    if (currentVersion !== undefined) {
      query.version = currentVersion;
    }
    
    return Trip.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    ).exec();
  }

  /**
   * Delete trip
   */
  async delete(tripId: string | Types.ObjectId): Promise<boolean> {
    const result = await Trip.findByIdAndDelete(tripId).exec();
    return result !== null;
  }

  /**
   * Count trips by user
   */
  async countByUserId(userId: string, status?: string): Promise<number> {
    const query: any = { userId };
    if (status) {
      query.status = status;
    }
    return Trip.countDocuments(query).exec();
  }

  /**
   * Find stale locked trips (locked for >10 minutes)
   */
  async findStaleLocks(minutes: number = 10): Promise<ITrip[]> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);
    
    return Trip.find({
      isAgentProcessing: true,
      agentLockedAt: { $lt: cutoffTime },
    }).exec();
  }

  /**
   * Release stale locks (recovery mechanism)
   */
  async releaseStaleLocks(minutes: number = 10): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);
    
    const result = await Trip.updateMany(
      {
        isAgentProcessing: true,
        agentLockedAt: { $lt: cutoffTime },
      },
      {
        isAgentProcessing: false,
        $unset: { agentJobId: 1, agentLockedAt: 1 },
      }
    ).exec();
    
    return result.modifiedCount;
  }
}

// Singleton instance
export const tripRepository = new TripRepository();
