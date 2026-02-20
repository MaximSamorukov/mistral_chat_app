import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

export function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I help you today?", sender: "ai" },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        text: "This is a simulated AI response to: " + inputValue,
        sender: "ai",
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <Container maxW="2xl" h="100vh" py={8}>
      <VStack h="full" gap={4} align="stretch">
        <Heading size="lg" textAlign="center">
          AI Chat
        </Heading>

        <Box
          flex="1"
          p={4}
          borderWidth="1px"
          borderRadius="lg"
          overflowY="auto"
          bg="gray.50"
          _dark={{ bg: "gray.900" }}
        >
          <VStack gap={4} align="stretch">
            {messages.map((msg) => (
              <Box
                key={msg.id}
                alignSelf={msg.sender === "user" ? "flex-end" : "flex-start"}
                bg={msg.sender === "user" ? "blue.500" : "white"}
                color={msg.sender === "user" ? "white" : "black"}
                _dark={{
                  bg: msg.sender === "user" ? "blue.600" : "gray.800",
                  color: "white",
                }}
                px={4}
                py={2}
                borderRadius="lg"
                maxW="80%"
                boxShadow="sm"
              >
                <Text fontSize="md">{msg.text}</Text>
              </Box>
            ))}
          </VStack>
        </Box>

        <HStack gap={2}>
          <Input
            placeholder="Type your prompt here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            size="lg"
          />
          <Button colorPalette="blue" onClick={handleSendMessage} size="lg">
            Send
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}
