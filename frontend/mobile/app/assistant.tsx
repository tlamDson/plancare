import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";
import { ArrowLeft, Send, Sparkles, User } from "lucide-react-native";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm your AI travel assistant. I can help you plan trips, suggest destinations, optimize itineraries, and answer any travel-related questions. How can I help you today?",
  },
];

const suggestions = [
  "Suggest a 7-day trip to Japan",
  "What should I pack for a beach vacation?",
  "Best time to visit Paris?",
  "Budget breakdown for a week in Tokyo",
];

export default function AssistantScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getAIResponse(messageText),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const getAIResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("japan")) {
      return "Japan is an amazing destination! For a 7-day trip, I'd suggest:\n\nDay 1-3: Tokyo (Shibuya, Senso-ji, Akihabara)\nDay 4: Mt. Fuji day trip\nDay 5-6: Kyoto (Fushimi Inari, Arashiyama)\nDay 7: Osaka (food tour)\n\nBudget estimate: $2,000-3,500 per person including flights.";
    }
    if (q.includes("pack") || q.includes("beach")) {
      return "For a beach vacation, don't forget:\n\n✓ Swimsuits (2-3)\n✓ Sunscreen (SPF 50+)\n✓ Sunglasses & hat\n✓ Light cover-ups\n✓ Sandals & water shoes\n✓ Waterproof phone case\n✓ Beach towel\n✓ Aloe vera gel";
    }
    if (q.includes("paris")) {
      return "The best times to visit Paris are:\n\n🌸 Spring (April-June): Perfect weather, blooming gardens\n🍂 Fall (Sept-Nov): Fewer crowds, beautiful colors\n\nAvoid July-August (crowded & hot) and December-February (cold & rainy) unless you want specific experiences like Christmas markets.";
    }
    if (q.includes("budget") || q.includes("tokyo")) {
      return "Here's a realistic Tokyo budget for 7 days:\n\n🏨 Accommodation: $700-1,400\n🍱 Food: $350-700\n🚇 Transport: $100-150\n🎌 Activities: $200-400\n🛍️ Shopping: $200+\n\nTotal: $1,550-2,850 per person (excluding flights)";
    }
    return "That's a great question! I'd be happy to help you with that. Could you provide more details about your travel preferences, budget, or specific destinations you're interested in?";
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Sparkles size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            AI Assistant
          </Text>
        </View>
        <ThemeToggle />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.role === "user" ? styles.userRow : styles.assistantRow,
              ]}
            >
              {message.role === "assistant" && (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: `${colors.primary}20` },
                  ]}
                >
                  <Sparkles size={16} color={colors.primary} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.role === "user"
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.muted },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    {
                      color:
                        message.role === "user"
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {message.content}
                </Text>
              </View>
              {message.role === "user" && (
                <View
                  style={[styles.avatar, { backgroundColor: colors.muted }]}
                >
                  <User size={16} color={colors.foreground} />
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Sparkles size={16} color={colors.primary} />
              </View>
              <View
                style={[
                  styles.messageBubble,
                  { backgroundColor: colors.muted },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Thinking...
                </Text>
              </View>
            </View>
          )}

          {/* Suggestions (only show if no user messages) */}
          {messages.length === 1 && (
            <View style={styles.suggestions}>
              <Text
                style={[
                  styles.suggestionsTitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Try asking:
              </Text>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionChip,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => handleSend(suggestion)}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      { color: colors.foreground },
                    ]}
                  >
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={[styles.inputContainer, { borderTopColor: colors.border }]}
        >
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.muted, color: colors.foreground },
            ]}
            placeholder="Ask me anything about travel..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: input.trim() ? colors.primary : colors.muted },
            ]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <Send
              size={20}
              color={
                input.trim() ? colors.primaryForeground : colors.mutedForeground
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  suggestions: {
    marginTop: 24,
    gap: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
