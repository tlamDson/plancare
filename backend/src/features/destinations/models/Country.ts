/**
 * Country Model — Embedded City Document
 *
 * Hybrid schema: Cities are embedded inside Country for high-read performance
 * (99% Reads / 1% Writes). insightText is populated by the BullMQ insight worker.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface ICityEmbedded {
  idKey: string;
  name: string;         // Local language name
  nameEn: string;       // English name for AI/Google API queries
  timezone: string;     // IANA timezone string
  insightText?: string | null;
  insightUpdatedAt?: Date | null;
}

export interface ICountry extends Document {
  idKey: string;
  name: string;         // Local language name
  nameEn: string;       // English name
  flagEmoji?: string;
  isSupported: boolean;
  cities: ICityEmbedded[];
  createdAt: Date;
  updatedAt: Date;
}

const CityEmbeddedSchema = new Schema<ICityEmbedded>(
  {
    idKey: { type: String, required: true },
    name: { type: String, required: true },
    nameEn: { type: String, required: true },
    timezone: { type: String, required: true, default: "UTC" },
    insightText: { type: String, default: null },
    insightUpdatedAt: { type: Date, default: null },
  },
  { _id: false },
);

const CountrySchema = new Schema<ICountry>(
  {
    idKey: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    nameEn: { type: String, required: true },
    flagEmoji: { type: String },
    isSupported: { type: Boolean, default: true },
    cities: { type: [CityEmbeddedSchema], default: [] },
  },
  { timestamps: true },
);

// Secondary indexes for RAG lookup by city
CountrySchema.index({ "cities.idKey": 1 });
CountrySchema.index({ "cities.nameEn": 1 });

export const Country = mongoose.model<ICountry>("Country", CountrySchema);
