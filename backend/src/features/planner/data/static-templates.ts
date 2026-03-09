import { IItineraryDay } from "../models/Trip.types";

export const STATIC_TEMPLATES: Record<string, IItineraryDay[]> = {
  hanoi: [
    {
      day: 1,
      date: new Date(),
      activities: [
        {
          type: "poi",
          name: "Hoan Kiem Lake",
          location: {
            type: "Point",
            coordinates: [105.8523, 21.0285],
          },
          time: "09:00",
          endTime: "11:00",
          status: "planned",
          order: 1,
        },
        {
          type: "poi",
          name: "Temple of Literature",
          location: {
            type: "Point",
            coordinates: [105.8355, 21.0294],
          },
          time: "14:00",
          endTime: "16:00",
          status: "planned",
          order: 2,
        },
      ],
    },
  ],
  "ho chi minh": [
    {
      day: 1,
      date: new Date(),
      activities: [
        {
          type: "poi",
          name: "Ben Thanh Market",
          location: {
            type: "Point",
            coordinates: [106.6976, 10.7725],
          },
          time: "09:00",
          endTime: "11:00",
          status: "planned",
          order: 1,
        },
        {
          type: "poi",
          name: "Independence Palace",
          location: {
            type: "Point",
            coordinates: [106.6953, 10.777],
          },
          time: "14:00",
          endTime: "16:00",
          status: "planned",
          order: 2,
        },
      ],
    },
  ],
  paris: [
    {
      day: 1,
      date: new Date(),
      activities: [
        {
          type: "poi",
          name: "Eiffel Tower",
          location: {
            type: "Point",
            coordinates: [2.2945, 48.8584],
          },
          time: "09:00",
          endTime: "12:00",
          status: "planned",
          order: 1,
        },
        {
          type: "poi",
          name: "Louvre Museum",
          location: {
            type: "Point",
            coordinates: [2.3376, 48.8606],
          },
          time: "14:00",
          endTime: "18:00",
          status: "planned",
          order: 2,
        },
      ],
    },
  ],
  kyoto: [
    {
      day: 1,
      date: new Date(),
      activities: [
        {
          type: "poi",
          name: "Fushimi Inari Taisha",
          location: {
            type: "Point",
            coordinates: [135.7727, 34.9671],
          },
          time: "08:00",
          endTime: "11:00",
          status: "planned",
          order: 1,
        },
        {
          type: "poi",
          name: "Kinkaku-ji",
          location: {
            type: "Point",
            coordinates: [135.7292, 35.0394],
          },
          time: "14:00",
          endTime: "16:00",
          status: "planned",
          order: 2,
        },
      ],
    },
  ],
};
