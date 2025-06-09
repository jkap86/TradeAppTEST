import { Draftpick } from "@/lib/types";

export const getPickName = (pick: Draftpick) => {
  const pick_name = pick.order
    ? `${pick.season} ${pick.round}.${pick.order.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
      })}`
    : `${pick.season} Round ${pick.round} ${`(${
        pick.original_user.username +
        (pick.original_user.username === "Orphan" ? `_${pick.roster_id}` : "")
      })`}`;

  return pick_name;
};
