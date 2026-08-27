import { v4 as uuidv4 } from "uuid";

// One identity per clock tap, sent along with the request and reused if that
// same tap has to be retried, so the server can tell a retry from a deliberate
// second punch. Without it a re-tap after a lost response lands between the
// 10s cooldown and the 30s cancel window and is recorded as an undo, deleting
// the check-in the employee believed had failed.
//
// Mirrors iot.exalise.com's src/utils/clockEventId.ts - the server-side
// contract is shared, so the two must agree on the TTL.

export const PENDING_CLOCK_EVENT_TTL_MS = 90_000;

export type PendingClockEvent = { id: string; at: number };

/**
 * The id to send with this attempt: the pending one if it is still recent
 * enough to be a retry of the same tap, otherwise a fresh one.
 *
 * The TTL matters. Holding an id indefinitely would make a deliberate second
 * punch minutes later replay the first result forever, which is a worse failure
 * than the duplicate it set out to prevent.
 */
export function clockEventIdFor(
  pending: PendingClockEvent | null,
  now: number = Date.now()
): PendingClockEvent {
  if (pending && now - pending.at < PENDING_CLOCK_EVENT_TTL_MS) return pending;
  return { id: uuidv4(), at: now };
}
