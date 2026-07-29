import { describe, expect, it } from "vitest";
import {
  ACCESS_POLL_MAX_MS,
  deriveAccessUiState,
} from "@/lib/enrollments/access-status";

describe("deriveAccessUiState", () => {
  it("returns waiting while inactive and under the timeout", () => {
    expect(
      deriveAccessUiState({ activated: false, elapsedMs: 0 }),
    ).toBe("waiting");
    expect(
      deriveAccessUiState({ activated: false, elapsedMs: 59_999 }),
    ).toBe("waiting");
  });

  it("returns activated as soon as enrollment is confirmed", () => {
    expect(
      deriveAccessUiState({ activated: true, elapsedMs: 0 }),
    ).toBe("activated");
    expect(
      deriveAccessUiState({ activated: true, elapsedMs: ACCESS_POLL_MAX_MS }),
    ).toBe("activated");
  });

  it("returns delayed after the timeout without activation", () => {
    expect(
      deriveAccessUiState({
        activated: false,
        elapsedMs: ACCESS_POLL_MAX_MS,
      }),
    ).toBe("delayed");
    expect(
      deriveAccessUiState({
        activated: false,
        elapsedMs: ACCESS_POLL_MAX_MS + 1,
      }),
    ).toBe("delayed");
  });
});
