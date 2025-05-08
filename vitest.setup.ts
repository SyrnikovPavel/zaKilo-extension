import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Очистка после каждого теста
afterEach(() => {
  cleanup();
});
