import { describe, it, expect, beforeEach } from "vitest";
import { screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/renderWithProviders";
import { WizardDestinationPickers } from "../WizardDestinationPickers";
import { useTripWizardStore } from "@/stores/trip-wizard.store";
import type { DestinationCountry } from "@/features/planner/api/destinations.api";

const WIZARD_INITIAL = useTripWizardStore.getState();

const COUNTRIES: DestinationCountry[] = [
  {
    idKey: "vn",
    name: "Việt Nam",
    nameEn: "Vietnam",
    flagEmoji: "🇻🇳",
    isSupported: true,
    cities: [
      {
        idKey: "da_nang",
        name: "Đà Nẵng",
        nameEn: "Da Nang",
        timezone: "Asia/Ho_Chi_Minh",
        hasRagInsight: true,
      },
      {
        idKey: "hanoi",
        name: "Hà Nội",
        nameEn: "Hanoi",
        timezone: "Asia/Ho_Chi_Minh",
        hasRagInsight: false,
      },
    ],
  },
  {
    idKey: "jp",
    name: "Nhật Bản",
    nameEn: "Japan",
    flagEmoji: "🇯🇵",
    isSupported: false,
    cities: [
      {
        idKey: "tokyo",
        name: "Tokyo",
        nameEn: "Tokyo",
        timezone: "Asia/Tokyo",
        hasRagInsight: false,
      },
    ],
  },
];

beforeEach(() => {
  useTripWizardStore.setState(WIZARD_INITIAL, true);
  server.use(
    http.get("*/destinations", () =>
      HttpResponse.json({ success: true, countries: COUNTRIES }),
    ),
  );
});

describe("WizardDestinationPickers — country → city cascade", () => {
  it("only shows the country picker until a country is chosen", async () => {
    renderWithProviders(<WizardDestinationPickers />);
    await waitFor(() =>
      expect(screen.getAllByRole("combobox")).toHaveLength(1),
    );
  });

  it("selecting a country reveals a city picker filtered to that country", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WizardDestinationPickers />);

    await waitFor(() => screen.getByRole("combobox"));
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /Vietnam/ }));

    await waitFor(() =>
      expect(screen.getAllByRole("combobox")).toHaveLength(2),
    );
    const [, cityTrigger] = screen.getAllByRole("combobox");
    await user.click(cityTrigger);
    expect(
      await screen.findByRole("option", { name: /Da Nang/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Tokyo/ }),
    ).not.toBeInTheDocument();
  });

  it("writes destination + countryIdKey + cityIdKey into the store on city selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WizardDestinationPickers />);

    await waitFor(() => screen.getByRole("combobox"));
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /Vietnam/ }));

    const [, cityTrigger] = screen.getAllByRole("combobox");
    await user.click(cityTrigger);
    await user.click(await screen.findByRole("option", { name: /Da Nang/ }));

    await waitFor(() => {
      expect(useTripWizardStore.getState().data.destination).toBe(
        "Da Nang, Vietnam",
      );
    });
    expect(useTripWizardStore.getState().data.countryIdKey).toBe("vn");
    expect(useTripWizardStore.getState().data.cityIdKey).toBe("da_nang");
  });

  it("shows an insights badge for cities with hasRagInsight and not for others", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WizardDestinationPickers />);

    await waitFor(() => screen.getByRole("combobox"));
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /Vietnam/ }));

    const [, cityTrigger] = screen.getAllByRole("combobox");
    await user.click(cityTrigger);

    const daNangOption = await screen.findByRole("option", { name: /Da Nang/ });
    const hanoiOption = screen.getByRole("option", { name: /Hanoi/ });
    expect(daNangOption).toHaveTextContent("Insights");
    expect(hanoiOption).not.toHaveTextContent("Insights");
  });

  it("resets the destination when switching to a different country", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WizardDestinationPickers />);

    await waitFor(() => screen.getByRole("combobox"));
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /Vietnam/ }));
    const [, cityTrigger] = screen.getAllByRole("combobox");
    await user.click(cityTrigger);
    await user.click(await screen.findByRole("option", { name: /Da Nang/ }));
    await waitFor(() =>
      expect(useTripWizardStore.getState().data.destination).toBe(
        "Da Nang, Vietnam",
      ),
    );

    const [countryTrigger] = screen.getAllByRole("combobox");
    await user.click(countryTrigger);
    await user.click(await screen.findByRole("option", { name: /Japan/ }));

    expect(useTripWizardStore.getState().data.destination).toBe("");
    expect(useTripWizardStore.getState().data.countryIdKey).toBeUndefined();
  });
});

describe("WizardDestinationPickers — hydration", () => {
  it("hydrates both pickers from existing countryIdKey/cityIdKey in the store", async () => {
    act(() => {
      useTripWizardStore.getState().setData({
        destination: "Da Nang, Vietnam",
        countryIdKey: "vn",
        cityIdKey: "da_nang",
      });
    });
    renderWithProviders(<WizardDestinationPickers />);

    await waitFor(() => {
      const triggers = screen.getAllByRole("combobox");
      expect(triggers).toHaveLength(2);
      expect(triggers[0]).toHaveTextContent("Vietnam");
      expect(triggers[1]).toHaveTextContent("Da Nang");
    });
  });

  it("hydrates from free-text 'City, Country' when no idKeys are stored", async () => {
    act(() => {
      useTripWizardStore.getState().setData({ destination: "Hanoi, Vietnam" });
    });
    renderWithProviders(<WizardDestinationPickers />);

    await waitFor(() => {
      const triggers = screen.getAllByRole("combobox");
      expect(triggers).toHaveLength(2);
      expect(triggers[0]).toHaveTextContent("Vietnam");
      expect(triggers[1]).toHaveTextContent("Hanoi");
    });
  });
});

describe("WizardDestinationPickers — empty API response", () => {
  it("shows the placeholder label and empty state when there are no countries", async () => {
    server.use(
      http.get("*/destinations", () =>
        HttpResponse.json({ success: true, countries: [] }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<WizardDestinationPickers />);

    const trigger = await screen.findByRole("combobox");
    expect(trigger).toHaveTextContent("Select country");
    await user.click(trigger);
    expect(await screen.findByText("No matches")).toBeInTheDocument();
  });
});
