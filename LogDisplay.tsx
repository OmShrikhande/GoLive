import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";

interface LogEntry {
  message: string;
  timestamp: string;
  type: "log" | "error" | "warn";
}

export class LogManager {
  private static instance: LogManager;
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();

  private constructor() {
    this.setupConsoleOverride();
  }

  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  private setupConsoleOverride() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      originalLog(...args);
      this.addLog(args.join(" "), "log");
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      this.addLog(args.join(" "), "error");
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      this.addLog(args.join(" "), "warn");
    };
  }

  private addLog(message: string, type: "log" | "error" | "warn") {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry: LogEntry = { message, timestamp, type };
    
    this.logs.push(logEntry);
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    this.notifyListeners();
  }

  subscribe(callback: (logs: LogEntry[]) => void): (() => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback([...this.logs]));
  }

  getLogs() {
    return [...this.logs];
  }
}

export const LogDisplay = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const logManager = LogManager.getInstance();
    const unsubscribe = logManager.subscribe(setLogs);
    setLogs(logManager.getLogs());

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        scrollEventThrottle={16}
        onContentSizeChange={(width, height) => {}}
      >
        {logs.map((log, index) => (
          <View
            key={index}
            style={[
              styles.logEntry,
              log.type === "error" && styles.errorLog,
              log.type === "warn" && styles.warnLog,
            ]}
          >
            <Text style={styles.timestamp}>{log.timestamp}</Text>
            <Text
              style={[
                styles.message,
                log.type === "error" && styles.errorText,
                log.type === "warn" && styles.warnText,
              ]}
              numberOfLines={2}
            >
              {log.message}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logEntry: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  errorLog: {
    backgroundColor: "#3a1a1a",
  },
  warnLog: {
    backgroundColor: "#3a3a1a",
  },
  timestamp: {
    fontSize: 10,
    color: "#999",
    marginBottom: 2,
  },
  message: {
    fontSize: 11,
    color: "#ccc",
    fontFamily: "monospace",
  },
  errorText: {
    color: "#ff6b6b",
  },
  warnText: {
    color: "#ffd93d",
  },
});
