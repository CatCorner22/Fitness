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
  { value: "sled", label: "Sled" },
  { value: "cardio_machine", label: "Cardio machine" },
  { value: "pole", label: "Pole (home or studio)" },
  { value: "backpack", label: "Backpack / ruck" },
];

const ALLOWED = new Set(EQUIPMENT_OPTIONS.map((item) => item.value));

export function listedEquipment(formData: FormData, fallback: string[]) {
  const picked = formData
    .getAll("equipment")
    .map(String)
    .filter((item): item is Equipment => ALLOWED.has(item as Equipment))
    .slice(0, 24);
  return JSON.stringify(picked.length ? picked : fallback);
}
