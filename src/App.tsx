import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { useModel } from "./model";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

export function App() {
  const [model] = useModel();
  const [isAncora, setIsAncora] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I help you today?", sender: "ai" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setAbortController(null);
    }
  };
  const scrollToBottom = () => {
    console.log(messagesEndRef.current);
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 40;
    if (isAtBottom) {
      console.log("Мы в самом низу!");
      setIsAncora(true);
    } else {
      console.log("Пользователь прокрутил наверх");
      setIsAncora(false);
    }
  };
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;
    setIsAncora(true);
    const userMsgText = inputValue;
    setInputValue("");
    setIsGenerating(true);

    const controller = new AbortController();
    setAbortController(controller);

    // 1. Add user message to UI
    const newUserMessage: Message = {
      id: Date.now(),
      text: userMsgText,
      sender: "user",
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // 2. Add placeholder AI message for streaming
    const aiMsgId = Date.now() + 1;
    const newAiMessage: Message = {
      id: aiMsgId,
      text: "",
      sender: "ai",
    };
    setMessages((prev) => [...prev, newAiMessage]);

    try {
      const history = messages.map((msg) =>
        msg.sender === "user"
          ? new HumanMessage(msg.text)
          : new AIMessage(msg.text),
      );
      history.push(new HumanMessage(userMsgText));

      // 3. Stream model response
      const stream = await model.stream(history, { signal: controller.signal });

      let fullContent = "";
      for await (const chunk of stream) {
        const content =
          typeof chunk.content === "string"
            ? chunk.content
            : JSON.stringify(chunk.content);
        fullContent += content;

        // Update the AI message in state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, text: fullContent } : msg,
          ),
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Generation aborted by user");
      } else {
        console.error("Failed to get AI response:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: "Sorry, I encountered an error. Please check your API key and connection.",
                }
              : msg,
          ),
        );
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  return (
    <Container maxW="5xl" h="100vh" py={8}>
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
          onScroll={handleScroll}
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
                maxW="90%"
                boxShadow="sm"
              >
                {msg.sender === "ai" ? (
                  <Box className="markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }: { children?: ReactNode }) => (
                          <Text mb={2}>{children}</Text>
                        ),
                        h1: ({ children }: { children?: ReactNode }) => (
                          <Heading size="md" mb={2}>
                            {children}
                          </Heading>
                        ),
                        h2: ({ children }: { children?: ReactNode }) => (
                          <Heading size="sm" mb={2}>
                            {children}
                          </Heading>
                        ),
                        ul: ({ children }: { children?: ReactNode }) => (
                          <Box as="ul" ml={4} mb={2}>
                            {children}
                          </Box>
                        ),
                        ol: ({ children }: { children?: ReactNode }) => (
                          <Box as="ol" ml={4} mb={2}>
                            {children}
                          </Box>
                        ),
                        li: ({ children }: { children?: ReactNode }) => (
                          <Box as="li" mb={1}>
                            {children}
                          </Box>
                        ),
                        code: ({ children }: { children?: ReactNode }) => (
                          <Box
                            as="code"
                            px={2}
                            py={0.5}
                            bg="gray.100"
                            _dark={{ bg: "gray.700" }}
                            borderRadius="sm"
                            fontSize="sm"
                          >
                            {children}
                          </Box>
                        ),
                        pre: ({ children }: { children?: ReactNode }) => (
                          <Box
                            as="pre"
                            p={4}
                            bg="gray.100"
                            _dark={{ bg: "gray.700" }}
                            borderRadius="md"
                            overflowX="auto"
                            mb={2}
                          >
                            {children}
                          </Box>
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </Box>
                ) : (
                  <Text fontSize="md">{msg.text}</Text>
                )}
              </Box>
            ))}
            {isAncora && <div ref={messagesEndRef} />}
          </VStack>
        </Box>

        <HStack gap={2}>
          <Input
            placeholder="Type your prompt here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            size="lg"
            disabled={isGenerating}
          />
          <Button
            colorPalette="blue"
            onClick={handleSendMessage}
            size="lg"
            disabled={isGenerating}
          >
            Send
          </Button>
          <Button
            colorPalette="red"
            onClick={handleStop}
            size="lg"
            disabled={!isGenerating}
          >
            Stop
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}
