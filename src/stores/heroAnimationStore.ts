import { persistentAtom } from "@nanostores/persistent";

export const $heroAnimationStore = persistentAtom<"true" | "false">(
  "heroAnimationShown",
  "false",
);

export function markHeroAnimationShown() {
  $heroAnimationStore.set("true");
}

export function resetHeroAnimation() {
  $heroAnimationStore.set("false");
}

export function hasHeroAnimationBeenShown(): boolean {
  return $heroAnimationStore.get() === "true";
}
