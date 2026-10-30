import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";
import { stripControlChars } from "../sanitize.ts";

export interface ToolCallProps {
  name: string;
  status: "pending" | "complete";
  result?: string;
}

export function ToolCall({ name, status, result }: ToolCallProps) {
  return (
    <Box flexDirection="column" marginLeft={2}>
      <Box>
        <Text color="yellow">⚡ </Text>
        <Text color="yellow" bold>
          {stripControlChars(name)}
        </Text>
        {status === "pending" ? (
          <Text>
            {" "}
            <Text color="cyan">
              <InkSpinner type="dots" />
            </Text>
          </Text>
        ) : (
          <Text color="green"> ✓</Text>
        )}
      </Box>
      {status === "complete" && result && (
        <Box marginLeft={2}>
          <Text dimColor>
            → {stripControlChars(result.slice(0, 100))}
            {result.length > 100 ? "..." : ""}
          </Text>
        </Box>
      )}
    </Box>
  );
}
