// Initial seed for the fake database.
// Dates are generated relative to the seeding moment so the demo
// always looks fresh, no matter when the app is first opened.

const DAY_MS = 24 * 60 * 60 * 1000;

function isoInDays(offsetDays) {
  return new Date(Date.now() + offsetDays * DAY_MS).toISOString();
}

/**
 * Extended task model — much richer than the original starter sample.
 *
 * id            number
 * name          string  (title of the task)
 * status        "open" | "in-progress" | "done"
 * priority      "low" | "medium" | "high" | "critical"
 * assignee      string
 * dueDate       string (ISO) | null
 * ---------- fields below exist ONLY in the detailed record ----------
 * description   string
 * category      string
 * estimateHours number
 * createdAt     string (ISO)
 * updatedAt     string (ISO)
 */
const SEED = [
  {
    name: "Repair the oxygen recycler",
    status: "in-progress",
    priority: "critical",
    assignee: "Alice Zhang",
    category: "Engineering",
    description:
      "CO2 scrubber efficiency dropped to 71% after the last filter swap. Disassemble the unit, inspect the sorbent bed and replace the cartridges if channelling is found.",
    estimateHours: 14,
    createdAgoDays: -6,
    dueInDays: 2,
  },
  {
    name: "Update navigation firmware",
    status: "open",
    priority: "high",
    assignee: "Bob Karimov",
    category: "Software",
    description:
      "Flash the nav-computer to firmware 4.2.1. Includes the fix for star-tracker drift above 40 degrees pitch. Requires a scheduled 20-minute attitude hold.",
    estimateHours: 8,
    createdAgoDays: -12,
    dueInDays: 9,
  },
  {
    name: "Calibrate solar array #3",
    status: "open",
    priority: "medium",
    assignee: "Chen Wei",
    category: "Engineering",
    description:
      "Array #3 yields 8% less than its twin. Run the full sun-tracking calibration routine and re-zero the torque motors afterwards.",
    estimateHours: 6,
    createdAgoDays: -4,
    dueInDays: 12,
  },
  {
    name: "Inventory of medical kits",
    status: "done",
    priority: "low",
    assignee: "Dana Smith",
    category: "Medical",
    description:
      "Count and re-seal all trauma and burn kits in modules A-C. Expired analgesics must be logged and disposed of.",
    estimateHours: 3,
    createdAgoDays: -20,
    dueInDays: -8,
  },
  {
    name: "Draft EVA safety protocol v2",
    status: "in-progress",
    priority: "high",
    assignee: "Alice Zhang",
    category: "Safety",
    description:
      "Merge the new tether rules with the 2025 airlock checklist. Add a go/no-go table for solar-storm warnings.",
    estimateHours: 10,
    createdAgoDays: -9,
    dueInDays: 5,
  },
  {
    name: "Fix the water leak in module B",
    status: "done",
    priority: "critical",
    assignee: "Bob Karimov",
    category: "Engineering",
    description:
      "The condensate line behind panel B-7 was dripping onto the power bus. Replace the coupling and dry-run the circuit.",
    estimateHours: 9,
    createdAgoDays: -15,
    dueInDays: -4,
  },
  {
    name: "Test the backup comms antenna",
    status: "open",
    priority: "medium",
    assignee: "Elena Petrova",
    category: "Comms",
    description:
      "Deploy the backup high-gain antenna and run a full link-budget test with the ground station. Record SNR across three passes.",
    estimateHours: 4,
    createdAgoDays: -3,
    dueInDays: 16,
  },
  {
    name: "Prepare crew training schedule",
    status: "open",
    priority: "low",
    assignee: "Dana Smith",
    category: "HR",
    description:
      "Build the Q4 micro-g refresher schedule for all six crew members. Avoid overlapping with EVA windows.",
    estimateHours: 5,
    createdAgoDays: -2,
    dueInDays: 20,
  },
  {
    name: "Inspect docking port seals",
    status: "done",
    priority: "high",
    assignee: "Chen Wei",
    category: "Engineering",
    description:
      "Ultrasound-scan both docking port seals after the last cargo undocking. Document any micro-cracks found.",
    estimateHours: 7,
    createdAgoDays: -30,
    dueInDays: -10,
  },
  {
    name: "Analyze greenhouse soil samples",
    status: "in-progress",
    priority: "medium",
    assignee: "Elena Petrova",
    category: "Science",
    description:
      "Run pH and nitrate analysis on the batch-12 samples. Compare against batch-11 to validate the new nutrient mix.",
    estimateHours: 12,
    createdAgoDays: -5,
    dueInDays: 7,
  },
  {
    name: "Patch thermal shield tiles",
    status: "open",
    priority: "high",
    assignee: "Bob Karimov",
    category: "Engineering",
    description:
      "Three tiles on the sun-facing truss show delamination. Apply the repair compound during the next night pass.",
    estimateHours: 16,
    createdAgoDays: -7,
    dueInDays: 11,
  },
  {
    name: "Update evacuation map",
    status: "open",
    priority: "medium",
    assignee: "Alice Zhang",
    category: "Safety",
    description:
      "Module D routes changed after the rack upgrade. Re-print all station evacuation maps and brief the crew.",
    estimateHours: 4,
    createdAgoDays: -1,
    dueInDays: 25,
  },
  {
    name: "Service the 3D printer",
    status: "done",
    priority: "low",
    assignee: "Chen Wei",
    category: "Maintenance",
    description:
      "Clean the print head, tension the belts and run the calibration cube. Log the remaining filament stock.",
    estimateHours: 2,
    createdAgoDays: -18,
    dueInDays: -6,
  },
  {
    name: "Review radiation logs",
    status: "open",
    priority: "medium",
    assignee: "Dana Smith",
    category: "Science",
    description:
      "Check dosimeter logs from the last solar event. Flag any crew member above 80% of the monthly limit.",
    estimateHours: 6,
    createdAgoDays: -2,
    dueInDays: 14,
  },
];

export function buildInitialData() {
  return SEED.map((item, index) => {
    const createdAt = isoInDays(item.createdAgoDays);
    return {
      id: index + 1,
      name: item.name,
      status: item.status,
      priority: item.priority,
      assignee: item.assignee,
      category: item.category,
      description: item.description,
      estimateHours: item.estimateHours,
      dueDate: isoInDays(item.dueInDays),
      createdAt,
      // completed tasks were "updated" closer to their due date
      updatedAt:
        item.status === "done" ? isoInDays(item.dueInDays - 1) : createdAt,
    };
  });
}
