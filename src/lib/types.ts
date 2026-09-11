export type PollType = "single" | "multi";
export type PollStatus = "open" | "settled";
export type OptionSource = "creator" | "suggestion";
export type SuggestionStatus = "pending" | "approved" | "declined";

export interface VoterRef {
  name: string;
  seed: string;
  tint: string;
}

export interface OptionView {
  id: string;
  label: string;
  source: OptionSource;
  suggestedBy?: VoterRef;
  /** Suggestion state — only present when relevant (creator moderation). */
  suggestionStatus?: SuggestionStatus;
  votesCount: number;
  percentage: number;
  relativePercentageToLeader: number;
  isLeader: boolean;
  /** Attribution — only included once a poll is settled. */
  backers?: VoterRef[];
}

export interface PendingSuggestionView {
  id: string;
  label: string;
  suggestedBy: VoterRef;
}

export interface DeclinedSuggestionView {
  id: string;
  label: string;
  suggestedBy: VoterRef;
}

/**
 * Public shape of a poll. Attribution (backers) is never included while a
 * poll is open — that is an API decision, mirrored by the UI.
 */
export interface PollView {
  id: string;
  slug: string;
  title: string;
  type: PollType;
  maxChoices: number;
  suggestionsEnabled: boolean;
  status: PollStatus;
  createdAt: string;
  closesAt: string;
  settledAt: string | null;
  totalVotes: number;
  uniqueVoters: number;
  isTied: boolean;
  leadingIds: string[];
  options: OptionView[];
  /** Creator-only extras */
  isMine?: boolean;
  pendingSuggestions?: PendingSuggestionView[];
  declinedSuggestions?: DeclinedSuggestionView[];
  /** Attributed lead for the reveal: "Priya, Ada, Kai + 2 more backed it" */
  winnerAttribution?: string;
  tieBrokenOptionId?: string;
  retired?: boolean;
}

export interface AvatarData {
  seed: string;
  tint: string;
}