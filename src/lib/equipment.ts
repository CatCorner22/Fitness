import type { Equipment } from "@/lib/types";

export const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "cable", label: "Cable" },
  { value: "machine", label: "Machine" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "bands", label: "Bands" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "pullup_bar", label: "Pull-up bar" },
  { value: "bench", label: "Bench" },
  { value: "hip_thrust_bench", label: "Hip thrust bench" },
  { value: "trap_bar", label: "Trap bar" },
  { value: "landmine", label: "Landmine" },
  { value: "cardio_machine", label: "Cardio machine" },
  { value: "pole", label: "Pole (home or studio)" },
  { value: "backpack", label: "Backpack / ruck" },
];
