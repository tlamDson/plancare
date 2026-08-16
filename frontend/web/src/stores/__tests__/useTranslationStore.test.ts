import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  useTranslationStore,
  TRANSLATIONS,
  type Language,
} from "../useTranslationStore";

const INITIAL_STATE = useTranslationStore.getState();

beforeEach(() => {
  localStorage.clear();
  useTranslationStore.setState(INITIAL_STATE, true);
});

describe("t()", () => {
  it("returns the correct string for each language", () => {
    useTranslationStore.setState({ language: "English (US)" });
    expect(useTranslationStore.getState().t("nav.personal")).toBe(
      "Personal Information",
    );

    useTranslationStore.setState({ language: "French" });
    expect(useTranslationStore.getState().t("nav.personal")).not.toBe(
      "Personal Information",
    );

    useTranslationStore.setState({ language: "Vietnamese" });
    expect(useTranslationStore.getState().t("nav.personal")).not.toBe(
      "Personal Information",
    );
  });

  it("falls back to English when the key is missing from the current language", () => {
    useTranslationStore.setState({ language: "French" });
    // Inject a key that exists only in English for this assertion.
    const originalFr = { ...TRANSLATIONS.French };
    delete (TRANSLATIONS.French as Record<string, string>)["nav.personal"];
    expect(useTranslationStore.getState().t("nav.personal")).toBe(
      TRANSLATIONS["English (US)"]["nav.personal"],
    );
    TRANSLATIONS.French = originalFr;
  });

  it("returns the raw key when missing from every language", () => {
    useTranslationStore.setState({ language: "English (US)" });
    expect(useTranslationStore.getState().t("totally.unknown.key")).toBe(
      "totally.unknown.key",
    );
  });
});

describe("i18n completeness (design.md: every new string needs all 3 languages)", () => {
  it("every English key has a French and Vietnamese counterpart", () => {
    const enKeys = Object.keys(TRANSLATIONS["English (US)"]);
    const missingInFrench = enKeys.filter((k) => !(k in TRANSLATIONS.French));
    const missingInVietnamese = enKeys.filter(
      (k) => !(k in TRANSLATIONS.Vietnamese),
    );
    expect(missingInFrench).toEqual([]);
    expect(missingInVietnamese).toEqual([]);
  });
});

describe("setLanguage / setCurrency / setDistanceUnit — localStorage persistence", () => {
  it("persists language to localStorage merged with existing prefs", () => {
    localStorage.setItem(
      "user-preferences",
      JSON.stringify({ currency: "EUR" }),
    );
    useTranslationStore.getState().setLanguage("French");
    const saved = JSON.parse(localStorage.getItem("user-preferences")!);
    expect(saved.language).toBe("French");
    expect(saved.currency).toBe("EUR");
    expect(useTranslationStore.getState().language).toBe("French");
  });

  it("persists currency to localStorage", () => {
    useTranslationStore.getState().setCurrency("VND");
    const saved = JSON.parse(localStorage.getItem("user-preferences")!);
    expect(saved.currency).toBe("VND");
    expect(useTranslationStore.getState().currency).toBe("VND");
  });

  it("persists distanceUnit to localStorage", () => {
    useTranslationStore.getState().setDistanceUnit("Miles");
    const saved = JSON.parse(localStorage.getItem("user-preferences")!);
    expect(saved.distance).toBe("Miles");
    expect(useTranslationStore.getState().distanceUnit).toBe("Miles");
  });

  it("does not throw when localStorage.setItem fails (e.g. Safari private mode)", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(() =>
      useTranslationStore.getState().setLanguage("French" as Language),
    ).not.toThrow();
    expect(useTranslationStore.getState().language).toBe("French");
    spy.mockRestore();
  });
});
