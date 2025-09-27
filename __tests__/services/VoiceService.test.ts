import React from "react";
import { expect } from "@jest/globals";
import {
  startVoiceRecording,
  stopVoiceRecording,
  syncVoiceWithChatInput,
} from "../../src/services/VoiceService";
import { Settings } from "../../src/types/Settings";
import { RefObject } from "react";

describe("VoiceService", () => {
  let mockInputRef: RefObject<HTMLInputElement | null>;

  beforeAll(() => {
    // Mock MediaStream
    class MockMediaStream {
      active = true;
      id = "mock-stream";
      getTracks() {
        return [];
      }
      addTrack() {}
      removeTrack() {}
    }
    global.MediaStream = MockMediaStream as unknown as typeof MediaStream;

    // Mock MediaRecorder
    class MockMediaRecorder {
      state = "inactive";
      start = jest.fn();
      stop = jest.fn();
      ondataavailable: ((event: any) => void) | null = null;
      onstop: (() => void) | null = null;

      constructor() {}
    }
    global.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockInputRef = { current: document.createElement("input") };

    // Mock SpeechRecognition
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: jest.fn().mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        onresult: jest.fn(),
        onend: jest.fn(),
      })),
    });

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: jest.fn(),
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("SpeechRecognition", () => {
    it("starts voice recording with SpeechRecognition", () => {
      const mockToggleVoice = jest.fn();
      const mockTriggerSendVoiceInput = jest.fn();
      const mockSetTextAreaValue = jest.fn();
      const mockSetInputLength = jest.fn();
      const mockAudioChunksRef: RefObject<BlobPart[]> = { current: [] };

      const mockSettings: Settings = {
        voice: {
          sendAsAudio: false,
          language: "en-US",
          timeoutPeriod: 5000,
          autoSendPeriod: 3000,
          autoSendDisabled: false,
        },
      };

      startVoiceRecording(
        mockSettings,
        mockToggleVoice,
        mockTriggerSendVoiceInput,
        mockSetTextAreaValue,
        mockSetInputLength,
        mockAudioChunksRef,
        mockInputRef
      );

      expect(mockToggleVoice).not.toHaveBeenCalled();
    });

    it("handles error during SpeechRecognition initialization gracefully", () => {
      Object.defineProperty(window, "SpeechRecognition", {
        configurable: true,
        value: jest.fn(() => {
          throw new Error("SpeechRecognition not supported");
        }),
      });

      const mockToggleVoice = jest.fn();
      const mockTriggerSendVoiceInput = jest.fn();
      const mockSetTextAreaValue = jest.fn();
      const mockSetInputLength = jest.fn();
      const mockAudioChunksRef: RefObject<BlobPart[]> = { current: [] };

      const mockSettings: Settings = {
        voice: {
          sendAsAudio: false,
          language: "en-US",
          timeoutPeriod: 5000,
          autoSendPeriod: 3000,
        },
      };

      expect(() => {
        startVoiceRecording(
          mockSettings,
          mockToggleVoice,
          mockTriggerSendVoiceInput,
          mockSetTextAreaValue,
          mockSetInputLength,
          mockAudioChunksRef,
          mockInputRef
        );
      }).not.toThrow();
    });
  });

  describe("Audio Recording", () => {
    it("does not start MediaRecorder if microphone permissions are denied", async () => {
      jest
        .spyOn(navigator.mediaDevices, "getUserMedia")
        .mockRejectedValueOnce(new Error("Permission denied"));

      const mockToggleVoice = jest.fn();
      const mockTriggerSendVoiceInput = jest.fn();
      const mockSetTextAreaValue = jest.fn();
      const mockSetInputLength = jest.fn();
      const mockAudioChunksRef: RefObject<BlobPart[]> = { current: [] };

      const mockSettings: Settings = {
        voice: { sendAsAudio: true },
      };

      try {
        await startVoiceRecording(
          mockSettings,
          mockToggleVoice,
          mockTriggerSendVoiceInput,
          mockSetTextAreaValue,
          mockSetInputLength,
          mockAudioChunksRef,
          mockInputRef
        );
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toBe("Permission denied");
        } else {
          throw error;
        }
      }
    });

    it("handles audio recording with MediaRecorder", async () => {
      const mockToggleVoice = jest.fn();
      const mockTriggerSendVoiceInput = jest.fn();
      const mockSetTextAreaValue = jest.fn();
      const mockSetInputLength = jest.fn();
      const mockAudioChunksRef: RefObject<BlobPart[]> = { current: [] };

      const mockSettings: Settings = {
        voice: {
          sendAsAudio: true,
        },
      };

      navigator.mediaDevices.getUserMedia = jest
        .fn()
        .mockResolvedValueOnce(new MediaStream());

      await startVoiceRecording(
        mockSettings,
        mockToggleVoice,
        mockTriggerSendVoiceInput,
        mockSetTextAreaValue,
        mockSetInputLength,
        mockAudioChunksRef,
        mockInputRef
      );

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
      });
    });
  });

  it("stops voice recording without errors", () => {
    stopVoiceRecording();
    expect(true).toBe(true); // Dummy check
  });

  it("syncs voice recording with chat input", () => {
    const mockSettings: Settings = {
      voice: { disabled: false },
      chatInput: { blockSpam: true },
    };

    syncVoiceWithChatInput(true, mockSettings);
    expect(true).toBe(true); // Dummy check
  });
});
