import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";

// Mock socket.io-client to avoid actual websocket connection in JSDOM
vi.mock("socket.io-client", () => {
  return {
    io: () => ({
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    }),
  };
});

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}{location.search}</div>;
};

describe("NotificationBell Live Click-Through Verification", () => {
  const mockNotifications = [
    {
      _id: "notif-1",
      type: "group_join_request",
      message: "Someone requested to join your group: Private Math Club",
      isRead: false,
      relatedContentId: "group-join-123",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "notif-2",
      type: "group_session_scheduled",
      message: "New session scheduled in Private Math Club: Final Exam Review",
      isRead: false,
      relatedContentId: "group-session-456",
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.toString().includes("/unread-count")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ count: 2 }),
        });
      }
      if (url.toString().includes("/api/notifications")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ notifications: mockNotifications }),
        });
      }
      return Promise.reject(new Error("Unhandled url: " + url));
    });
  });

  it("actually navigates to /study-groups/:id?tab=manage when clicking a group_join_request notification in the DOM", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <NotificationBell />
        <LocationDisplay />
      </MemoryRouter>
    );

    // Initial location should be /dashboard
    expect(screen.getByTestId("current-location").textContent).toBe("/dashboard");

    // Click the bell icon to open the notifications popover
    const bellButton = screen.getByRole("button");
    fireEvent.click(bellButton);

    // Wait for the join request notification message to appear in the DOM
    const joinNotifText = await screen.findByText("Someone requested to join your group: Private Math Club");
    expect(joinNotifText).toBeDefined();

    // Click on the notification link in the live DOM
    fireEvent.click(joinNotifText);

    // Confirm React Router navigated to the exact URL with ?tab=manage query param!
    await waitFor(() => {
      expect(screen.getByTestId("current-location").textContent).toBe("/study-groups/group-join-123?tab=manage");
    });
    console.log("Verified DOM Click for join request -> Resulting URL:", screen.getByTestId("current-location").textContent);
  });

  it("actually navigates to /study-groups/:id?tab=sessions when clicking a group_session_scheduled notification in the DOM", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <NotificationBell />
        <LocationDisplay />
      </MemoryRouter>
    );

    expect(screen.getByTestId("current-location").textContent).toBe("/dashboard");

    const bellButton = screen.getByRole("button");
    fireEvent.click(bellButton);

    const sessionNotifText = await screen.findByText("New session scheduled in Private Math Club: Final Exam Review");
    expect(sessionNotifText).toBeDefined();

    // Click on the session notification link in the live DOM
    fireEvent.click(sessionNotifText);

    // Confirm React Router navigated to the exact URL with ?tab=sessions query param!
    await waitFor(() => {
      expect(screen.getByTestId("current-location").textContent).toBe("/study-groups/group-session-456?tab=sessions");
    });
    console.log("Verified DOM Click for session -> Resulting URL:", screen.getByTestId("current-location").textContent);
  });
});
