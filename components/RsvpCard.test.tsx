import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RsvpCard from "./RsvpCard";

const guests = [
  { id: "g1", name: "Ana", rsvpStatus: "pending" as const },
  { id: "g2", name: "Bruno", rsvpStatus: "pending" as const },
];

describe("RsvpCard", () => {
  it("renders one row per guest", () => {
    render(<RsvpCard guests={guests} onRespond={vi.fn()} />);

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
  });

  it("calls onRespond with the guest id and chosen status", async () => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<RsvpCard guests={guests} onRespond={onRespond} />);

    const anaConfirmButtons = screen.getAllByRole("button", {
      name: /sim, vou comparecer/i,
    });
    await userEvent.click(anaConfirmButtons[0]);

    await waitFor(() =>
      expect(onRespond).toHaveBeenCalledWith("g1", "confirmed")
    );
  });

  it("calls onRespond with declined for the no button", async () => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<RsvpCard guests={guests} onRespond={onRespond} />);

    const declineButtons = screen.getAllByRole("button", {
      name: /não vou poder comparecer/i,
    });
    await userEvent.click(declineButtons[1]);

    await waitFor(() =>
      expect(onRespond).toHaveBeenCalledWith("g2", "declined")
    );
  });
});
