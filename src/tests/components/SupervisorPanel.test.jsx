import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SupervisorPanel from "../../components/SupervisorPanel";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock Firebase
vi.mock("../../firebase", () => ({
  auth: { currentUser: { uid: "admin-uid" } },
  signOut: vi.fn(() => Promise.resolve()),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_API_DOMAIN: "http://localhost:8000",
  },
});

const mockTalentData = [
  {
    submissionId: "test123",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "123-456-7890",
    bio: "Test bio",
    timestamp: "08/10/2025, 10:30:00 AM",
    files: {
      photo: "photo.jpg",
    },
  },
];

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("SupervisorPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTalentData),
      })
    );
  });

  it("renders loading state initially", () => {
    renderWithRouter(<SupervisorPanel />);

    expect(screen.getByText("Loading talents...")).toBeInTheDocument();
  });

  it("displays talent data in table", async () => {
    renderWithRouter(<SupervisorPanel />);

    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
      expect(screen.getByText("Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
  });

  it("shows table headers", async () => {
    renderWithRouter(<SupervisorPanel />);
    // Mock Firebase
    vi.mock("../../firebase", () => ({
      auth: { currentUser: { uid: "admin-uid" } },
      signOut: vi.fn(() => Promise.resolve()),
    }));

    // Mock react-router-dom
    const mockNavigate = vi.fn();
    vi.mock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom");
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    // Mock environment variables
    Object.defineProperty(import.meta, "env", {
      value: {
        VITE_API_DOMAIN: "http://localhost:8000",
      },
    });

    const mockTalentData = [
      {
        submissionId: "test123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        bio: "Test bio",
        role: "DJ",
        timestamp: "2024-01-01T10:30:00Z",
        files: {
          photo: "photo.jpg",
          taxForm: "w9.pdf",
          performerImages: ["image1.jpg", "image2.jpg"],
        },
      },
    ];

    const renderWithRouter = (component) => {
      return render(<BrowserRouter>{component}</BrowserRouter>);
    };

    describe("SupervisorPanel", () => {
      beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTalentData),
          })
        );
        global.confirm = vi.fn(() => true);
      });

      it("renders loading state initially", () => {
        renderWithRouter(<SupervisorPanel />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });

      it("displays talent data in table", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          expect(screen.getByText("John")).toBeInTheDocument();
          expect(screen.getByText("Doe")).toBeInTheDocument();
          expect(screen.getByText("john@example.com")).toBeInTheDocument();
        });
      });

      it("shows table headers", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          expect(screen.getByText("First Name")).toBeInTheDocument();
          expect(screen.getByText("Last Name")).toBeInTheDocument();
          expect(screen.getByText("Email")).toBeInTheDocument();
        });
      });

      it("shows edit and delete buttons for each talent", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          expect(screen.getByText("Edit")).toBeInTheDocument();
          expect(screen.getByText("Delete")).toBeInTheDocument();
        });
      });

      it("handles empty talent list", async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        );

        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          // When empty, the table still renders but with no data rows
          expect(screen.getByText("First Name")).toBeInTheDocument();
          expect(screen.queryByText("John")).not.toBeInTheDocument();
        });
      });

      it("handles fetch error", async () => {
        global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          expect(screen.getByText(/Error:/)).toBeInTheDocument();
        });
      });

      it("displays logout button", () => {
        renderWithRouter(<SupervisorPanel />);

        expect(screen.getByTitle("Logout")).toBeInTheDocument();
      });

      it("displays company logo", () => {
        renderWithRouter(<SupervisorPanel />);

        expect(screen.getByAltText("Company Logo")).toBeInTheDocument();
      });

      it("enters edit mode when edit button is clicked", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          expect(screen.getByText("Edit")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Edit"));

        await waitFor(() => {
          expect(screen.getByText("Save")).toBeInTheDocument();
          expect(screen.getByText("Cancel")).toBeInTheDocument();
        });
      });

      it("shows input fields in edit mode", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Edit"));
        });

        await waitFor(() => {
          const firstNameInput = screen.getByDisplayValue("John");
          const lastNameInput = screen.getByDisplayValue("Doe");
          expect(firstNameInput).toBeInTheDocument();
          expect(lastNameInput).toBeInTheDocument();
        });
      });

      it("cancels edit mode when cancel button is clicked", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Edit"));
        });

        await waitFor(() => {
          fireEvent.click(screen.getByText("Cancel"));
        });

        await waitFor(() => {
          expect(screen.getByText("Edit")).toBeInTheDocument();
          expect(screen.queryByText("Save")).not.toBeInTheDocument();
        });
      });

      it("validates bio field in edit mode", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Edit"));
        });

        const bioInput = screen.getByDisplayValue("Test bio");
        fireEvent.change(bioInput, { target: { value: "aaaaaaaaaaaaa" } });

        await waitFor(() => {
          expect(
            screen.getByText(
              "Bio cannot contain more than 10 consecutive same characters"
            )
          ).toBeInTheDocument();
        });
      });

      it("disables save button when bio validation fails", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Edit"));
        });

        const bioInput = screen.getByDisplayValue("Test bio");
        fireEvent.change(bioInput, { target: { value: "aaaaaaaaaaaaa" } });

        await waitFor(() => {
          const saveButton = screen.getByText("Save");
          expect(saveButton).toBeDisabled();
        });
      });

      it("handles save operation", async () => {
        global.fetch = vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTalentData),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });

        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Edit"));
        });

        const firstNameInput = screen.getByDisplayValue("John");
        fireEvent.change(firstNameInput, { target: { value: "Jane" } });

        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            "http://localhost:8000/backend/update_talent.php",
            expect.objectContaining({
              method: "POST",
            })
          );
        });
      });

      it("handles delete operation with confirmation", async () => {
        global.fetch = vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTalentData),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });

        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Delete"));
        });

        expect(global.confirm).toHaveBeenCalledWith(
          "Are you sure you want to delete this record?"
        );
      });

      it("does not delete when confirmation is cancelled", async () => {
        global.confirm = vi.fn(() => false);

        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Delete"));
        });

        expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial fetch
      });

      it("displays file links correctly", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          expect(screen.getByText("View")).toBeInTheDocument();
          expect(screen.getByText("Download")).toBeInTheDocument();
          expect(screen.getByText("Image 1")).toBeInTheDocument();
          expect(screen.getByText("Image 2")).toBeInTheDocument();
        });
      });

      it('displays "no data" for missing fields', async () => {
        const emptyTalent = [
          {
            submissionId: "test456",
            firstName: "",
            lastName: "",
            email: "",
          },
        ];

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(emptyTalent),
          })
        );

        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          const noDataElements = screen.getAllByText("no data");
          expect(noDataElements.length).toBeGreaterThan(0);
        });
      });

      it("formats timestamp correctly", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          // Should display formatted timestamp in US format
          expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
        });
      });

      it("handles logout", async () => {
        const mockSignOut = vi.fn();
        vi.mocked(require("../../firebase").signOut).mockImplementation(
          mockSignOut
        );

        renderWithRouter(<SupervisorPanel />);

        fireEvent.click(screen.getByTitle("Logout"));

        expect(mockSignOut).toHaveBeenCalled();
      });

      it("displays row numbers correctly", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          expect(screen.getByText("1")).toBeInTheDocument();
        });
      });

      it("shows alternating row colors", async () => {
        const multipleTalents = [
          ...mockTalentData,
          {
            submissionId: "test456",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
          },
        ];

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(multipleTalents),
          })
        );

        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          expect(screen.getByText("Jane")).toBeInTheDocument();
        });
      });

      it("shows loading state for actions", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Edit"));
        });

        const saveButton = screen.getByText("Save");
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(screen.getByText("Saving...")).toBeInTheDocument();
        });
      });

      it("handles bio validation for repetitive words", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Edit"));
        });

        const bioInput = screen.getByDisplayValue("Test bio");
        fireEvent.change(bioInput, {
          target: { value: "hello hello hello hello hello hello" },
        });

        await waitFor(() => {
          expect(
            screen.getByText(
              "Bio cannot repeat the same word more than 5 times"
            )
          ).toBeInTheDocument();
        });
      });

      it("handles bio validation for repetitive phrases", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          fireEvent.click(screen.getByText("Edit"));
        });

        const bioInput = screen.getByDisplayValue("Test bio");
        fireEvent.change(bioInput, {
          target: { value: "I am great I am great I am great" },
        });

        await waitFor(() => {
          expect(
            screen.getByText(
              "Bio cannot repeat the same phrase more than 2 times"
            )
          ).toBeInTheDocument();
        });
      });

      it("displays profile photo when available", async () => {
        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          const profileImage = screen.getByAltText("Profile");
          expect(profileImage).toBeInTheDocument();
          expect(profileImage).toHaveAttribute(
            "src",
            expect.stringContaining("photo.jpg")
          );
        });
      });

      it('displays "No Photo" placeholder when photo not available', async () => {
        const talentWithoutPhoto = [
          {
            ...mockTalentData[0],
            files: {},
          },
        ];

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(talentWithoutPhoto),
          })
        );

        renderWithRouter(<SupervisorPanel />);

        await waitFor(() => {
          expect(screen.getByText("No Photo")).toBeInTheDocument();
        });
      });
    });
  });
});

it("handles empty talent list", async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  );

  renderWithRouter(<SupervisorPanel />);

  await waitFor(() => {
    expect(screen.getByText("No talents found.")).toBeInTheDocument();
  });
});
