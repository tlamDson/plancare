import { Types } from "mongoose";
import AISession from "../../planner/models/AISession";
import { userRepository } from "../../user/repositories/user.repository";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

type AssistantSession = {
  id: string;
  tripId?: string;
  messages: AssistantMessage[];
  createdAt: Date;
  updatedAt: Date;
};

const mapMessage = (message: any): AssistantMessage => ({
  id: message._id?.toString() ?? `${Date.now()}`,
  role: message.role,
  content: message.content,
  createdAt: message.createdAt,
});

const mapSession = (session: any): AssistantSession => ({
  id: session._id.toString(),
  tripId: session.tripId?.toString(),
  messages: session.messages.map(mapMessage),
  createdAt: session.createdAt,
  updatedAt: session.updatedAt ?? session.createdAt,
});

const buildAssistantReply = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) {
    return "I'm here when you're ready to plan your next trip.";
  }

  return `Got it! I'm reviewing your request: "${trimmed}". I'll suggest options shortly.`;
};

export class AssistantService {
  async createSession(params: {
    clerkUserId: string;
    tripId?: string;
  }): Promise<AssistantSession> {
    const { clerkUserId, tripId } = params;
    const user = await userRepository.findByClerkId(clerkUserId);
    if (!user) {
      throw new Error("User not found");
    }

    const session = await AISession.create({
      userId: user._id,
      tripId: tripId && Types.ObjectId.isValid(tripId)
        ? new Types.ObjectId(tripId)
        : undefined,
      messages: [],
    });

    return mapSession(session);
  }

  async getSession(params: {
    clerkUserId: string;
    sessionId: string;
  }): Promise<AssistantSession | null> {
    const { clerkUserId, sessionId } = params;
    const user = await userRepository.findByClerkId(clerkUserId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!Types.ObjectId.isValid(sessionId)) {
      return null;
    }

    const session = await AISession.findOne({
      _id: sessionId,
      userId: user._id,
    });

    return session ? mapSession(session) : null;
  }

  async addMessage(params: {
    clerkUserId: string;
    sessionId: string;
    content: string;
  }): Promise<AssistantMessage> {
    const { clerkUserId, sessionId, content } = params;
    const user = await userRepository.findByClerkId(clerkUserId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!Types.ObjectId.isValid(sessionId)) {
      throw new Error("Session not found");
    }

    const session = await AISession.findOne({
      _id: sessionId,
      userId: user._id,
    });

    if (!session) {
      throw new Error("Session not found");
    }

    session.messages.push({
      role: "user",
      content,
      createdAt: new Date(),
    });

    const reply = buildAssistantReply(content);
    session.messages.push({
      role: "assistant",
      content: reply,
      createdAt: new Date(),
    });

    await session.save();

    const assistantMessage = session.messages[session.messages.length - 1];
    return mapMessage(assistantMessage);
  }

  async streamMessage(params: {
    clerkUserId: string;
    sessionId: string;
    content: string;
  }): Promise<string> {
    const { content } = params;
    const message = await this.addMessage(params);
    return message.content || buildAssistantReply(content);
  }

  async getTripSuggestions(params: {
    clerkUserId: string;
    tripId: string;
    type?: string;
  }): Promise<{ suggestions: string[] }> {
    const { type } = params;
    const suggestionsByType: Record<string, string[]> = {
      activities: ["Local walking tour", "Museum visit", "Food market"],
      restaurants: ["Neighborhood bistro", "Seafood spot", "Cafe brunch"],
      hotels: ["Boutique stay", "City center hotel", "Cozy guesthouse"],
    };

    const suggestions =
      suggestionsByType[type || "activities"] || suggestionsByType.activities;

    return { suggestions };
  }

  async deleteSession(params: {
    clerkUserId: string;
    sessionId: string;
  }): Promise<void> {
    const { clerkUserId, sessionId } = params;
    const user = await userRepository.findByClerkId(clerkUserId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!Types.ObjectId.isValid(sessionId)) {
      return;
    }

    await AISession.deleteOne({ _id: sessionId, userId: user._id });
  }
}

export const assistantService = new AssistantService();
